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
  Box,
  InlineStack,
  TextField,
  FormLayout,
  Divider,
  Banner,
  List,
  Modal,
  LegacyCard,
  DataTable,
  EmptyState,
  Icon,
  Tooltip,
  Badge,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { PlusIcon, DeleteIcon, EditIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  // In a real implementation, we would fetch tiers from the database
  // For now, we'll use mock data
  const tiers = [
    {
      id: "1",
      name: "Featherweight",
      spendThreshold: 0,
      benefits: ["Welcome gift", "Birthday reward", "Exclusive newsletter"],
      color: "#E0E0E0",
    },
    {
      id: "2",
      name: "Lightweight",
      spendThreshold: 1500,
      benefits: [
        "All Featherweight benefits",
        "Early access to sales",
        "Free shipping on orders over $50",
      ],
      color: "#FFD23F",
    },
    {
      id: "3",
      name: "Welterweight",
      spendThreshold: 5000,
      benefits: [
        "All Lightweight benefits",
        "Double points on purchases",
        "Exclusive product access",
      ],
      color: "#FF7C2A",
    },
    {
      id: "4",
      name: "Heavyweight",
      spendThreshold: 25000,
      benefits: [
        "All Welterweight benefits",
        "Free shipping on all orders",
        "VIP customer service",
      ],
      color: "#00B8A2",
    },
    {
      id: "5",
      name: "Reigning Champion",
      spendThreshold: null, // Invite only, no specific spend threshold
      benefits: [
        "All Heavyweight benefits",
        "Personal shopping assistant",
        "Exclusive events access",
        "Annual gift",
      ],
      color: "#1F2937",
    },
  ];

  return json({
    tiers,
  });
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
    // In a real implementation, we would save the tier to the database
    // For now, we'll just close the modal
    setIsModalOpen(false);
    setEditingTier(null);
  };

  const rows = tiers.map((tier) => [
    <Text key={`name-${tier.id}`} variant="bodyMd" fontWeight="bold" as="span">
      {tier.name}
    </Text>,
    <Text key={`threshold-${tier.id}`} variant="bodyMd" as="span">
      {tier.spendThreshold !== null 
        ? `$${tier.spendThreshold.toLocaleString()}`
        : "Invite Only"}
    </Text>,
    <div key={`benefits-${tier.id}`}>
      {tier.benefits.map((benefit, index) => (
        <div key={`benefit-${tier.id}-${index}`}>{benefit}</div>
      ))}
    </div>,
    <div key={`color-${tier.id}`} style={{ display: "flex", alignItems: "center" }}>
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
                  Configure your loyalty program tiers. Customers will be automatically assigned to tiers based on their total spend.
                </Text>
                <DataTable
                  columnContentTypes={["text", "text", "text", "text", "text"]}
                  headings={["Tier Name", "Spend Threshold", "Benefits", "Color", "Actions"]}
                  rows={rows}
                />
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Tier Visualization
                </Text>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
                        <Text variant="headingSm" as="p">{tier.name}</Text>
                        <Text variant="bodySm" as="p">
                          {tier.spendThreshold !== null ? (
                            <>
                              ${tier.spendThreshold.toLocaleString()}
                              {index < tiers.length - 1 && tiers[index + 1].spendThreshold !== null
                                ? ` - $${(Number(tiers[index + 1].spendThreshold) - 0.01).toLocaleString()}`
                                : "+"}
                            </>
                          ) : (
                            "Invite Only"
                          )}
                        </Text>
                      </div>
                      <div>
                        <Badge tone={index === tiers.length - 1 ? "success" : "info"}>
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
                onChange={(value) => setEditingTier({ ...editingTier, name: value })}
                autoComplete="off"
              />
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
              <TextField
                label="Color"
                value={editingTier.color}
                onChange={(value) => setEditingTier({ ...editingTier, color: value })}
                autoComplete="off"
              />
              <Divider />
              <Text variant="headingSm" as="h3">Benefits</Text>
              <BlockStack gap="400">
                {editingTier.benefits.map((benefit: string, index: number) => (
                  <InlineStack key={index} align="space-between">
                    <Text variant="bodyMd" as="span">{benefit}</Text>
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
                    <Button onClick={handleAddBenefit} icon={<Icon source={PlusIcon} />}>
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
