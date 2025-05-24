import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  BlockStack,
  InlineStack,
  TextField,
  FormLayout,
  Divider,
  Modal,
  DataTable,
  Icon,
  Badge,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { PlusIcon, DeleteIcon, EditIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import {
  getTiers,
  getTierById,
  createTier,
  updateTier,
  createTierBenefit,
  deleteTierBenefit,
} from "../services/tier.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  try {
    // Fetch tiers from the database
    const dbTiers = await getTiers();

    // Transform the data to match the expected format in the UI
    const tiers = dbTiers.map((tier) => ({
      id: tier.id,
      name: tier.name,
      spendThreshold: tier.minSpend,
      maxSpend: tier.maxSpend,
      benefits: tier.benefits.map((benefit) => benefit.name),
      description: tier.description || "",
      color: tier.description?.includes("#") ? tier.description : "#E0E0E0", // Use description field to store color temporarily
    }));

    // If no tiers exist yet, create default tiers
    if (tiers.length === 0) {
      const defaultTiers = [
        {
          name: "Featherweight",
          description: "#E0E0E0",
          minSpend: 0,
          benefits: ["Welcome gift", "Birthday reward", "Exclusive newsletter"],
        },
        {
          name: "Lightweight",
          description: "#FFD23F",
          minSpend: 1500,
          benefits: [
            "All Featherweight benefits",
            "Early access to sales",
            "Free shipping on orders over $50",
          ],
        },
        {
          name: "Welterweight",
          description: "#FF7C2A",
          minSpend: 5000,
          benefits: [
            "All Lightweight benefits",
            "Double points on purchases",
            "Exclusive product access",
          ],
        },
        {
          name: "Heavyweight",
          description: "#00B8A2",
          minSpend: 25000,
          benefits: [
            "All Welterweight benefits",
            "Free shipping on all orders",
            "VIP customer service",
          ],
        },
        {
          name: "Reigning Champion",
          description: "#1F2937",
          minSpend: 9999999, // Effectively invite-only (unattainable value)
          benefits: [
            "All Heavyweight benefits",
            "Personal shopping assistant",
            "Exclusive events access",
            "Annual gift",
            "Invite-only status",
          ],
        },
      ];

      // Create the default tiers in the database
      for (const tierData of defaultTiers) {
        const tier = await createTier({
          name: tierData.name,
          description: tierData.description,
          minSpend: tierData.minSpend,
        });

        // Create benefits for this tier
        for (const benefitName of tierData.benefits) {
          await createTierBenefit({
            name: benefitName,
            description: benefitName,
            tierId: tier.id,
          });
        }
      }

      // Fetch the newly created tiers
      const newDbTiers = await getTiers();
      const newTiers = newDbTiers.map((tier) => ({
        id: tier.id,
        name: tier.name,
        spendThreshold: tier.minSpend,
        maxSpend: tier.maxSpend,
        benefits: tier.benefits.map((benefit) => benefit.name),
        description: tier.description || "",
        color: tier.description?.includes("#") ? tier.description : "#E0E0E0",
      }));

      return json({ tiers: newTiers });
    }

    return json({ tiers });
  } catch (error) {
    console.error("Error loading tiers:", error);
    return json({
      tiers: [],
      error: "Failed to load tiers. Please try again later.",
    });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action") as string;

  try {
    if (action === "updateTier") {
      const tierId = formData.get("tierId") as string;
      const name = formData.get("name") as string;
      const minSpend = parseFloat(formData.get("minSpend") as string);
      const color = formData.get("color") as string;
      const benefits = JSON.parse(formData.get("benefits") as string);

      // Update the tier
      await updateTier({
        id: tierId,
        name,
        description: color, // Store color in description field
        minSpend,
      });

      // Get current benefits for this tier
      const tier = await getTierById(tierId);
      if (!tier) {
        return json({ success: false, error: "Tier not found" });
      }

      // Delete existing benefits
      for (const benefit of tier.benefits) {
        await deleteTierBenefit(benefit.id);
      }

      // Create new benefits
      for (const benefitName of benefits) {
        await createTierBenefit({
          name: benefitName,
          description: benefitName,
          tierId,
        });
      }

      return json({ success: true });
    }

    return json({ success: false, error: "Invalid action" });
  } catch (error) {
    console.error("Error in action:", error);
    return json({ success: false, error: "An error occurred" });
  }
};

