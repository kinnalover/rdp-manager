const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true, // Hide the toolbar/menu bar
    icon: path.join(__dirname, '../frontend/icon_app.ico'), // Use icon from frontend folder
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    useContentSize: true, // Window size will be set to content size
    minWidth: 800, // Minimum width
    minHeight: 500, // Minimum height
  });
  // Load the FastAPI frontend (adjust the port if needed)
  mainWindow.loadURL('http://127.0.0.1:8123');
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
  mainWindow.on('close', function () {
    try {
      if (backendProcess && !backendProcess.killed) {
        process.kill(-backendProcess.pid);
      }
    } catch (e) {
      // Ignore errors if process is already killed
    }
  });
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents
      .executeJavaScript(`
      const { width, height } = document.body.getBoundingClientRect();
      ({ width, height });
    `)
      .then(({ width, height }) => {
        if (width && height) {
          mainWindow.setContentSize(Math.ceil(width), Math.ceil(height));
        }
      });
  });
}

app.on('ready', () => {
  // Start FastAPI backend
  backendProcess = spawn(path.join(__dirname, '../dist/backend_server.exe'), {
    cwd: path.join(__dirname, '..'),
    shell: true,
    detached: true,
    stdio: 'ignore',
  });
  createWindow();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  try {
    if (backendProcess && !backendProcess.killed) {
      process.kill(-backendProcess.pid);
    }
  } catch (e) {
    // Ignore errors if process is already killed
  }
});
