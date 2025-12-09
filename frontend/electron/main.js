const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// GPU 가속 비활성화 (렌더링 안정성 확보)
app.disableHardwareAcceleration();

function createWindow() {
  const win = new BrowserWindow({
    width: 1600,
    height: 900,
    backgroundColor: '#09090b',
    frame: false, // 커스텀 타이틀바 사용
    webPreferences: {
      nodeIntegration: true,    // require 사용 허용
      contextIsolation: false,  // Vue와 직접 통신 허용
      webSecurity: false        // 로컬 리소스 로딩 허용
    }
  });

  // [핵심] 상위 폴더의 index.html을 직접 로드
  win.loadFile(path.join(__dirname, '../index.html'));

  // 윈도우 제어 이벤트
  ipcMain.on('window-control', (event, action) => {
    if (action === 'minimize') win.minimize();
    if (action === 'close') win.close();
    if (action === 'maximize') win.isMaximized() ? win.unmaximize() : win.maximize();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});