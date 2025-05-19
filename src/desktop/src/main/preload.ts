import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // Window management
  showMainWindow: () => ipcRenderer.send("show-main-window"),
  hideMainWindow: () => ipcRenderer.send("hide-main-window"),
  showPopupWindow: () => ipcRenderer.send("show-popup-window"),
  hidePopupWindow: () => ipcRenderer.send("hide-popup-window"),
  positionPopupWindow: (x: number, y: number) =>
    ipcRenderer.send("position-popup-window", x, y),

  // Customer lookup
  lookupCustomer: (query: string) =>
    ipcRenderer.send("lookup-customer-enhanced", query),
  onCustomerData: (callback: (customer: any) => void) =>
    ipcRenderer.on("customer-data", (_event, customer) => callback(customer)),

  // Window communication
  openCustomerInMain: (customerId: string) =>
    ipcRenderer.send("open-customer-in-main", customerId),
  onNavigateToCustomer: (callback: (customerId: string) => void) =>
    ipcRenderer.on("navigate-to-customer", (_event, customerId) =>
      callback(customerId)
    ),

  // Data synchronization
  syncData: () => ipcRenderer.send("sync-data"),
  onSyncComplete: (callback: (result: any) => void) =>
    ipcRenderer.on("sync-complete", (_event, result) => callback(result)),

  // Settings
  setAutoLaunch: (enabled: boolean) =>
    ipcRenderer.send("set-auto-launch", enabled),
  getSettings: () => ipcRenderer.invoke("get-settings"),

  // Shopify API
  testShopifyConnection: () => ipcRenderer.invoke("shopify-test-connection"),
  getShopifyCustomers: () =>
    ipcRenderer.invoke("shopify-search-customers", "email:*"),
  searchCustomers: (query: string) =>
    ipcRenderer.invoke("shopify-search-customers", query),
  getCustomerById: (customerId: string) =>
    ipcRenderer.invoke("get-customer-by-id", customerId),
  getCustomerByPhone: (phone: string) =>
    ipcRenderer.invoke("get-customer-by-phone", phone),

  // Revenue data
  getDailyRevenue: () => ipcRenderer.invoke("get-daily-revenue"),
  getMonthlyRevenue: () => ipcRenderer.invoke("get-monthly-revenue"),

  // Tier management
  getAllTiers: () => ipcRenderer.invoke("get-all-tiers"),
  calculateTierProgress: (customer: any) =>
    ipcRenderer.invoke("calculate-tier-progress", customer),

  // Customer lookup result
  onLookupResult: (callback: (result: any) => void) =>
    ipcRenderer.on("lookup-customer-result", (_event, result) =>
      callback(result)
    ),
});

console.log("Preload script loaded");
