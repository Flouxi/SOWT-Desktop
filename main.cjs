"use strict";

const {app, BrowserWindow, Menu, dialog, shell, session, systemPreferences} = require("electron");
const path = require("node:path");
const {APP_ORIGIN, WEBSITE_ORIGIN, isAppUrl, isExternalUrl, mayUseMicrophone} = require("./policy.cjs");
let mainWindow;
let microphoneAllowed = false;
app.setName("SOWT");
if (process.platform === "win32") app.setAppUserModelId("ai.sowt.desktop");
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on("second-instance", () => {if (mainWindow) {if (mainWindow.isMinimized()) mainWindow.restore();mainWindow.show();mainWindow.focus();}});
  app.whenReady().then(() => {
    const ses = session.fromPartition("persist:sowt");
    ses.setPermissionCheckHandler((contents, permission, origin, details) => permission === "media" && contents === mainWindow?.webContents && microphoneAllowed && isAppUrl(origin) && details.mediaType === "audio");
    ses.setPermissionRequestHandler(async (contents, permission, callback, details) => {
      const allowed = permission === "media" && contents === mainWindow?.webContents && mayUseMicrophone({origin: details.requestingUrl, mainFrame: details.isMainFrame, mediaTypes: details.mediaTypes});
      if (!allowed) return callback(false);
      if (microphoneAllowed) return callback(true);
      const result = await dialog.showMessageBox(mainWindow, {type: "question", title: "Use your microphone?", message: "Allow SOWT to hear you during voice conversations?", detail: "Audio is processed by the voice service connected to your SOWT account. You can mute or end a call at any time.", buttons: ["Allow microphone", "Not now"], defaultId: 1, cancelId: 1});
      if (result.response !== 0 || mainWindow?.isDestroyed()) return callback(false);
      microphoneAllowed = process.platform !== "darwin" || await systemPreferences.askForMediaAccess("microphone");
      callback(microphoneAllowed);
    });
    createWindow(ses);
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      ...(process.platform === "darwin" ? [{label: "SOWT", submenu: [{role: "about"}, {type: "separator"}, {role: "hide"}, {role: "quit"}]}] : []),
      {label: "Edit", submenu: [{role: "undo"}, {role: "redo"}, {type: "separator"}, {role: "cut"}, {role: "copy"}, {role: "paste"}, {role: "selectAll"}]},
      {label: "View", submenu: [{label: "Reload SOWT", accelerator: "CmdOrCtrl+R", click: () => mainWindow?.loadURL(APP_ORIGIN)}, {role: "resetZoom"}, {role: "zoomIn"}, {role: "zoomOut"}, {role: "togglefullscreen"}]},
      {label: "Help", submenu: [{label: "SOWT website", click: () => shell.openExternal(WEBSITE_ORIGIN)}, {label: "Desktop downloads & release notes", click: () => shell.openExternal(WEBSITE_ORIGIN + "/download")}]},
    ]));
    app.on("activate", () => {if (BrowserWindow.getAllWindows().length === 0) createWindow(ses);else mainWindow?.show();});
  });
}
async function openExternal(raw) {
  if (!isExternalUrl(raw) || !mainWindow) return;
  const u = new URL(raw);
  const answer = await dialog.showMessageBox(mainWindow, {type: "question", message: "Open this link in your browser?", detail: u.origin, buttons: ["Open browser", "Cancel"], defaultId: 1, cancelId: 1});
  if (answer.response === 0) await shell.openExternal(raw);
}
function createWindow(ses) {
  const win = new BrowserWindow({width: 1400, height: 900, minWidth: 390, minHeight: 640, title: "SOWT", backgroundColor: "#f8fafc", icon: path.join(__dirname, "assets/icon.png"), autoHideMenuBar: process.platform !== "darwin", webPreferences: {session: ses, nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true, allowRunningInsecureContent: false, webviewTag: false, navigateOnDragDrop: false, spellcheck: true}});
  mainWindow = win;
  win.webContents.setWindowOpenHandler(({url}) => {void openExternal(url);return {action: "deny"};});
  win.webContents.on("will-attach-webview", event => event.preventDefault());
  const navigate = (event, url) => {
    if (isAppUrl(url)) return;
    event.preventDefault();
    void openExternal(url);
  };
  win.webContents.on("will-navigate", navigate);
  win.webContents.on("will-redirect", navigate);
  win.webContents.on("did-fail-load", (_event, code, _description, url, mainFrame) => {
    if (mainFrame && code !== -3 && isAppUrl(url)) void win.loadFile(path.join(__dirname, "offline.html"));
  });
  win.webContents.on("render-process-gone", () => {if (!win.isDestroyed()) void win.loadFile(path.join(__dirname, "offline.html"));});
  win.on("closed", () => {mainWindow = undefined;microphoneAllowed = false;});
  void win.loadURL(APP_ORIGIN).catch(() => {if (!win.isDestroyed()) void win.loadFile(path.join(__dirname, "offline.html"));});
}
app.on("window-all-closed", () => {if (process.platform !== "darwin") app.quit();});
