const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let backendProcess;

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 700,
    webPreferences: { nodeIntegration: false }
  });

  win.loadURL('http://localhost:8000/');
}

app.whenReady().then(() => {
  // Start FastAPI backend
  backendProcess = spawn('python', [path.join(__dirname, 'backend', 'main.py')]);
  createWindow();
});

app.on('window-all-closed', () => {
  if (backendProcess) backendProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});