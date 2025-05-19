import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  ipcMain,
  nativeImage,
  shell,
  dialog,
} from "electron";
import * as path from "path";
import * as isDev from "electron-is-dev";
import Store from "electron-store";
import { shopifyService } from "./services/shopify-service";
import { databaseService } from "./services/database-service";

// Initialize store for app settings
const store = new Store();

// Declare global variables
let mainWindow: BrowserWindow | null = null;
let popupWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

// Temporarily disable single instance lock for testing
// const gotTheLock = app.requestSingleInstanceLock();
//
// if (!gotTheLock) {
//   // If we couldn't get the lock, it means another instance is already running
//   // We'll show a dialog after the app is ready, but for now just set a flag
//   app.on("ready", () => {
//     dialog.showMessageBoxSync({
//       type: "info",
//       title: "TKO Loyalty Already Running",
//       message:
//         "TKO Loyalty is already running. Please use the existing instance.",
//       buttons: ["OK"],
//     });
//     app.quit();
//   });
// } else {
//   // This is the first instance - register a listener for second instances
//   app.on("second-instance", (event, commandLine, workingDirectory) => {
//     // Someone tried to run a second instance, focus our window instead
//     if (mainWindow) {
//       if (mainWindow.isMinimized()) mainWindow.restore();
//       mainWindow.show();
//       mainWindow.focus();
//     }
//   });
// }

// Create the main admin window
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: true,
    frame: true,
    resizable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      javascript: true,
    },
  });

  // Load the app directly from the built files
  const startUrl = isDev
    ? `file://${path.join(__dirname, "../../src/renderer/index.html")}`
    : `file://${path.join(__dirname, "../renderer/renderer/index.html")}`;

  console.log(`Loading main window from: ${startUrl}`);
  mainWindow.loadURL(startUrl).catch((error) => {
    console.error("Failed to load main window:", error);
  });

  // Add the view parameter to the URL
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow?.webContents.executeJavaScript(`
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.set('view', 'main');
      window.history.replaceState({}, '', '?' + urlParams.toString());
      console.log('Main window loaded with view=main');
    `);
  });

  // Disable DevTools for now
  // if (isDev) {
  //   mainWindow.webContents.openDevTools({ mode: "detach" });
  // }

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }: { url: string }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Prevent the window from being closed, hide it instead
  mainWindow.on("close", (event: Electron.Event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
      return false;
    }
    return true;
  });
}

// Create the customer popup window
function createPopupWindow() {
  popupWindow = new BrowserWindow({
    width: 400,
    height: 600,
    show: false,
    frame: false,
    resizable: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      javascript: true,
    },
  });

  // Load the app directly from the built files
  const startUrl = isDev
    ? `file://${path.join(__dirname, "../../src/renderer/index.html")}`
    : `file://${path.join(__dirname, "../renderer/renderer/index.html")}`;

  console.log(`Loading popup window from: ${startUrl}`);
  popupWindow.loadURL(startUrl).catch((error) => {
    console.error("Failed to load popup window:", error);
  });

  // Add the view parameter to the URL
  popupWindow.webContents.on("did-finish-load", () => {
    popupWindow?.webContents.executeJavaScript(`
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.set('view', 'popup');
      window.history.replaceState({}, '', '?' + urlParams.toString());
      console.log('Popup window loaded with view=popup');
    `);
  });

  // Disable DevTools for now
  // if (isDev) {
  //   popupWindow.webContents.openDevTools({ mode: "detach" });
  // }

  // Hide the window when it loses focus
  popupWindow.on("blur", () => {
    if (!popupWindow?.webContents.isDevToolsOpened()) {
      popupWindow?.hide();
    }
  });

  // Prevent the window from being closed, hide it instead
  popupWindow.on("close", (event: Event) => {
    if (!isQuitting) {
      event.preventDefault();
      popupWindow?.hide();
      return false;
    }
    return true;
  });
}