export default function TiersPage() {
  const { tiers } = useLoaderData<typeof loader>();
  const [editingTier, setEditingTier] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBenefit, setNewBenefit] = useState("");
  const submit = useSubmit();

  const handleEditTier = (tier: any) => {
    setEditingTier({ ...tier, benefits: [...tier.benefits] });
    setIsModalOpen(true);
  };

  const handleAddBenefit = () => {
    if (newBenefit.trim() && editingTier) {
      setEditingTier({
        ...editingTier,
        benefits: [...editingTier.benefits, newBenefit.trim()],
      });
      setNewBenefit("");
    }
  };

  const handleRemoveBenefit = (index: number) => {
    if (editingTier) {
      const newBenefits = [...editingTier.benefits];
      newBenefits.splice(index, 1);
      setEditingTier({
        ...editingTier,
        benefits: newBenefits,
      });
    }
  };

  const handleSaveTier = () => {
    if (editingTier) {
      const formData = new FormData();
      formData.append("action", "updateTier");
      formData.append("tierId", editingTier.id);
      formData.append("name", editingTier.name);

      // If this is the Reigning Champion tier, always use the special high value
      const minSpend =
        editingTier.name === "Reigning Champion"
          ? "9999999"
          : editingTier.spendThreshold.toString();

      formData.append("minSpend", minSpend);
      formData.append("color", editingTier.color);
      formData.append("benefits", JSON.stringify(editingTier.benefits));

      submit(formData, { method: "post" });
      setIsModalOpen(false);
      setEditingTier(null);
    }
  };

  const rows = tiers.map((tier) => [
    <Text key={`name-${tier.id}`} variant="bodyMd" fontWeight="bold" as="span">
      {tier.name}
    </Text>,
    <Text key={`threshold-${tier.id}`} variant="bodyMd" as="span">
      {tier.name === "Reigning Champion" || tier.spendThreshold >= 9999999
        ? "Invite Only"
        : `$${tier.spendThreshold.toLocaleString()}`}
    </Text>,
    <div key={`benefits-${tier.id}`}>
      {tier.benefits.map((benefit, index) => (
        <div key={`benefit-${tier.id}-${index}`}>{benefit}</div>
      ))}
    </div>,
    <div
      key={`color-${tier.id}`}
      style={{ display: "flex", alignItems: "center" }}
    >
      <div
        style={{
          width: "20px",
          height: "20px",
          backgroundColor: tier.color,
          borderRadius: "4px",
          marginRight: "8px",
        }}
      />
      {tier.color}
    </div>,
    <InlineStack key={`actions-${tier.id}`} gap="200" align="end">
      <Button
        variant="tertiary"
        onClick={() => handleEditTier(tier)}
        icon={<Icon source={EditIcon} />}
      >
        Edit
      </Button>
    </InlineStack>,
  ]);

  return (
    <Page fullWidth>
      <TitleBar title="Loyalty Tiers" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Tier Configuration
                </Text>
                <Text as="p" variant="bodyMd">
                  Configure your loyalty program tiers. Customers will be
                  automatically assigned to tiers based on their total spend.
                </Text>
                <DataTable
                  columnContentTypes={["text", "text", "text", "text", "text"]}
                  headings={[
                    "Tier Name",
                    "Spend Threshold",
                    "Benefits",
                    "Color",
                    "Actions",
                  ]}
                  rows={rows}
                />
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Tier Visualization
                </Text>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  {tiers.map((tier, index) => (
                    <div
                      key={tier.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "16px",
                        borderRadius: "8px",
                        backgroundColor: "rgba(0, 0, 0, 0.05)",
                      }}
                    >
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          backgroundColor: tier.color,
                          borderRadius: "4px",
                          marginRight: "16px",
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <Text variant="headingSm" as="p">
                          {tier.name}
                        </Text>
                        <Text variant="bodySm" as="p">
                          {tier.name === "Reigning Champion" ||
                          tier.spendThreshold >= 9999999 ? (
                            "Invite Only"
                          ) : (
                            <>
                              ${tier.spendThreshold.toLocaleString()}
                              {index < tiers.length - 1 &&
                              tiers[index + 1].spendThreshold !== null &&
                              tiers[index + 1].spendThreshold < 9999999
                                ? ` - $${(Number(tiers[index + 1].spendThreshold) - 0.01).toLocaleString()}`
                                : "+"}
                            </>
                          )}
                        </Text>
                      </div>
                      <div>
                        <Badge
                          tone={index === tiers.length - 1 ? "success" : "info"}
                        >
                          {index === 0
                            ? "Starting Tier"
                            : index === tiers.length - 1
                              ? "Highest Tier"
                              : `Tier ${index + 1}`}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>

      <Modal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTier(null);
        }}
        title={`Edit ${editingTier?.name} Tier`}
        primaryAction={{
          content: "Save",
          onAction: handleSaveTier,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => {
              setIsModalOpen(false);
              setEditingTier(null);
            },
          },
        ]}
      >
        <Modal.Section>
          {editingTier && (
            <FormLayout>
              <TextField
                label="Tier Name"
                value={editingTier.name}
                onChange={(value) =>
                  setEditingTier({ ...editingTier, name: value })
                }
                autoComplete="off"
              />
              {editingTier.name === "Reigning Champion" ? (
                <BlockStack gap="200">
                  <Text variant="bodyMd" as="p">
                    This tier is invite-only and not based on spending
                    threshold.
                  </Text>
                  <TextField
                    label="Spend Threshold"
                    value="Invite Only"
                    disabled
                    autoComplete="off"
                  />
                </BlockStack>
              ) : (
                <TextField
                  label="Spend Threshold"
                  value={editingTier.spendThreshold.toString()}
                  onChange={(value) =>
                    setEditingTier({
                      ...editingTier,
                      spendThreshold: parseInt(value) || 0,
                    })
                  }
                  prefix="$"
                  type="number"
                  autoComplete="off"
                />
              )}
              <TextField
                label="Color"
                value={editingTier.color}
                onChange={(value) =>
                  setEditingTier({ ...editingTier, color: value })
                }
                autoComplete="off"
              />
              <Divider />
              <Text variant="headingSm" as="h3">
                Benefits
              </Text>
              <BlockStack gap="400">
                {editingTier.benefits.map((benefit: string, index: number) => (
                  <InlineStack key={index} align="space-between">
                    <Text variant="bodyMd" as="span">
                      {benefit}
                    </Text>
                    <Button
                      variant="plain"
                      onClick={() => handleRemoveBenefit(index)}
                      icon={<Icon source={DeleteIcon} />}
                    >
                      Remove
                    </Button>
                  </InlineStack>
                ))}
                <InlineStack gap="200">
                  <div style={{ flex: 1 }}>
                    <TextField
                      label=""
                      value={newBenefit}
                      onChange={setNewBenefit}
                      placeholder="Add a new benefit"
                      autoComplete="off"
                    />
                  </div>
                  <div style={{ marginTop: "4px" }}>
                    <Button
                      onClick={handleAddBenefit}
                      icon={<Icon source={PlusIcon} />}
                    >
                      Add
                    </Button>
                  </div>
                </InlineStack>
              </BlockStack>
            </FormLayout>
          )}
        </Modal.Section>
      </Modal>
    </Page>
  );
}
