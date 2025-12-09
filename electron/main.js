const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const isDev = process.env.NODE_ENV === "development" || process.env.VITE_DEV_SERVER_URL;
function createWindow(){
  const win = new BrowserWindow({
    width: 1400, height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  if(process.env.VITE_DEV_SERVER_URL){
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, "../frontend/dist/renderer/index.html"));
  }
}
app.whenReady().then(createWindow);
app.on("window-all-closed", ()=>{ if(process.platform !== "darwin") app.quit(); });
