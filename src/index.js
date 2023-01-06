const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const SETTO_PATH = app.getPath("userData");
console.log(SETTO_PATH);

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

if (!fs.existsSync(path.join(SETTO_PATH, "json/recentvids.json"))) {
  fs.mkdirSync(path.join(SETTO_PATH, "json/"));
  fs.writeFileSync(path.join(SETTO_PATH, "json/recentvids.json"), "[]");
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    titleBarStyle: "hiddenInset",
    titleBarOverlay: {
      color: "#1a1a1a",
      symbolColor: "#ffffff",
    },
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    autoHideMenuBar: true,
    icon: path.join(__dirname, "icon.png"),
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, "index.html"));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handlers for MessageBox
ipcMain.handle("showDialog", (e, options) => {
  let result = dialog.showMessageBoxSync(options);
  return result;
});

ipcMain.handle("showSaveDialog", (e, options) => {
  let result = dialog.showSaveDialogSync(options);
  return result;
});

ipcMain.handle("getUserData", (e) => {
  return SETTO_PATH;
});
