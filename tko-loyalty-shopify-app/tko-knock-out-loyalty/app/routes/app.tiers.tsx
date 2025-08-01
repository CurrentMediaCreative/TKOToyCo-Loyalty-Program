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
  createTierWithRangeAdjustment,
  updateTierWithRangeAdjustment,
} from "../services/tier.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  try {
    // Fetch tiers from the database
    const dbTiers = await getTiers();

    // Transform the data to match the expected format in the UI
    const tiers = dbTiers.map((tier: any) => ({
      id: tier.id,
      name: tier.name,
      spendThreshold: tier.minPoints,
      maxSpend: tier.maxPoints,
      benefits: tier.benefits.map((benefit: any) => benefit.name),
      description: tier.description || "",
      color: tier.description?.includes("#") ? tier.description : "#E0E0E0", // Use description field to store color temporarily
    }));

    // If no tiers exist yet, create default tiers with updated thresholds and real benefits
    if (tiers.length === 0) {
      const defaultTiers = [
        {
          name: "🥊 Featherweight",
          description: "#E0E0E0",
          minPoints: 0,
          maxPoints: 1499,
          benefits: [
            "Store Wide Bonus Point Days",
            "Community Bonus Points (Events + Tournaments)",
            "Discord Access",
          ],
        },
        {
          name: "🥋 Lightweight",
          description: "#FFD23F",
          minPoints: 1500,
          maxPoints: 4999,
          benefits: [
            "All Featherweight benefits",
            "3% Singles Discount",
            "1% Sealed Discount",
            "5% Supplies Discount",
            "5% Toys & Board Games Discount",
          ],
        },
        {
          name: "🥇 Welterweight",
          description: "#FF7C2A",
          minPoints: 5000,
          maxPoints: 29999,
          benefits: [
            "All Lightweight benefits",
            "1.25x Points Per $1 Spent",
            "7% Singles Discount",
            "2% Sealed Discount",
            "10% Supplies Discount",
            "8% Toys & Board Games Discount",
            "🎁 Birthday Gift ($25+ value)",
            "Store Wide BPDs + 2x Wed + 2x 1st",
            "Pre-Orders (case by case)",
            "Exclusive Early Access",
            "Priority Registration",
            "Same Day Lock",
            "Lock In Tier 1x",
          ],
        },
        {
          name: "🏅 Heavyweight",
          description: "#00B8A2",
          minPoints: 30000,
          maxPoints: null, // Open-ended until Reigning Champion
          benefits: [
            "All Welterweight benefits",
            "1.5x Points Per $1 Spent",
            "10% Singles Discount",
            "3% Sealed Discount",
            "15% Supplies Discount",
            "13% Toys & Board Games Discount",
            "🎁 Birthday Gift ($150+ value)",
            "All Above + Exclusive Events",
            "Guaranteed Pre-Orders (1 item/SKU)",
            "Preferred Member Pricing",
            "Private Tier Events",
            "Priority Channels",
            "48hrs Lock",
            "🎁 Quarterly Drop",
            "Lock In Tier 2x",
          ],
        },
        {
          name: "👑 Reigning Champion",
          description: "#1F2937",
          minPoints: 9999999, // Effectively invite-only (unattainable value)
          maxPoints: null,
          benefits: [
            "All Heavyweight benefits",
            "2x Points Per $1 Spent",
            "15% Singles Discount",
            "5% Sealed Discount",
            "20% Supplies Discount",
            "15% Toys & Board Games Discount",
            "🎁 Curated Premium Gift",
            "Custom-curated Offers",
            "Guaranteed Pre-Orders (1 case/SKU)",
            "Elite Priority Pricing",
            "VIP-only Invites",
            "Priority Channels",
            "72hr Lock",
            "🎁 Monthly Premium Bundle",
            "Invite-only status",
          ],
        },
      ];

      // Create the default tiers in the database
      for (const tierData of defaultTiers) {
        const tier = await createTier({
          name: tierData.name,
          description: tierData.description,
          minPoints: tierData.minPoints,
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
      const newTiers = newDbTiers.map((tier: any) => ({
        id: tier.id,
        name: tier.name,
        spendThreshold: tier.minPoints,
        maxSpend: tier.maxPoints,
        benefits: tier.benefits.map((benefit: any) => benefit.name),
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
      const minPoints = parseFloat(formData.get("minSpend") as string);
      const color = formData.get("color") as string;
      const benefits = JSON.parse(formData.get("benefits") as string);

      // Update the tier with smart range adjustment
      await updateTierWithRangeAdjustment({
        id: tierId,
        name,
        description: color, // Store color in description field
        minPoints,
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

    if (action === "createTier") {
      const name = formData.get("name") as string;
      const minPoints = parseFloat(formData.get("minSpend") as string);
      const color = formData.get("color") as string;
      const benefits = JSON.parse(formData.get("benefits") as string);

      // Create the tier with smart range adjustment
      const tier = await createTierWithRangeAdjustment({
        name,
        description: color, // Store color in description field
        minPoints,
      });

      // Create benefits for this tier
      for (const benefitName of benefits) {
        await createTierBenefit({
          name: benefitName,
          description: benefitName,
          tierId: tier.id,
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
  const [isCreating, setIsCreating] = useState(false);
  const submit = useSubmit();

  const handleEditTier = (tier: any) => {
    setEditingTier({ ...tier, benefits: [...tier.benefits] });
    setIsCreating(false);
    setIsModalOpen(true);
  };

  const handleCreateTier = () => {
    setEditingTier({
      id: "",
      name: "",
      spendThreshold: 0,
      maxSpend: null,
      benefits: [],
      description: "",
      color: "#E0E0E0",
    });
    setIsCreating(true);
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
      formData.append("action", isCreating ? "createTier" : "updateTier");

      if (!isCreating) {
        formData.append("tierId", editingTier.id);
      }

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
      setIsCreating(false);
    }
  };

  const rows = tiers.map((tier: any) => [
    <Text key={`name-${tier.id}`} variant="bodyMd" fontWeight="bold" as="span">
      {tier.name}
    </Text>,
    <Text key={`threshold-${tier.id}`} variant="bodyMd" as="span">
      {tier.name === "Reigning Champion" || tier.spendThreshold >= 9999999
        ? "Invite Only"
        : `${tier.spendThreshold.toLocaleString()} points`}
    </Text>,
    <div key={`benefits-${tier.id}`}>
      {tier.benefits.map((benefit: string, index: number) => (
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
            {/* Benefits Comparison Table */}
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <div>
                    <Text as="h2" variant="headingMd">
                      Tier Benefits Comparison
                    </Text>
                    <Text as="p" variant="bodyMd">
                      Compare benefits across all loyalty tiers. Click on any
                      benefit to edit.
                    </Text>
                  </div>
                </InlineStack>

                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "14px",
                    }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: "#f6f6f7" }}>
                        <th
                          style={{
                            padding: "12px",
                            textAlign: "left",
                            borderBottom: "1px solid #e1e3e5",
                            fontWeight: "600",
                            minWidth: "200px",
                          }}
                        >
                          Perk
                        </th>
                        <th
                          style={{
                            padding: "12px",
                            textAlign: "center",
                            borderBottom: "1px solid #e1e3e5",
                            fontWeight: "600",
                            minWidth: "150px",
                          }}
                        >
                          🥊 Featherweight
                          <br />
                          <span style={{ fontSize: "12px", color: "#6d7175" }}>
                            (0 – 1,499 pts)
                          </span>
                        </th>
                        <th
                          style={{
                            padding: "12px",
                            textAlign: "center",
                            borderBottom: "1px solid #e1e3e5",
                            fontWeight: "600",
                            minWidth: "150px",
                          }}
                        >
                          🥋 Lightweight
                          <br />
                          <span style={{ fontSize: "12px", color: "#6d7175" }}>
                            (1,500 – 4,999 pts)
                          </span>
                        </th>
                        <th
                          style={{
                            padding: "12px",
                            textAlign: "center",
                            borderBottom: "1px solid #e1e3e5",
                            fontWeight: "600",
                            minWidth: "150px",
                          }}
                        >
                          🥇 Welterweight
                          <br />
                          <span style={{ fontSize: "12px", color: "#6d7175" }}>
                            (5,000 – 29,999 pts)
                          </span>
                        </th>
                        <th
                          style={{
                            padding: "12px",
                            textAlign: "center",
                            borderBottom: "1px solid #e1e3e5",
                            fontWeight: "600",
                            minWidth: "150px",
                          }}
                        >
                          🏅 Heavyweight
                          <br />
                          <span style={{ fontSize: "12px", color: "#6d7175" }}>
                            (30,000+ pts)
                          </span>
                        </th>
                        <th
                          style={{
                            padding: "12px",
                            textAlign: "center",
                            borderBottom: "1px solid #e1e3e5",
                            fontWeight: "600",
                            minWidth: "150px",
                          }}
                        >
                          👑 Reigning Champion
                          <br />
                          <span style={{ fontSize: "12px", color: "#6d7175" }}>
                            (Invite Only)
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {
                          perk: "Points Per $1 Spent",
                          featherweight: "–",
                          lightweight: "–",
                          welterweight: "1.25x",
                          heavyweight: "1.5x",
                          reigningChampion: "2x",
                        },
                        {
                          perk: "Singles Discount",
                          featherweight: "–",
                          lightweight: "3%",
                          welterweight: "7%",
                          heavyweight: "10%",
                          reigningChampion: "15%",
                        },
                        {
                          perk: "Sealed Discount",
                          featherweight: "–",
                          lightweight: "1%",
                          welterweight: "2%",
                          heavyweight: "3%",
                          reigningChampion: "5%",
                        },
                        {
                          perk: "Supplies Discount",
                          featherweight: "–",
                          lightweight: "5%",
                          welterweight: "10%",
                          heavyweight: "15%",
                          reigningChampion: "20%",
                        },
                        {
                          perk: "Toys & Board Games Discount",
                          featherweight: "–",
                          lightweight: "5%",
                          welterweight: "8%",
                          heavyweight: "13%",
                          reigningChampion: "15%",
                        },
                        {
                          perk: "Birthday Gift",
                          featherweight: "–",
                          lightweight: "–",
                          welterweight: "🎁 Gift ($25+ value)",
                          heavyweight: "🎁 Gift ($150+ value)",
                          reigningChampion: "🎁 Curated Premium Gift",
                        },
                        {
                          perk: "Bonus Point Days",
                          featherweight: "Store Wide BPDs",
                          lightweight: "Store Wide BPDs",
                          welterweight: "Store Wide BPDs + 2x Wed + 2x 1st",
                          heavyweight: "All Above + Exclusive Events",
                          reigningChampion: "Custom-curated Offers",
                        },
                        {
                          perk: "Early Product Access",
                          featherweight: "–",
                          lightweight: "–",
                          welterweight: "Pre-Orders (case by case)",
                          heavyweight: "Guaranteed Pre-Orders (1 item/SKU)",
                          reigningChampion:
                            "Guaranteed Pre-Orders (1 case/SKU)",
                        },
                        {
                          perk: "Early Access Pricing",
                          featherweight: "–",
                          lightweight: "–",
                          welterweight: "Exclusive Early Access",
                          heavyweight: "Preferred Member Pricing",
                          reigningChampion: "Elite Priority Pricing",
                        },
                        {
                          perk: "Exclusive Events",
                          featherweight: "–",
                          lightweight: "–",
                          welterweight: "Priority Registration",
                          heavyweight: "Private Tier Events",
                          reigningChampion: "VIP-only Invites",
                        },
                        {
                          perk: "Discord Access",
                          featherweight: "Access",
                          lightweight: "Access",
                          welterweight: "Access",
                          heavyweight: "Priority Channels",
                          reigningChampion: "Priority Channels",
                        },
                        {
                          perk: "Price + Product Holds",
                          featherweight: "–",
                          lightweight: "–",
                          welterweight: "Same Day Lock",
                          heavyweight: "48hrs Lock",
                          reigningChampion: "72hr Lock",
                        },
                        {
                          perk: "Mystery Rewards",
                          featherweight: "–",
                          lightweight: "–",
                          welterweight: "–",
                          heavyweight: "🎁 Quarterly Drop",
                          reigningChampion: "🎁 Monthly Premium Bundle",
                        },
                        {
                          perk: "Tier Freeze",
                          featherweight: "–",
                          lightweight: "–",
                          welterweight: "Lock In Tier 1x",
                          heavyweight: "Lock In Tier 2x",
                          reigningChampion: "–",
                        },
                      ].map((benefit, index) => (
                        <tr
                          key={index}
                          style={{
                            borderBottom: "1px solid #e1e3e5",
                            backgroundColor:
                              index % 2 === 0 ? "#fafbfb" : "white",
                          }}
                        >
                          <td
                            style={{
                              padding: "12px",
                              fontWeight: "500",
                              borderRight: "1px solid #e1e3e5",
                            }}
                          >
                            {benefit.perk}
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              textAlign: "center",
                              color:
                                benefit.featherweight === "–"
                                  ? "#6d7175"
                                  : "#202223",
                            }}
                          >
                            {benefit.featherweight}
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              textAlign: "center",
                              color:
                                benefit.lightweight === "–"
                                  ? "#6d7175"
                                  : "#202223",
                            }}
                          >
                            {benefit.lightweight}
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              textAlign: "center",
                              color:
                                benefit.welterweight === "–"
                                  ? "#6d7175"
                                  : "#202223",
                            }}
                          >
                            {benefit.welterweight}
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              textAlign: "center",
                              color:
                                benefit.heavyweight === "–"
                                  ? "#6d7175"
                                  : "#202223",
                            }}
                          >
                            {benefit.heavyweight}
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              textAlign: "center",
                              color:
                                benefit.reigningChampion === "–"
                                  ? "#6d7175"
                                  : "#202223",
                            }}
                          >
                            {benefit.reigningChampion}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </BlockStack>
            </Card>

            {/* Tier Configuration */}
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <div>
                    <Text as="h2" variant="headingMd">
                      Tier Configuration
                    </Text>
                    <Text as="p" variant="bodyMd">
                      Configure your loyalty program tiers and their thresholds.
                      Benefits are managed in the comparison table above.
                    </Text>
                  </div>
                  <Button
                    variant="primary"
                    onClick={handleCreateTier}
                    icon={<Icon source={PlusIcon} />}
                  >
                    Add New Tier
                  </Button>
                </InlineStack>
                <DataTable
                  columnContentTypes={["text", "text", "text", "text", "text"]}
                  headings={[
                    "Tier Name",
                    "Points Threshold",
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
                  {tiers.map((tier: any, index: number) => (
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
                              {tier.spendThreshold.toLocaleString()} points
                              {index < tiers.length - 1 &&
                              tiers[index + 1].spendThreshold !== null &&
                              tiers[index + 1].spendThreshold < 9999999
                                ? ` - ${(Number(tiers[index + 1].spendThreshold) - 0.01).toLocaleString()} points`
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
        title={
          isCreating ? "Create New Tier" : `Edit ${editingTier?.name} Tier`
        }
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
                    This tier is invite-only and not based on points threshold.
                  </Text>
                  <TextField
                    label="Points Threshold"
                    value="Invite Only"
                    disabled
                    autoComplete="off"
                  />
                </BlockStack>
              ) : (
                <TextField
                  label="Points Threshold"
                  value={editingTier.spendThreshold.toString()}
                  onChange={(value) =>
                    setEditingTier({
                      ...editingTier,
                      spendThreshold: parseInt(value) || 0,
                    })
                  }
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
