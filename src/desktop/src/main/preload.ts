// Preload script for Electron
import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // Window management
    showMainWindow: () => ipcRenderer.send('show-main-window'),
    hideMainWindow: () => ipcRenderer.send('hide-main-window'),
    showPopupWindow: () => ipcRenderer.send('show-popup-window'),
    hidePopupWindow: () => ipcRenderer.send('hide-popup-window'),
    positionPopupWindow: (x: number, y: number) => ipcRenderer.send('position-popup-window', x, y),
    
    // Customer operations
    lookupCustomer: (phoneNumber: string) => ipcRenderer.send('lookup-customer', phoneNumber),
    openCustomerInMain: (customerId: string) => ipcRenderer.send('open-customer-in-main', customerId),
    applyDiscount: (customerId: string, discountType: string) => 
      ipcRenderer.send('apply-discount', { customerId, discountType }),
    
    // Data synchronization
    syncData: () => ipcRenderer.send('sync-data'),
    
    // Settings
    setAutoLaunch: (enabled: boolean) => ipcRenderer.send('set-auto-launch', enabled),
    getSettings: () => ipcRenderer.invoke('get-settings'),
    
    // Event listeners
    onCustomerData: (callback: (customer: any) => void) => 
      ipcRenderer.on('customer-data', (_event, data) => callback(data)),
    onNavigateToCustomer: (callback: (customerId: string) => void) => 
      ipcRenderer.on('navigate-to-customer', (_event, customerId) => callback(customerId)),
    onSyncComplete: (callback: (result: any) => void) => 
      ipcRenderer.on('sync-complete', (_event, result) => callback(result)),
    onError: (callback: (error: string) => void) => 
      ipcRenderer.on('error', (_event, error) => callback(error)),
    
    // Remove listeners
    removeAllListeners: (channel: string) => {
      ipcRenderer.removeAllListeners(channel);
    }
  }
);
