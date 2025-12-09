const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("electronAPI", {
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  on: (channel, cb) => ipcRenderer.on(channel, (e, ...a) => cb(...a))
});
