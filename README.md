# RDP Manager - Installation & Build Instructions

## Overview
A Windows desktop application for managing RDP connections. Built with FastAPI (Python backend), Svelte (frontend), and Electron (desktop wrapper).

---

## Prerequisites
- **Windows 10/11**
- **Python 3.11+** (for backend build)
- **Node.js 18+** (for frontend/Electron)
- **pip** (Python package manager)

---

## 1. Backend: Build FastAPI as Executable

1. Install Python dependencies:
   ```powershell
   pip install fastapi uvicorn pyinstaller
   ```
2. Build the backend with PyInstaller:
   ```powershell
   pyinstaller pyinstaller.spec
   ```
   - This will create a folder `dist/backend_server` containing `backend_server.exe` and all dependencies.

---

## 2. Frontend: Build Svelte App

1. Install frontend dependencies:
   ```powershell
   cd frontend
   npm install
   npm run build
   cd ..
   ```

---

## 3. Desktop: Build Electron App

1. Install Node/Electron dependencies:
   ```powershell
   npm install
   ```
2. Build the Windows installer (using electron-builder):
   ```powershell
   npm run build:win
   ```
   - The installer and unpacked app will be in the `dist` folder.

---

## 4. Running the App
- Double-click the generated `.exe` installer in `dist` to install.
- The app will be installed to `C:\Users\<username>\AppData\Local\Programs\RDP Manager\` by default.
- All backend files are bundled in the app; no separate Python install is needed for end users.

---

## 5. Development Mode
- To run in development (with hot reload):
   ```powershell
   npm start
   ```
   - This will launch Electron and start the backend using your local Python.

---

## Notes
- The backend is started automatically by Electron (see `main.js`).
- All static/config files are included via PyInstaller and `extraResources` in `package.json`.
- If you change backend code, rebuild with PyInstaller before packaging Electron.
- If you change frontend code, rebuild the frontend before packaging Electron.

---

## Security
- Do not store or log sensitive data in plaintext.
- Follow your organization's security policies regarding credential storage and automation.

---

For troubleshooting, see comments in `main.js` and `package.json`.
