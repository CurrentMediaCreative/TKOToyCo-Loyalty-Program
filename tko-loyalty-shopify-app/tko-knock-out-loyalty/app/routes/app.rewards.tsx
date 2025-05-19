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
  EmptyState,
  Select,
  Thumbnail,
  DropZone,
  Banner,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { PlusIcon, DeleteIcon, EditIcon, ImageIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  // In a real implementation, we would fetch rewards from the database
  // For now, we'll use mock data
  const rewards = [
    {
      id: "1",
      name: "10% Off Next Purchase",
      description: "Get 10% off your next purchase",
      pointsCost: 100,
      type: "discount",
      discountValue: 10,
      discountType: "percentage",
      active: true,
      tierRestriction: "none",
      expiryDays: 30,
    },
    {
      id: "2",
      name: "Free Shipping",
      description: "Free shipping on your next order",
      pointsCost: 150,
      type: "shipping",
      active: true,
      tierRestriction: "lightweight",
      expiryDays: 60,
    },
    {
      id: "3",
      name: "$25 Store Credit",
      description: "$25 store credit to use on any purchase",
      pointsCost: 250,
      type: "credit",
      creditValue: 25,
      active: true,
      tierRestriction: "welterweight",
      expiryDays: 90,
    },
    {
      id: "4",
      name: "Exclusive Product Access",
      description: "Early access to new product releases",
      pointsCost: 300,
      type: "access",
      active: true,
      tierRestriction: "heavyweight",
      expiryDays: 30,
    },
    {
      id: "6",
      name: "VIP Event Invitation",
      description: "Exclusive invitation to VIP events",
      pointsCost: 500,
      type: "access",
      active: true,
      tierRestriction: "reigning-champion",
      expiryDays: 60,
    },
    {
      id: "5",
      name: "Free Gift",
      description: "Receive a free gift with your next purchase",
      pointsCost: 200,
      type: "gift",
      active: false,
      tierRestriction: "none",
      expiryDays: 45,
    },
  ];

  return json({
    rewards,
  });
};

