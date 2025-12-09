const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: { send: () => {} } };
export const bridge = {
    winControl(action) { ipcRenderer.send('window-control', action); },
    fire(command, payload = {}) { console.log(`[Bridge] Fire Python: ${command}`, payload); }
};