// Create the system tray icon
function createTray() {
  // Use the TKO logo as the tray icon
  const trayIconPath = isDev
    ? path.join(process.cwd(), "assets/icons/tray-icon.png")
    : path.join(
        path.dirname(path.dirname(__dirname)),
        "assets/icons/tray-icon.png"
      );

  console.log("Loading tray icon from:", trayIconPath);

  // Create the tray icon from the file
  let trayIcon = nativeImage.createFromPath(trayIconPath);

  // If the icon file doesn't exist or is empty, use a fallback
  if (trayIcon.isEmpty()) {
    console.log("Tray icon not found or empty, using fallback icon");
    // Create a simple colored icon as fallback
    trayIcon = nativeImage.createFromDataURL(
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAJhSURBVFhH7ZY9aBRBFMf/b3Zv70NjEoOKIhiwEbRQrAQbQbCwEqystLHTWkFQsbMTtLGxsLCxEbQQBCEgCBYifoGFjSIqSiQXL3u7O+P7mN2bvdtbvdtcwB8Mb9/Mm5n3/83XLkQikUgkEolEIpHI/4dqNptTnPMDUsqtjuPsUEq1wzDsK6V+BkHwwTTNF47jvPY8r5MkSXfcWiaTyQNKqbP4XBVCbEXbxDgDz/S6rh+FwF1d168j6Lc4Hl+v1z+OWzOZTqfP4eM6Pp5CwFGIaUDMBYh5F2JeQMxzEHQJYn6az+cL49ZMGo3GKXzcQMALCLgdAipwHJBlWXtrtdp+0zR/wQEfMXAXRD2PoA8ajcZJ27Yfua77dtwqKRQKB/HxCgHvQcAKBFTgOABCbMTHfrTrEHQvBH0Jh+xBexUCnrRarQNorxeLxfsTVonv+8fgfh0BH0PAMgRU4DgA7jcsy9qH9iDEfA0xd8EBe9FehYAnEHAfxLxWKpXuTlglcD8G9+sI+BgCliFgGY4D4H4Dbm9D+xDEfAMxd8IBe9FehYAnEHAfxLxaLpfvTFglnucdh/t1BHwCAcvZCjgOQPANuL2N9iGI+RZi7oQD9qK9CgFPIOA+iHml0WjcnrBKXNc9AffrCPgUApazFXAcAPcbcHsb7UMQ8x3E3AkH7EV7FQKeQMB9EPNyo9G4NWGVOI5zEu7XEfAZBCxnK+A4AO434PY22ocg5nuIuRMO2Iv2KgQ8gYD7IObFarV6c8IqsW37FNyvI+BzCFjOVsDfISKRSCQSiUQikUjkv0Fpvw=="
    );
  }

  tray = new Tray(trayIcon);
  tray.setToolTip("TKO Loyalty");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open Admin Dashboard",
      click: () => {
        if (mainWindow === null) {
          createMainWindow();
        }
        mainWindow?.show();
      },
    },
    {
      label: "Open Customer Lookup",
      click: () => {
        if (popupWindow === null) {
          createPopupWindow();
        }
        popupWindow?.show();
      },
    },
    { type: "separator" },
    {
      label: "Settings",
      click: () => {
        // TODO: Implement settings window
      },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  // Show main window on tray icon click
  tray.on("click", () => {
    if (mainWindow === null) {
      createMainWindow();
    }

    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
    }
  });
}

// Error handling
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

