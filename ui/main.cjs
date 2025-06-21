// Electron main process
const { app, BrowserWindow } = require("electron");
function createWindow() {
  const win = new BrowserWindow({ width: 1200, height: 800 });
  if (process.env.NODE_ENV === "development") {
    win.loadURL("http://localhost:5173"); // Vite dev server
  } else {
    win.loadFile("dist/index.html"); // Production build
  }
  win.webContents.openDevTools(); // Open DevTools for debugging
}
app.whenReady().then(createWindow);
