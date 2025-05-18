import { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, shell, dialog } from 'electron';
import * as path from 'path';
import * as isDev from 'electron-is-dev';
import Store from 'electron-store';

// Initialize store for app settings
const store = new Store();

// Declare global variables
let mainWindow: BrowserWindow | null = null;
let popupWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

// Ensure single instance of the application
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // If we couldn't get the lock, it means another instance is already running
  // We'll show a dialog after the app is ready, but for now just set a flag
  app.on('ready', () => {
    dialog.showMessageBoxSync({
      type: 'info',
      title: 'TKO Loyalty Already Running',
      message: 'TKO Loyalty is already running. Please use the existing instance.',
      buttons: ['OK']
    });
    app.quit();
  });
} else {
  // This is the first instance - register a listener for second instances
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

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
      preload: path.join(__dirname, 'preload.js'),
      javascript: true
    }
  });

  // Load the app
  const startUrl = isDev
    ? 'http://localhost:3000' // Use webpack-dev-server in development
    : `file://${path.join(__dirname, '../build/index.html')}`;
  
  console.log(`Loading main window from: ${startUrl}`);
  mainWindow.loadURL(startUrl).catch(error => {
    console.error('Failed to load main window:', error);
  });
  
  // Add the view parameter to the URL
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.executeJavaScript(`
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.set('view', 'main');
      window.history.replaceState({}, '', '?' + urlParams.toString());
      console.log('Main window loaded with view=main');
    `);
  });

  // Show DevTools in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

// Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }: { url: string }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Prevent the window from being closed, hide it instead
  mainWindow.on('close', (event: Electron.Event) => {
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
      preload: path.join(__dirname, 'preload.js'),
      javascript: true
    }
  });

  // Load the app
  const startUrl = isDev
    ? 'http://localhost:3000' // Use webpack-dev-server in development
    : `file://${path.join(__dirname, '../build/index.html')}`;
  
  console.log(`Loading popup window from: ${startUrl}`);
  popupWindow.loadURL(startUrl).catch(error => {
    console.error('Failed to load popup window:', error);
  });
  
  // Add the view parameter to the URL
  popupWindow.webContents.on('did-finish-load', () => {
    popupWindow?.webContents.executeJavaScript(`
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.set('view', 'popup');
      window.history.replaceState({}, '', '?' + urlParams.toString());
      console.log('Popup window loaded with view=popup');
    `);
  });

  // Show DevTools in development mode
  if (isDev) {
    popupWindow.webContents.openDevTools({ mode: 'detach' });
  }

  // Hide the window when it loses focus
  popupWindow.on('blur', () => {
    if (!popupWindow?.webContents.isDevToolsOpened()) {
      popupWindow?.hide();
    }
  });

  // Prevent the window from being closed, hide it instead
  popupWindow.on('close', (event: Event) => {
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
    ? path.join(process.cwd(), 'assets/icons/tray-icon.png')
    : path.join(__dirname, '../../../assets/icons/tray-icon.png');
  
  console.log('Loading tray icon from:', trayIconPath);
  
  // Create the tray icon from the file
  let trayIcon = nativeImage.createFromPath(trayIconPath);
  
  // If the icon file doesn't exist or is empty, use a fallback
  if (trayIcon.isEmpty()) {
    console.log('Tray icon not found or empty, using fallback icon');
    // Create a simple colored icon as fallback
    trayIcon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAJhSURBVFhH7ZY9aBRBFMf/b3Zv70NjEoOKIhiwEbRQrAQbQbCwEqystLHTWkFQsbMTtLGxsLCxEbQQBCEgCBYifoGFjSIqSiQXL3u7O+P7mN2bvdtbvdtcwB8Mb9/Mm5n3/83XLkQikUgkEolEIpHI/4dqNptTnPMDUsqtjuPsUEq1wzDsK6V+BkHwwTTNF47jvPY8r5MkSXfcWiaTyQNKqbP4XBVCbEXbxDgDz/S6rh+FwF1d168j6Lc4Hl+v1z+OWzOZTqfP4eM6Pp5CwFGIaUDMBYh5F2JeQMxzEHQJYn6az+cL49ZMGo3GKXzcQMALCLgdAipwHJBlWXtrtdp+0zR/wQEfMXAXRD2PoA8ajcZJ27Yfua77dtwqKRQKB/HxCgHvQcAKBFTgOABCbMTHfrTrEHQvBH0Jh+xBexUCnrRarQNorxeLxfsTVonv+8fgfh0BH0PAMgRU4DgA7jcsy9qH9iDEfA0xd8EBe9FehYAnEHAfxLxWKpXuTlglcD8G9+sI+BgCliFgGY4D4H4Dbm9D+xDEfAMxd8IBe9FehYAnEHAfxLxaLpfvTFglnucdh/t1BHwCAcvZCjgOQPANuL2N9iGI+RZi7oQD9qK9CgFPIOA+iHml0WjcnrBKXNc9AffrCPgUApazFXAcAPcbcHsb7UMQ8x3E3AkH7EV7FQKeQMB9EPNyo9G4NWGVOI5zEu7XEfAZBCxnK+A4AO434PY22ocg5nuIuRMO2Iv2KgQ8gYD7IObFarV6c8IqsW37FNyvI+BzCFjOVsDfISKRSCQSiUQikUjkv0Fpvw==');
  }
  
  tray = new Tray(trayIcon);
  tray.setToolTip('TKO Loyalty');
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Open Admin Dashboard', 
      click: () => {
        if (mainWindow === null) {
          createMainWindow();
        }
        mainWindow?.show();
      } 
    },
    { 
      label: 'Open Customer Lookup', 
      click: () => {
        if (popupWindow === null) {
          createPopupWindow();
        }
        popupWindow?.show();
      } 
    },
    { type: 'separator' },
    { 
      label: 'Settings', 
      click: () => {
        // TODO: Implement settings window
      } 
    },
    { type: 'separator' },
    { 
      label: 'Quit', 
      click: () => {
        isQuitting = true;
        app.quit();
      } 
    }
  ]);
  
  tray.setContextMenu(contextMenu);
  
  // Show main window on tray icon click
  tray.on('click', () => {
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
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// App ready event
app.whenReady().then(() => {
  try {
    console.log('Application starting...');
    createTray();
    createMainWindow();
    createPopupWindow();
    console.log('Application started successfully');
    
    // On macOS, recreate the window when dock icon is clicked
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  } catch (error) {
    console.error('Error during application startup:', error);
  }
}).catch((error) => {
  console.error('Failed to start application:', error);
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Set the app to quit completely when quit is selected
app.on('before-quit', () => {
  isQuitting = true;
});

// IPC handlers for renderer process communication
// Main window handlers
ipcMain.on('show-main-window', () => {
  mainWindow?.show();
});

ipcMain.on('hide-main-window', () => {
  mainWindow?.hide();
});

// Popup window handlers
ipcMain.on('show-popup-window', () => {
  popupWindow?.show();
});

ipcMain.on('hide-popup-window', () => {
  popupWindow?.hide();
});

// Position the popup window at specific coordinates
ipcMain.on('position-popup-window', (_, x: number, y: number) => {
  if (popupWindow) {
    popupWindow.setPosition(x, y);
    popupWindow.show();
  }
});

// Customer lookup handler
ipcMain.on('lookup-customer', (event, phoneNumber: string) => {
  // In a real implementation, this would query the database or API
  // For now, we'll just show the popup window
  if (popupWindow) {
    popupWindow.webContents.send('customer-data', { phoneNumber });
    popupWindow.show();
  }
});

// Window communication
ipcMain.on('open-customer-in-main', (_, customerId: string) => {
  if (mainWindow) {
    mainWindow.webContents.send('navigate-to-customer', customerId);
    mainWindow.show();
  }
});

// Data synchronization
ipcMain.on('sync-data', (event) => {
  // In a real implementation, this would sync with the backend API
  // For now, we'll just send a mock response
  event.reply('sync-complete', { success: true, timestamp: new Date().toISOString() });
});

// Auto-launch setting
ipcMain.on('set-auto-launch', (_, enabled: boolean) => {
  store.set('autoLaunch', enabled);
  // In a real implementation, this would configure the app to launch at startup
});

// Get settings
ipcMain.handle('get-settings', () => {
  return {
    autoLaunch: store.get('autoLaunch', false),
    showNotifications: store.get('showNotifications', true),
    syncInterval: store.get('syncInterval', 30) // minutes
  };
});
