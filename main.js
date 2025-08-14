const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let backendProcess;

function waitForBackendAndLoad(window, url, retries = 30, delay = 500) {
  const http = require('http');
  let attempts = 0;
  function tryLoad() {
    http.get(url, res => {
      if (res.statusCode === 200) {
        window.loadURL(url);
      } else {
        retry();
      }
    }).on('error', retry);
  }
  function retry() {
    attempts++;
    if (attempts < retries) {
      setTimeout(tryLoad, delay);
    } else {
      window.loadURL('data:text/html,<h1>Backend failed to start</h1>');
    }
  }
  tryLoad();
}

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

  // Wait for backend to be ready before loading the FastAPI frontend
  waitForBackendAndLoad(mainWindow, 'http://127.0.0.1:8123');

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
  mainWindow.on('close', function () {
    try {
      if (backendProcess && !backendProcess.killed) {
        backendProcess.kill();
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

  //mainWindow.webContents.openDevTools();
}

app.on('ready', () => {
  let backendStarted = false;
  const backendDir = path.join(process.resourcesPath, 'backend_server');
  const backendExe = path.join(backendDir, 'backend_server.exe');
  console.log('Checking for backend exe at:', backendExe);
  if (fs.existsSync(backendExe)) {
    console.log('Production mode: launching backend exe...');
    backendProcess = spawn(backendExe, {
      cwd: backendDir,
      detached: true,
      stdio: 'ignore',
    });
    backendStarted = true;
  } else {
    // Development: run with Python
    const pythonPath = 'python'; // or 'python3' if needed
    const backendPy = path.join(__dirname, 'backend', 'main.py');
    console.log('Dev mode: launching backend with Python:', pythonPath, backendPy);
    backendProcess = spawn(pythonPath, [backendPy], {
      cwd: path.join(__dirname),
      detached: true,
      stdio: 'inherit',
    });
    backendStarted = true;
  }
  if (backendStarted) {
    console.log('Backend process started. PID:', backendProcess.pid);
  } else {
    console.error('Failed to start backend process!');
  }
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
      backendProcess.kill();
    }
  } catch (e) {
    // Ignore errors if process is already killed
  }
});