// Load customer data from Shopify and store in local database
async function loadShopifyCustomers() {
  try {
    console.log("Loading customers from Shopify...");

    // Test the connection first
    const connectionTest = await shopifyService.testConnection();
    if (!connectionTest) {
      console.error(
        "Failed to connect to Shopify API. Check your credentials."
      );
      // Try to load from local database instead
      const localCustomers = databaseService.getAllCustomers();
      console.log(
        `Loaded ${localCustomers.length} customers from local database`
      );

      if (mainWindow && localCustomers.length > 0) {
        mainWindow.webContents.send("shopify-customers-loaded", localCustomers);
      }

      return localCustomers;
    }

    console.log("Successfully connected to Shopify API");

    // Search for customers
    const customers: any[] = await shopifyService.searchCustomers("email:*");
    console.log(`Found ${customers.length} customers in Shopify`);

    // Map customers to our format and save to local database
    const mappedCustomers: any[] = [];
    for (const customer of customers.slice(0, 50)) {
      // Increased limit for better offline functionality
      try {
        const mappedCustomer = await shopifyService.mapToCustomer(customer);
        mappedCustomers.push(mappedCustomer);

        // Save to local database
        databaseService.saveCustomer(mappedCustomer);
      } catch (err) {
        console.error(`Error mapping customer ${customer.id}:`, err);
      }
    }

    console.log(
      `Successfully mapped and cached ${mappedCustomers.length} customers`
    );

    // Send customers to renderer process
    if (mainWindow) {
      mainWindow.webContents.send("shopify-customers-loaded", mappedCustomers);
    }

    return mappedCustomers;
  } catch (error) {
    console.error("Error loading Shopify customers:", error);

    // Try to load from local database instead
    try {
      const localCustomers = databaseService.getAllCustomers();
      console.log(
        `Loaded ${localCustomers.length} customers from local database as fallback`
      );

      if (mainWindow && localCustomers.length > 0) {
        mainWindow.webContents.send("shopify-customers-loaded", localCustomers);
      }

      return localCustomers;
    } catch (dbError) {
      console.error("Error loading customers from local database:", dbError);
      return [];
    }
  }
}

// App ready event
app
  .whenReady()
  .then(async () => {
    try {
      console.log("Application starting...");

      // Initialize the database
      console.log("Initializing database...");
      await databaseService.initialize();
      console.log("Database initialized successfully");

      createTray();
      createMainWindow();
      createPopupWindow();
      console.log("Application started successfully");

      // Load customer data from Shopify and cache in local database
      await loadShopifyCustomers();

      // On macOS, recreate the window when dock icon is clicked
      app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          createMainWindow();
        }
      });
    } catch (error) {
      console.error("Error during application startup:", error);
    }
  })
  .catch((error) => {
    console.error("Failed to start application:", error);
  });

// Quit when all windows are closed, except on macOS
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Set the app to quit completely when quit is selected
app.on("before-quit", () => {
  isQuitting = true;
});

// IPC handlers for renderer process communication
// Main window handlers
ipcMain.on("show-main-window", () => {
  mainWindow?.show();
});

ipcMain.on("hide-main-window", () => {
  mainWindow?.hide();
});

// Popup window handlers
ipcMain.on("show-popup-window", () => {
  popupWindow?.show();
});

ipcMain.on("hide-popup-window", () => {
  popupWindow?.hide();
});

// Position the popup window at specific coordinates
ipcMain.on("position-popup-window", (_, x: number, y: number) => {
  if (popupWindow) {
    popupWindow.setPosition(x, y);
    popupWindow.show();
  }
});

// Customer lookup handler
ipcMain.on("lookup-customer", (event, phoneNumber: string) => {
  // In a real implementation, this would query the database or API
  // For now, we'll just show the popup window
  if (popupWindow) {
    popupWindow.webContents.send("customer-data", { phoneNumber });
    popupWindow.show();
  }
});

// Window communication
ipcMain.on("open-customer-in-main", (_, customerId: string) => {
  if (mainWindow) {
    mainWindow.webContents.send("navigate-to-customer", customerId);
    mainWindow.show();
  }
});

// Data synchronization
ipcMain.on("sync-data", (event) => {
  // In a real implementation, this would sync with the backend API
  // For now, we'll just send a mock response
  event.reply("sync-complete", {
    success: true,
    timestamp: new Date().toISOString(),
  });
});

// Auto-launch setting
ipcMain.on("set-auto-launch", (_, enabled: boolean) => {
  store.set("autoLaunch", enabled);
  // In a real implementation, this would configure the app to launch at startup
});

// Get settings
ipcMain.handle("get-settings", () => {
  return {
    autoLaunch: store.get("autoLaunch", false),
    showNotifications: store.get("showNotifications", true),
    syncInterval: store.get("syncInterval", 30), // minutes
  };
});