export default function RewardsPage() {
  const { rewards } = useLoaderData<typeof loader>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<any | null>(null);
  const [newReward, setNewReward] = useState({
    name: "",
    description: "",
    pointsCost: 100,
    type: "discount",
    discountValue: 10,
    discountType: "percentage",
    creditValue: 0,
    active: true,
    tierRestriction: "none",
    expiryDays: 30,
  });
  const submit = useSubmit();

  const handleAddReward = () => {
    setEditingReward(null);
    setNewReward({
      name: "",
      description: "",
      pointsCost: 100,
      type: "discount",
      discountValue: 10,
      discountType: "percentage",
      creditValue: 0,
      active: true,
      tierRestriction: "none",
      expiryDays: 30,
    });
    setIsModalOpen(true);
  };

  const handleEditReward = (reward: any) => {
    setEditingReward(reward);
    setNewReward({ ...reward });
    setIsModalOpen(true);
  };

  const handleSaveReward = () => {
    // In a real implementation, we would save the reward to the database
    // For now, we'll just close the modal
    setIsModalOpen(false);
  };

  const handleDeleteReward = (id: string) => {
    // In a real implementation, we would delete the reward from the database
    // For now, we'll just log the ID
    console.log(`Delete reward ${id}`);
  };

  const getRewardTypeLabel = (type: string) => {
    switch (type) {
      case "discount":
        return "Discount";
      case "shipping":
        return "Free Shipping";
      case "credit":
        return "Store Credit";
      case "access":
        return "Product Access";
      case "gift":
        return "Free Gift";
      default:
        return type;
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case "none":
        return "All Tiers";
      case "featherweight":
        return "Featherweight+";
      case "lightweight":
        return "Lightweight+";
      case "welterweight":
        return "Welterweight+";
      case "heavyweight":
        return "Heavyweight+";
      case "reigning-champion":
        return "Reigning Champion Only";
      default:
        return tier;
    }
  };

  const rows = rewards.map((reward) => [
    <Text key={`name-${reward.id}`} variant="bodyMd" fontWeight="bold" as="span">
      {reward.name}
    </Text>,
    <Text key={`description-${reward.id}`} variant="bodyMd" as="span">
      {reward.description}
    </Text>,
    <Text key={`points-${reward.id}`} variant="bodyMd" as="span">
      {reward.pointsCost}
    </Text>,
    <Badge
      key={`type-${reward.id}`}
      tone={reward.type === "discount" ? "success" : reward.type === "shipping" ? "info" : "attention"}
    >
      {getRewardTypeLabel(reward.type)}
    </Badge>,
    <Badge
      key={`tier-${reward.id}`}
      tone={reward.tierRestriction === "none" ? "success" : "info"}
    >
      {getTierLabel(reward.tierRestriction)}
    </Badge>,
    <Badge
      key={`status-${reward.id}`}
      tone={reward.active ? "success" : "critical"}
    >
      {reward.active ? "Active" : "Inactive"}
    </Badge>,
    <InlineStack key={`actions-${reward.id}`} gap="200" align="end">
      <Button
        variant="tertiary"
        onClick={() => handleEditReward(reward)}
        icon={<Icon source={EditIcon} />}
      >
        Edit
      </Button>
      <Button
        variant="tertiary"
        tone="critical"
        onClick={() => handleDeleteReward(reward.id)}
        icon={<Icon source={DeleteIcon} />}
      >
        Delete
      </Button>
    </InlineStack>,
  ]);

  const typeOptions = [
    { label: "Discount", value: "discount" },
    { label: "Free Shipping", value: "shipping" },
    { label: "Store Credit", value: "credit" },
    { label: "Product Access", value: "access" },
    { label: "Free Gift", value: "gift" },
  ];

  const discountTypeOptions = [
    { label: "Percentage", value: "percentage" },
    { label: "Fixed Amount", value: "fixed" },
  ];

  const tierOptions = [
    { label: "All Tiers", value: "none" },
    { label: "Featherweight and above", value: "featherweight" },
    { label: "Lightweight and above", value: "lightweight" },
    { label: "Welterweight and above", value: "welterweight" },
    { label: "Heavyweight and above", value: "heavyweight" },
    { label: "Reigning Champion Only", value: "reigning-champion" },
  ];

  return (
    <Page fullWidth>
      <TitleBar title="Loyalty Rewards" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <InlineStack align="space-between">
              <div>
                <Text as="h2" variant="headingMd">
                  Manage Rewards
                </Text>
                <Text as="p" variant="bodyMd">
                  Create and manage rewards that customers can redeem with their loyalty points.
                </Text>
              </div>
              <Button
                variant="primary"
                onClick={handleAddReward}
                icon={<Icon source={PlusIcon} />}
              >
                Add Reward
              </Button>
            </InlineStack>

            <Card>
              {rows.length > 0 ? (
                <DataTable
                  columnContentTypes={["text", "text", "text", "text", "text", "text", "text"]}
                  headings={["Name", "Description", "Points", "Type", "Tier Restriction", "Status", "Actions"]}
                  rows={rows}
                />
              ) : (
                <EmptyState
                  heading="No rewards found"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>
                    Create rewards for your customers to redeem with their loyalty points.
                  </p>
                </EmptyState>
              )}
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>

      <Modal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingReward(null);
        }}
        title={editingReward ? `Edit ${editingReward.name}` : "Add New Reward"}
        primaryAction={{
          content: "Save",
          onAction: handleSaveReward,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => {
              setIsModalOpen(false);
              setEditingReward(null);
            },
          },
        ]}
      >
        <Modal.Section>
          <FormLayout>
            <TextField
              label="Reward Name"
              value={newReward.name}
              onChange={(value) => setNewReward({ ...newReward, name: value })}
              autoComplete="off"
            />
            <TextField
              label="Description"
              value={newReward.description}
              onChange={(value) => setNewReward({ ...newReward, description: value })}
              multiline={3}
              autoComplete="off"
            />
            <TextField
              label="Points Cost"
              value={newReward.pointsCost.toString()}
              onChange={(value) =>
                setNewReward({
                  ...newReward,
                  pointsCost: parseInt(value) || 0,
                })
              }
              type="number"
              autoComplete="off"
            />
            <Select
              label="Reward Type"
              options={typeOptions}
              value={newReward.type}
              onChange={(value) => setNewReward({ ...newReward, type: value })}
            />

            {newReward.type === "discount" && (
              <>
                <TextField
                  label="Discount Value"
                  value={newReward.discountValue?.toString() || ""}
                  onChange={(value) =>
                    setNewReward({
                      ...newReward,
                      discountValue: parseInt(value) || 0,
                    })
                  }
                  type="number"
                  autoComplete="off"
                />
                <Select
                  label="Discount Type"
                  options={discountTypeOptions}
                  value={newReward.discountType || "percentage"}
                  onChange={(value) =>
                    setNewReward({ ...newReward, discountType: value })
                  }
                />
              </>
            )}

            {newReward.type === "credit" && (
              <TextField
                label="Credit Value"
                value={newReward.creditValue?.toString() || ""}
                onChange={(value) =>
                  setNewReward({
                    ...newReward,
                    creditValue: parseInt(value) || 0,
                  })
                }
                prefix="$"
                type="number"
                autoComplete="off"
              />
            )}

            <TextField
              label="Expiry (Days)"
              value={newReward.expiryDays.toString()}
              onChange={(value) =>
                setNewReward({
                  ...newReward,
                  expiryDays: parseInt(value) || 0,
                })
              }
              type="number"
              helpText="Number of days until the reward expires after redemption. Set to 0 for no expiry."
              autoComplete="off"
            />

            <Select
              label="Tier Restriction"
              options={tierOptions}
              value={newReward.tierRestriction}
              onChange={(value) =>
                setNewReward({ ...newReward, tierRestriction: value })
              }
              helpText="Restrict this reward to specific loyalty tiers"
            />

            <InlineStack align="start">
              <Button
                onClick={() =>
                  setNewReward({ ...newReward, active: !newReward.active })
                }
                pressed={newReward.active}
              >
                {newReward.active ? "Active" : "Inactive"}
              </Button>
            </InlineStack>
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
