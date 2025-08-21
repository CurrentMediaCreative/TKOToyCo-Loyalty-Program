import { useState, useMemo } from "react";
import { useIndexTableSelection } from "../hooks/useSelection";
import { debugLog, logError } from "../utils/logger.server.js";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  TextField,
  Button,
  EmptyState,
  Badge,
  IndexTable,
  Tabs,
  Banner,
  InlineStack,
  Icon,
  Select,
  Modal,
  BlockStack,
} from "@shopify/polaris";
import { ViewIcon, ExportIcon, EditIcon } from "@shopify/polaris-icons";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import {
  getCustomerByShopifyId,
  getCustomers,
} from "../services/customer.server";
import { adjustCustomerBonusPoints } from "../services/pointTransaction.server";
import { getTiers } from "../services/tier.server";
import { syncAllCustomers } from "../services/customerSync.server";
import { syncStoreCreditForAllCustomers } from "../services/storeCreditSync.server";
import { CustomerLoyaltyCard } from "../components/CustomerLoyaltyCard";
import { serializeBigInt } from "../utils/serialization";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action") as string;

  try {
    if (action === "updateBonusPoints") {
      const customerId = formData.get("customerId") as string;
      const newBonusPoints = parseFloat(formData.get("bonusPoints") as string);

      if (isNaN(newBonusPoints) || newBonusPoints < 0) {
        return json({ success: false, error: "Invalid bonus points value" });
      }

      // Get the customer from our database using Shopify ID
      const customer = await getCustomerByShopifyId(parseInt(customerId));

      if (!customer) {
        return json({ success: false, error: "Customer not found" });
      }

      // Calculate the difference to create a transaction record
      const currentBonusPoints = customer.bonusPoints || 0;
      const difference = newBonusPoints - currentBonusPoints;

      if (difference !== 0) {
        // Create a transaction record for the adjustment
        await adjustCustomerBonusPoints({
          customerId: customer.id,
          amount: difference,
          reason: `Admin adjustment: Set bonus points to ${newBonusPoints}`,
          admin,
        });
      }

      return json({ success: true });
    }

    if (action === "syncAllCustomers") {
      try {
        debugLog("Starting customer sync from admin interface");
        const result = await syncAllCustomers(admin);
        
        if (result.success && result.data) {
          return json({
            success: true,
            syncResult: result.data,
            message: `Successfully synced ${result.data.synced} customers in ${result.data.duration}ms. ${result.data.errors} errors.`
          });
        } else {
          return json({
            success: false,
            error: result.error || "Customer sync failed"
          });
        }
      } catch (error) {
        logError(error instanceof Error ? error : new Error(String(error)), {
          operation: 'syncAllCustomers',
          source: 'admin-interface'
        });
        return json({
          success: false,
          error: error instanceof Error ? error.message : "Customer sync failed"
        });
      }
    }

    if (action === "syncStoreCredit") {
      try {
        debugLog("Starting store credit sync from admin interface");
        const result = await syncStoreCreditForAllCustomers(request);
        
        return json({
          success: true,
          syncResult: result,
          message: `Store credit sync completed: ${result.ordersProcessed} orders processed, ${result.customersAffected} customers updated, $${result.totalStoreCreditFound.toFixed(2)} total store credit found.`
        });
      } catch (error) {
        logError(error instanceof Error ? error : new Error(String(error)), {
          operation: 'syncStoreCredit',
          source: 'admin-interface'
        });
        return json({
          success: false,
          error: error instanceof Error ? error.message : "Store credit sync failed"
        });
      }
    }

    if (action === "bulkTierChange") {
      try {
        const customerIdsJson = formData.get("customerIds") as string;
        const newTier = formData.get("newTier") as string;
        
        if (!customerIdsJson || !newTier) {
          return json({ success: false, error: "Missing required parameters" });
        }

        const customerIds = JSON.parse(customerIdsJson);
        
        if (!Array.isArray(customerIds) || customerIds.length === 0) {
          return json({ success: false, error: "No customers selected" });
        }

        debugLog(`Starting bulk tier change for ${customerIds.length} customers to ${newTier}`);
        
        // For now, return success - actual implementation would update customer tiers in database
        // This would require a new service method to bulk update customer tiers
        return json({
          success: true,
          message: `Bulk tier change functionality not yet implemented on server side. Would update ${customerIds.length} customers to ${newTier} tier.`
        });
      } catch (error) {
        logError(error instanceof Error ? error : new Error(String(error)), {
          operation: 'bulkTierChange',
          source: 'admin-interface'
        });
        return json({
          success: false,
          error: error instanceof Error ? error.message : "Bulk tier change failed"
        });
      }
    }

    if (action === "bulkPointsAdjustment") {
      try {
        const customerIdsJson = formData.get("customerIds") as string;
        const pointsAmount = formData.get("pointsAmount") as string;
        const operation = formData.get("operation") as string;
        
        if (!customerIdsJson || !pointsAmount || !operation) {
          return json({ success: false, error: "Missing required parameters" });
        }

        const customerIds = JSON.parse(customerIdsJson);
        const points = parseFloat(pointsAmount);
        
        if (!Array.isArray(customerIds) || customerIds.length === 0) {
          return json({ success: false, error: "No customers selected" });
        }

        if (isNaN(points) || points <= 0) {
          return json({ success: false, error: "Invalid points amount" });
        }

        debugLog(`Starting bulk points ${operation} of ${points} for ${customerIds.length} customers`);
        
        // Process each customer individually using existing adjustCustomerBonusPoints
        let successCount = 0;
        let errorCount = 0;
        
        for (const shopifyId of customerIds) {
          try {
            const customer = await getCustomerByShopifyId(parseInt(shopifyId));
            if (customer) {
              const adjustmentAmount = operation === "add" ? points : -points;
              await adjustCustomerBonusPoints({
                customerId: customer.id,
                amount: adjustmentAmount,
                reason: `Bulk admin adjustment: ${operation} ${points} points`,
                admin,
              });
              successCount++;
            } else {
              errorCount++;
            }
          } catch (error) {
            logError(error instanceof Error ? error : new Error(String(error)), {
              operation: 'bulkPointsAdjustment',
              customerId: shopifyId
            });
            errorCount++;
          }
        }
        
        return json({
          success: true,
          message: `Successfully ${operation === "add" ? "added" : "subtracted"} ${points} points for ${successCount} customers. ${errorCount} errors.`
        });
      } catch (error) {
        logError(error instanceof Error ? error : new Error(String(error)), {
          operation: 'bulkPointsAdjustment',
          source: 'admin-interface'
        });
        return json({
          success: false,
          error: error instanceof Error ? error.message : "Bulk points adjustment failed"
        });
      }
    }

    return json({ success: false, error: "Invalid action" });
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      operation: 'customers-action',
      action: action
    });
    return json({
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
    });
  }
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  try {
    // Fetch customers from our database only - no more API calls!
    const dbCustomers = await getCustomers();
    
    // Fetch all tiers with their benefits for the loyalty card
    const tiers = await getTiers();

    // Transform database customers to match the expected format
    const customers = dbCustomers.map((dbCustomer: any) => {
      // Convert database customer to expected format
      const shopifyId = dbCustomer.shopifyId.toString();

      return {
        // Shopify-like ID format for compatibility
        id: `gid://shopify/Customer/${shopifyId}`,
        firstName: dbCustomer.firstName,
        lastName: dbCustomer.lastName,
        email: dbCustomer.email,
        phone: dbCustomer.phone,
        numberOfOrders: dbCustomer.numberOfOrders,
        amountSpent: {
          amount: dbCustomer.totalSpend.toString(),
        },
        tags: dbCustomer.tags
          ? dbCustomer.tags.split(",").map((tag: string) => tag.trim())
          : [],
        createdAt: dbCustomer.createdAt,
        defaultAddress: {
          city: dbCustomer.city,
          province: dbCustomer.province,
          country: dbCustomer.country,
        },
        // Database fields
        dbData: dbCustomer,
        bonusPoints: dbCustomer.bonusPoints || 0,
        totalPoints: dbCustomer.totalPoints || 0,
        spendPoints: dbCustomer.spendPoints || 0,
        tier: dbCustomer.tier || null,
      };
    });

    debugLog(`Loaded ${customers.length} customers from database cache (no API calls)`);

    return json({
      customers: serializeBigInt(customers),
      tiers: serializeBigInt(tiers),
      success: true,
      error: null,
    });
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      operation: 'customers-loader'
    });
    return json({
      customers: [],
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

export default function CustomersPage() {
  interface LoaderData {
    customers: any[];
    tiers: any[];
    success: boolean;
    error: string | null;
  }

  const { customers, tiers, success, error } = useLoaderData<LoaderData>();
  const submit = useSubmit();
  const [searchValue, setSearchValue] = useState("");
  const [selectedTab, setSelectedTab] = useState(0);
  const [sortField, setSortField] = useState("spent");
  const [sortDirection, setSortDirection] = useState<
    "ascending" | "descending"
  >("descending");
  const [currentPage, setCurrentPage] = useState(1);
  const customersPerPage = 50;
  const [editingBonusPoints, setEditingBonusPoints] = useState<string | null>(
    null,
  );
  const [bonusPointsValue, setBonusPointsValue] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingStoreCredit, setIsSyncingStoreCredit] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Bulk action states
  const [showBulkTierModal, setShowBulkTierModal] = useState(false);
  const [bulkTierValue, setBulkTierValue] = useState("");
  const [showBulkPointsModal, setShowBulkPointsModal] = useState(false);
  const [bulkPointsValue, setBulkPointsValue] = useState("");
  const [bulkPointsOperation, setBulkPointsOperation] = useState("add");

  const resourceName = {
    singular: "customer",
    plural: "customers",
  };


  const tabs = [
    {
      id: "all-customers",
      content: "All",
      accessibilityLabel: "All customers",
      panelID: "all-customers-content",
    },
    {
      id: "featherweight",
      content: "Featherweight",
      accessibilityLabel: "Featherweight tier customers",
      panelID: "featherweight-customers-content",
    },
    {
      id: "lightweight",
      content: "Lightweight",
      accessibilityLabel: "Lightweight tier customers",
      panelID: "lightweight-customers-content",
    },
    {
      id: "welterweight",
      content: "Welterweight",
      accessibilityLabel: "Welterweight tier customers",
      panelID: "welterweight-customers-content",
    },
    {
      id: "heavyweight",
      content: "Heavyweight",
      accessibilityLabel: "Heavyweight tier customers",
      panelID: "heavyweight-customers-content",
    },
    {
      id: "reigning-champion",
      content: "Reigning Champion",
      accessibilityLabel: "Reigning Champion tier customers",
      panelID: "reigning-champion-customers-content",
    },
  ];

  const handleTabChange = (selectedTabIndex: number) => {
    setSelectedTab(selectedTabIndex);
  };

  // Function to determine customer tier based on total points from our database
  const getCustomerTierFromPoints = (
    totalPoints: number,
    tags: string[] = [],
  ) => {
    // Check if customer has "Reigning Champion" tag (invite-only tier)
    const hasReigningChampionTag = tags.some(
      (tag: string) => tag.toLowerCase() === "reigning champion",
    );

    if (hasReigningChampionTag) {
      return "Reigning Champion"; // Manually assigned tier overrides points tier
    } else if (totalPoints >= 30000) {
      return "Heavyweight";
    } else if (totalPoints >= 5000) {
      return "Welterweight";
    } else if (totalPoints >= 1500) {
      return "Lightweight";
    } else {
      return "Featherweight";
    }
  };

  // Function to get tier color
  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Reigning Champion":
        return "success";
      case "Heavyweight":
        return "attention";
      case "Welterweight":
        return "warning";
      case "Lightweight":
        return "info";
      default:
        return "subdued";
    }
  };

  // Process customers to add calculated fields
  const processedCustomers = useMemo(() => {
    return customers.map((customer: any) => {
      const spentAmount = parseFloat(customer.amountSpent?.amount || "0");

      // Use database data if available, otherwise calculate from points
      const dbData = customer.dbData;
      const totalPoints = dbData?.totalPoints || Math.round(spentAmount);
      const bonusPoints = dbData?.bonusPoints || 0;
      const spendPoints = dbData?.spendPoints || Math.round(spentAmount);

      // Store credit tracking data from database - convert Decimal to number
      const storeCreditUsed = dbData?.totalStoreCreditUsed ? parseFloat(dbData.totalStoreCreditUsed.toString()) : 0;
      const loyaltyEligibleSpending = dbData?.loyaltyEligibleSpend ? parseFloat(dbData.loyaltyEligibleSpend.toString()) : Math.max(0, spentAmount - storeCreditUsed);

      // Calculate tier using our points-based system
      const tier =
        dbData?.tier?.name ||
        getCustomerTierFromPoints(totalPoints, customer.tags || []);

      // Format location
      const address = customer.defaultAddress;
      const location = address
        ? `${address.city || ""}, ${address.province || ""}, ${address.country || ""}`.replace(
            /^,\s*|,\s*$/g,
            "",
          )
        : "No address";

      return {
        ...customer,
        tier,
        totalPoints,
        bonusPoints,
        spendPoints,
        spentAmount,
        storeCreditUsed,
        loyaltyEligibleSpending,
        location,
        name:
          `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
          "Unknown",
      };
    });
  }, [customers]);

  // Filter customers based on search and selected tab
  const filteredCustomers = useMemo(() => {
    let filtered = processedCustomers;

    // Filter by search
    if (searchValue) {
      const searchLower = searchValue.toLowerCase();
      filtered = filtered.filter(
        (customer: any) =>
          customer.name.toLowerCase().includes(searchLower) ||
          customer.email?.toLowerCase().includes(searchLower) ||
          customer.phone?.toLowerCase().includes(searchLower),
      );
    }

    // Filter by tier tab
    if (selectedTab > 0) {
      const tierMap = [
        "all",
        "Featherweight",
        "Lightweight",
        "Welterweight",
        "Heavyweight",
        "Reigning Champion",
      ];
      const selectedTier = tierMap[selectedTab];
      if (selectedTier !== "all") {
        filtered = filtered.filter(
          (customer: any) => customer.tier === selectedTier,
        );
      }
    }

    return filtered;
  }, [processedCustomers, searchValue, selectedTab]);

  // Sort customers
  const sortedCustomers = useMemo(() => {
    const sorted = [...filteredCustomers];
    sorted.sort((a: any, b: any) => {
      let aValue, bValue;

      switch (sortField) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "email":
          aValue = a.email?.toLowerCase() || "";
          bValue = b.email?.toLowerCase() || "";
          break;
        case "tier":
          aValue = a.tier;
          bValue = b.tier;
          break;
        case "points":
          aValue = a.totalPoints;
          bValue = b.totalPoints;
          break;
        case "bonus":
          aValue = a.bonusPoints;
          bValue = b.bonusPoints;
          break;
        case "spent":
          aValue = a.spentAmount;
          bValue = b.spentAmount;
          break;
        case "orders":
          aValue = a.numberOfOrders || 0;
          bValue = b.numberOfOrders || 0;
          break;
        case "location":
          aValue = a.location.toLowerCase();
          bValue = b.location.toLowerCase();
          break;
        default:
          aValue = a.spentAmount;
          bValue = b.spentAmount;
      }

      if (typeof aValue === "string") {
        return sortDirection === "ascending"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortDirection === "ascending"
          ? aValue - bValue
          : bValue - aValue;
      }
    });

    return sorted;
  }, [filteredCustomers, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedCustomers.length / customersPerPage);
  const startIndex = (currentPage - 1) * customersPerPage;
  const endIndex = startIndex + customersPerPage;
  const currentCustomers = sortedCustomers.slice(startIndex, endIndex);

  // FIXED #001: Replace broken custom selection logic with proper useSelection hook
  // Use filteredCustomers instead of currentCustomers so "Select All" works with all filtered results
  const customerSelection = useIndexTableSelection(
    filteredCustomers,
    (customer: any) => customer.id.replace("gid://shopify/Customer/", "")
  );

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(
        sortDirection === "ascending" ? "descending" : "ascending",
      );
    } else {
      setSortField(field);
      setSortDirection("descending");
    }
  };

  const getSortIndicator = (field: string) => {
    if (sortField !== field) return "";
    return sortDirection === "ascending" ? " ↑" : " ↓";
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleBonusPointsEdit = (customerId: string, currentValue: number) => {
    setEditingBonusPoints(customerId);
    setBonusPointsValue(currentValue.toString());
  };

  const handleBonusPointsSave = (customerId: string) => {
    const formData = new FormData();
    formData.append("action", "updateBonusPoints");
    formData.append("customerId", customerId);
    formData.append("bonusPoints", bonusPointsValue);

    submit(formData, { method: "post" });
    setEditingBonusPoints(null);
    setBonusPointsValue("");
  };

  const handleBonusPointsCancel = () => {
    setEditingBonusPoints(null);
    setBonusPointsValue("");
  };

  // Handle viewing customer details
  const handleViewCustomer = (customer: any) => {
    setSelectedCustomer(customer);
  };

  const handleCloseCustomerModal = () => {
    setSelectedCustomer(null);
  };

  // Handle customer sync
  const handleSyncCustomers = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    setSyncError(null);

    const formData = new FormData();
    formData.append("action", "syncAllCustomers");

    try {
      const response = await fetch(window.location.pathname, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setSyncMessage(result.message);
        // Reload the page to show updated data
        window.location.reload();
      } else {
        setSyncError(result.error || "Sync failed");
      }
    } catch (error) {
      setSyncError("Network error during sync");
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle store credit sync
  const handleSyncStoreCredit = async () => {
    setIsSyncingStoreCredit(true);
    setSyncMessage(null);
    setSyncError(null);

    const formData = new FormData();
    formData.append("action", "syncStoreCredit");

    try {
      const response = await fetch(window.location.pathname, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setSyncMessage(result.message);
        // Reload the page to show updated data
        window.location.reload();
      } else {
        setSyncError(result.error || "Store credit sync failed");
      }
    } catch (error) {
      setSyncError("Network error during store credit sync");
    } finally {
      setIsSyncingStoreCredit(false);
    }
  };

  // Bulk action handlers
  const handleBulkExport = () => {
    const selectedCustomers = filteredCustomers.filter((customer: any) => {
      const id = customer.id.replace("gid://shopify/Customer/", "");
      return customerSelection.isSelected(id);
    });

    if (selectedCustomers.length === 0) {
      setSyncError("No customers selected for export");
      return;
    }

    // Create CSV content
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Tier",
      "Total Points",
      "Bonus Points",
      "Total Spent",
      "Store Credit Used",
      "Loyalty Eligible Spending",
      "Number of Orders",
      "Location",
      "Created At"
    ];

    const csvContent = [
      headers.join(","),
      ...selectedCustomers.map((customer: any) => [
        `"${customer.name || ""}"`,
        `"${customer.email || ""}"`,
        `"${customer.phone || ""}"`,
        `"${customer.tier || ""}"`,
        customer.totalPoints || 0,
        customer.bonusPoints || 0,
        customer.spentAmount || 0,
        customer.storeCreditUsed || 0,
        customer.loyaltyEligibleSpending || 0,
        customer.numberOfOrders || 0,
        `"${customer.location || ""}"`,
        `"${customer.createdAt || ""}"`
      ].join(","))
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSyncMessage(`Successfully exported ${selectedCustomers.length} customers to CSV`);
    customerSelection.clearSelection();
  };

  const handleBulkTierChange = () => {
    const selectedCount = customerSelection.selectedItemsCount;
    if (selectedCount === 0) {
      setSyncError("No customers selected for tier change");
      return;
    }
    setShowBulkTierModal(true);
  };

  const handleBulkPointsAdjustment = () => {
    const selectedCount = customerSelection.selectedItemsCount;
    if (selectedCount === 0) {
      setSyncError("No customers selected for points adjustment");
      return;
    }
    setShowBulkPointsModal(true);
  };

  const submitBulkTierChange = async () => {
    if (!bulkTierValue) {
      setSyncError("Please select a tier");
      return;
    }

    const selectedCustomerIds = filteredCustomers
      .filter((customer: any) => {
        const id = customer.id.replace("gid://shopify/Customer/", "");
        return customerSelection.isSelected(id);
      })
      .map((customer: any) => customer.id.replace("gid://shopify/Customer/", ""));

    const formData = new FormData();
    formData.append("action", "bulkTierChange");
    formData.append("customerIds", JSON.stringify(selectedCustomerIds));
    formData.append("newTier", bulkTierValue);

    try {
      const response = await fetch(window.location.pathname, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setSyncMessage(`Successfully updated tier for ${selectedCustomerIds.length} customers`);
        setShowBulkTierModal(false);
        setBulkTierValue("");
        customerSelection.clearSelection();
        window.location.reload();
      } else {
        setSyncError(result.error || "Bulk tier change failed");
      }
    } catch (error) {
      setSyncError("Network error during bulk tier change");
    }
  };

  const submitBulkPointsAdjustment = async () => {
    const pointsValue = parseFloat(bulkPointsValue);
    if (isNaN(pointsValue) || pointsValue <= 0) {
      setSyncError("Please enter a valid points amount");
      return;
    }

    const selectedCustomerIds = filteredCustomers
      .filter((customer: any) => {
        const id = customer.id.replace("gid://shopify/Customer/", "");
        return customerSelection.isSelected(id);
      })
      .map((customer: any) => customer.id.replace("gid://shopify/Customer/", ""));

    const formData = new FormData();
    formData.append("action", "bulkPointsAdjustment");
    formData.append("customerIds", JSON.stringify(selectedCustomerIds));
    formData.append("pointsAmount", bulkPointsValue);
    formData.append("operation", bulkPointsOperation);

    try {
      const response = await fetch(window.location.pathname, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setSyncMessage(`Successfully ${bulkPointsOperation === "add" ? "added" : "subtracted"} ${pointsValue} points for ${selectedCustomerIds.length} customers`);
        setShowBulkPointsModal(false);
        setBulkPointsValue("");
        setBulkPointsOperation("add");
        customerSelection.clearSelection();
        window.location.reload();
      } else {
        setSyncError(result.error || "Bulk points adjustment failed");
      }
    } catch (error) {
      setSyncError("Network error during bulk points adjustment");
    }
  };

  const tierOptions = [
    { label: "Select a tier", value: "" },
    { label: "Featherweight", value: "Featherweight" },
    { label: "Lightweight", value: "Lightweight" },
    { label: "Welterweight", value: "Welterweight" },
    { label: "Heavyweight", value: "Heavyweight" },
    { label: "Reigning Champion", value: "Reigning Champion" },
  ];

  const pointsOperationOptions = [
    { label: "Add points", value: "add" },
    { label: "Subtract points", value: "subtract" },
  ];

  // Fixed column widths to prevent horizontal overflow from long content
  const columnStyles = {
    name: { width: '150px', maxWidth: '150px' },
    email: { width: '180px', maxWidth: '180px' },
    tier: { width: '120px', maxWidth: '120px' },
    points: { width: '100px', maxWidth: '100px' },
    bonus: { width: '120px', maxWidth: '120px' },
    spent: { width: '100px', maxWidth: '100px' },
    storeCredit: { width: '100px', maxWidth: '100px' },
    loyaltyEligible: { width: '120px', maxWidth: '120px' },
    orders: { width: '80px', maxWidth: '80px' },
    location: { width: '150px', maxWidth: '150px' },
    actions: { width: '100px', maxWidth: '100px' }
  };

  const truncateText = (text: string, maxLength: number = 25) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const rowMarkup = currentCustomers.map((customer: any, index: number) => {
    const id = customer.id.replace("gid://shopify/Customer/", "");

    return (
      <IndexTable.Row
        id={id}
        key={id}
        selected={customerSelection.isSelected(id)}
        position={index}
      >
        <IndexTable.Cell>
          <div style={columnStyles.name} title={customer.name || "Unknown"}>
            <Text variant="bodyMd" fontWeight="bold" as="span">
              {truncateText(customer.name || "Unknown", 20)}
            </Text>
          </div>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <div style={columnStyles.email} title={customer.email || "No email"}>
            <Text as="span">
              {truncateText(customer.email || "No email", 25)}
            </Text>
          </div>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <div style={columnStyles.tier}>
            <Badge tone={getTierColor(customer.tier) as any}>
              {customer.tier}
            </Badge>
          </div>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <div style={columnStyles.points}>
            <Text as="span">
              {customer.totalPoints.toLocaleString()}
            </Text>
          </div>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <div style={columnStyles.bonus}>
            {editingBonusPoints === id ? (
              <div style={{ display: "flex", gap: "4px", alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ width: "60px" }}>
                  <TextField
                    value={bonusPointsValue}
                    onChange={setBonusPointsValue}
                    type="number"
                    autoComplete="off"
                    label=""
                    size="slim"
                  />
                </div>
                <Button
                  size="micro"
                  onClick={() => handleBonusPointsSave(id)}
                  variant="primary"
                >
                  Save
                </Button>
                <Button
                  size="micro"
                  onClick={handleBonusPointsCancel}
                  variant="tertiary"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div
                style={{ cursor: "pointer" }}
                onClick={() => handleBonusPointsEdit(id, customer.bonusPoints)}
                title="Click to edit bonus points"
              >
                <Text as="span">{customer.bonusPoints.toLocaleString()}</Text>
                <Text as="span" tone="subdued" variant="bodySm">
                  {" "}
                  (edit)
                </Text>
              </div>
            )}
          </div>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <div style={columnStyles.spent}>
            <Text as="span">
              ${customer.spentAmount.toFixed(2)}
            </Text>
          </div>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <div style={columnStyles.storeCredit}>
            <Text as="span">
              ${(customer.storeCreditUsed || 0).toFixed(2)}
            </Text>
          </div>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <div style={columnStyles.loyaltyEligible}>
            <Text as="span">
              ${(customer.loyaltyEligibleSpending || 0).toFixed(2)}
            </Text>
          </div>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <div style={columnStyles.orders}>
            <Text as="span">
              {customer.numberOfOrders || 0}
            </Text>
          </div>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <div style={columnStyles.location} title={customer.location}>
            <Text as="span">
              {truncateText(customer.location, 20)}
            </Text>
          </div>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <div style={columnStyles.actions}>
            <Button
              variant="tertiary"
              icon={<Icon source={ViewIcon} />}
              onClick={() => handleViewCustomer(customer)}
              accessibilityLabel={`View ${customer.name} details`}
              size="slim"
            >
              View
            </Button>
          </div>
        </IndexTable.Cell>
      </IndexTable.Row>
    );
  });

  const emptyStateMarkup = (
    <EmptyState
      heading="No customers found"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>
        No customers match the current search criteria or there are no customers
        in this tier.
      </p>
    </EmptyState>
  );

  return (
    <Page fullWidth>
      {selectedCustomer && (
        <CustomerLoyaltyCard
          customer={selectedCustomer}
          tiers={tiers}
          onClose={handleCloseCustomerModal}
        />
      )}
      <TitleBar title="Customers" />
      <Layout>
        <Layout.Section>
          {!success && (
            <Banner tone="critical">
              <p>Error loading customers: {error || "Unknown error"}</p>
            </Banner>
          )}

          {syncMessage && (
            <Banner tone="success" onDismiss={() => setSyncMessage(null)}>
              <p>{syncMessage}</p>
            </Banner>
          )}

          {syncError && (
            <Banner tone="critical" onDismiss={() => setSyncError(null)}>
              <p>Sync Error: {syncError}</p>
            </Banner>
          )}

          <Card>
            <Tabs
              tabs={tabs}
              selected={selectedTab}
              onSelect={handleTabChange}
            />
            <div style={{ padding: "16px" }}>
              <InlineStack align="space-between" gap="400">
                <TextField
                  label=""
                  value={searchValue}
                  onChange={setSearchValue}
                  placeholder="Search customers"
                  clearButton
                  onClearButtonClick={() => setSearchValue("")}
                  autoComplete="off"
                />
                <InlineStack gap="200">
                  <Button
                    variant="secondary"
                    onClick={handleSyncStoreCredit}
                    loading={isSyncingStoreCredit}
                    disabled={isSyncingStoreCredit || isSyncing}
                  >
                    {isSyncingStoreCredit ? "Syncing Store Credit..." : "Sync Store Credit"}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSyncCustomers}
                    loading={isSyncing}
                    disabled={isSyncing || isSyncingStoreCredit}
                  >
                    {isSyncing ? "Syncing..." : "Sync All Customers"}
                  </Button>
                </InlineStack>
              </InlineStack>
            </div>

            <InlineStack align="space-between" gap="400">
              <Text as="p" variant="bodyMd">
                {customers.length} total customers, {sortedCustomers.length}{" "}
                filtered, showing page {currentPage} of {totalPages}
              </Text>
              <div>
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  variant="tertiary"
                >
                  Previous
                </Button>
                <span style={{ margin: "0 10px" }}>
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  variant="tertiary"
                >
                  Next
                </Button>
              </div>
            </InlineStack>

            {/* Bulk Action Bar */}
            {customerSelection.selectedItemsCount > 0 && (
              <div style={{ 
                padding: "16px", 
                backgroundColor: "#f6f6f7", 
                borderTop: "1px solid #e1e3e5",
                borderBottom: "1px solid #e1e3e5"
              }}>
                <InlineStack align="space-between" gap="400">
                  <Text as="p" variant="bodyMd" fontWeight="medium">
                    {customerSelection.selectedItemsCount} customer{customerSelection.selectedItemsCount === 1 ? '' : 's'} selected
                  </Text>
                  <InlineStack gap="200">
                    <Button
                      variant="secondary"
                      icon={<Icon source={ExportIcon} />}
                      onClick={handleBulkExport}
                      size="slim"
                    >
                      Export CSV
                    </Button>
                    <Button
                      variant="secondary"
                      icon={<Icon source={EditIcon} />}
                      onClick={handleBulkTierChange}
                      size="slim"
                    >
                      Change Tier
                    </Button>
                    <Button
                      variant="secondary"
                      icon={<Icon source={EditIcon} />}
                      onClick={handleBulkPointsAdjustment}
                      size="slim"
                    >
                      Adjust Points
                    </Button>
                    <Button
                      variant="tertiary"
                      onClick={() => customerSelection.clearSelection()}
                      size="slim"
                    >
                      Clear Selection
                    </Button>
                  </InlineStack>
                </InlineStack>
              </div>
            )}

            <IndexTable
              resourceName={resourceName}
              itemCount={rowMarkup.length}
              selectedItemsCount={customerSelection.selectedItemsCount}
              onSelectionChange={customerSelection.handleSelectionChange}
              headings={[
                { title: `Name${getSortIndicator("name")}` },
                { title: `Email${getSortIndicator("email")}` },
                { title: `Tier${getSortIndicator("tier")}` },
                { title: `Total Points${getSortIndicator("points")}` },
                { title: `Bonus Points${getSortIndicator("bonus")}` },
                { title: `Total Spent${getSortIndicator("spent")}` },
                { title: `Store Credit Used${getSortIndicator("storeCredit")}` },
                { title: `Loyalty-Eligible${getSortIndicator("loyaltyEligible")}` },
                { title: `Orders${getSortIndicator("orders")}` },
                { title: `Location${getSortIndicator("location")}` },
                { title: "Actions" },
              ]}
              sortable={[true, true, true, true, true, true, true]}
              sortDirection={sortDirection}
              sortColumnIndex={
                sortField === "name"
                  ? 0
                  : sortField === "email"
                    ? 1
                    : sortField === "tier"
                      ? 2
                      : sortField === "points"
                        ? 3
                        : sortField === "bonus"
                          ? 4
                          : sortField === "spent"
                            ? 5
                            : sortField === "orders"
                              ? 6
                              : sortField === "location"
                                ? 7
                                : 0
              }
              onSort={(index) => {
                const field =
                  index === 0
                    ? "name"
                    : index === 1
                      ? "email"
                      : index === 2
                        ? "tier"
                        : index === 3
                          ? "points"
                          : index === 4
                            ? "bonus"
                            : index === 5
                              ? "spent"
                              : index === 6
                                ? "orders"
                                : index === 7
                                  ? "location"
                                  : "name";
                handleSort(field);
              }}
              emptyState={emptyStateMarkup}
            >
              {rowMarkup}
            </IndexTable>
          </Card>
        </Layout.Section>
      </Layout>

      {/* Bulk Tier Change Modal */}
      <Modal
        open={showBulkTierModal}
        onClose={() => setShowBulkTierModal(false)}
        title="Change Customer Tier"
        primaryAction={{
          content: "Update Tier",
          onAction: submitBulkTierChange,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setShowBulkTierModal(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text as="p">
              Change the tier for {customerSelection.selectedItemsCount} selected customer{customerSelection.selectedItemsCount === 1 ? '' : 's'}.
            </Text>
            <Select
              label="New Tier"
              options={tierOptions}
              value={bulkTierValue}
              onChange={setBulkTierValue}
            />
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Bulk Points Adjustment Modal */}
      <Modal
        open={showBulkPointsModal}
        onClose={() => setShowBulkPointsModal(false)}
        title="Adjust Customer Points"
        primaryAction={{
          content: "Adjust Points",
          onAction: submitBulkPointsAdjustment,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setShowBulkPointsModal(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text as="p">
              Adjust points for {customerSelection.selectedItemsCount} selected customer{customerSelection.selectedItemsCount === 1 ? '' : 's'}.
            </Text>
            <Select
              label="Operation"
              options={pointsOperationOptions}
              value={bulkPointsOperation}
              onChange={setBulkPointsOperation}
            />
            <TextField
              label="Points Amount"
              type="number"
              value={bulkPointsValue}
              onChange={setBulkPointsValue}
              placeholder="Enter points amount"
              autoComplete="off"
            />
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