// Shopify API handlers
ipcMain.handle("shopify-test-connection", async () => {
  try {
    const result = await shopifyService.testConnection();
    return { success: result };
  } catch (error) {
    console.error("Error testing Shopify connection:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

// Revenue data handlers
ipcMain.handle("get-daily-revenue", async () => {
  try {
    const dailyRevenue = await shopifyService.getDailyRevenue();
    return { success: true, data: dailyRevenue };
  } catch (error) {
    console.error("Error getting daily revenue:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

ipcMain.handle("get-monthly-revenue", async () => {
  try {
    const monthlyRevenue = await shopifyService.getMonthlyRevenue();
    return { success: true, data: monthlyRevenue };
  } catch (error) {
    console.error("Error getting monthly revenue:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

ipcMain.handle("shopify-search-customers", async (_, query: string) => {
  try {
    const customers = await shopifyService.searchCustomers(query);
    return { success: true, customers };
  } catch (error) {
    console.error("Error searching Shopify customers:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

ipcMain.handle("shopify-get-customer", async (_, customerId: string) => {
  try {
    const customer = await shopifyService.getCustomerById(customerId);
    return { success: true, customer };
  } catch (error) {
    console.error("Error getting Shopify customer:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

ipcMain.handle("shopify-get-customer-spend", async (_, customerId: string) => {
  try {
    const totalSpend = await shopifyService.getCustomerTotalSpend(customerId);
    return { success: true, totalSpend };
  } catch (error) {
    console.error("Error getting Shopify customer spend:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

// Customer service handlers (using Shopify as the data source)
ipcMain.handle("get-customer-by-phone", async (_, phoneNumber: string) => {
  try {
    const customer = await shopifyService.getCustomerByPhone(phoneNumber);
    return { success: true, customer };
  } catch (error) {
    console.error("Error getting customer by phone:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

ipcMain.handle("get-customer-by-id", async (_, customerId: string) => {
  try {
    const customer = await shopifyService.getCustomerById(customerId);
    return { success: true, customer };
  } catch (error) {
    console.error("Error getting customer by ID:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

ipcMain.handle("calculate-tier-progress", async (_, customer) => {
  try {
    const tierProgress = await shopifyService.calculateTierProgress(customer);
    return { success: true, tierProgress };
  } catch (error) {
    console.error("Error calculating tier progress:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

ipcMain.handle("get-all-tiers", async () => {
  try {
    const tiers = await shopifyService.getAllTiers();
    return { success: true, tiers };
  } catch (error) {
    console.error("Error getting all tiers:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

// Enhanced customer lookup handler that uses local database first, then Shopify
ipcMain.on("lookup-customer-enhanced", async (event, query: string) => {
  try {
    const phoneRegex = /^\+?[0-9\s\-\(\)]+$/;
    let customer: any = null;

    // First try to get customer from local database
    if (phoneRegex.test(query)) {
      // Try local database first
      customer = databaseService.getCustomerByPhone(query);

      // If not found locally, try Shopify
      if (!customer) {
        try {
          const phoneCustomer = await shopifyService.getCustomerByPhone(query);
          if (phoneCustomer) {
            customer = phoneCustomer;
            // Cache the customer in local database
            databaseService.saveCustomer(customer);
          }
        } catch (shopifyError) {
          console.error("Error fetching from Shopify:", shopifyError);
          // Continue with local search
        }
      }
    }

    // If no customer found by phone or query isn't a phone number, search by other criteria
    if (!customer) {
      // Try local database search first
      const localCustomers = databaseService.searchCustomers(query);

      if (localCustomers.length > 0) {
        customer = localCustomers[0];
      } else {
        // If not found locally, try Shopify
        try {
          const customers = await shopifyService.searchCustomers(query);

          if (customers.length > 0) {
            // Get the first matching customer
            const shopifyCustomer = customers[0];
            customer = await shopifyService.mapToCustomer(shopifyCustomer);

            // Cache the customer in local database
            databaseService.saveCustomer(customer);
          }
        } catch (shopifyError) {
          console.error("Error searching Shopify:", shopifyError);
          // Continue with null customer
        }
      }
    }

    if (customer) {
      // Send the customer data to the renderer process
      if (popupWindow) {
        popupWindow.webContents.send("customer-data", customer);
        popupWindow.show();
      }

      event.reply("lookup-customer-result", {
        success: true,
        customer: customer,
      });
    } else {
      event.reply("lookup-customer-result", {
        success: false,
        error: "Customer not found",
      });
    }
  } catch (error) {
    console.error("Error looking up customer:", error);
    event.reply("lookup-customer-result", {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});
