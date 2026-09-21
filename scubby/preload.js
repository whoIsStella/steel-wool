const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('steelWool', {
  launchBrowser: () => ipcRenderer.send('steel-wool:launch-browser'),
  launchTor: () => ipcRenderer.send('steel-wool:launch-tor'),
  startProxy: () => ipcRenderer.send('steel-wool:start-proxy'),
  startVPN: () => ipcRenderer.send('steel-wool:start-vpn'),
  stopVPN: () => ipcRenderer.send('steel-wool:stop-vpn'),
  scrubImage: () => ipcRenderer.invoke('steel-wool:scrub-image'),
  checkClipboard: () => ipcRenderer.invoke('steel-wool:check-clipboard'),
  onLog: (callback) => ipcRenderer.on('steel-wool:log', (_event, message) => callback(message)),
});
