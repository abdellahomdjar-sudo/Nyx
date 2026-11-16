const { app, BrowserWindow, Menu, shell, globalShortcut, nativeTheme } = require('electron');
const path = require('path');

nativeTheme.themeSource = 'dark';
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
if (!app.requestSingleInstanceLock()) app.quit();

let win;
const openExternal = (url) => { if (/^https:\/\//.test(url)) shell.openExternal(url); };

function createWindow() {
  win = new BrowserWindow({
    width: 1280, height: 820, minWidth: 900, minHeight: 600,
    backgroundColor: '#100d1e', title: 'Nyx', show: false, autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: true,
    },
  });
  win.once('ready-to-show', () => win.show());
  // Open straight into the player (skips the landing page)
  win.loadFile(path.join(__dirname, 'src', 'index.html'), { hash: 'play' });
  win.webContents.setWindowOpenHandler(({ url }) => { openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('file://')) { e.preventDefault(); openExternal(url); }
  });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    ...(process.platform === 'darwin' ? [{ role: 'appMenu' }] : []),
    { role: 'editMenu' }, { role: 'viewMenu' }, { role: 'windowMenu' },
  ]));
  createWindow();
  // Keyboard media keys control playback
  const keys = { MediaPlayPause: 'tog', MediaNextTrack: 'nx', MediaPreviousTrack: 'pv' };
  for (const [k, a] of Object.entries(keys)) {
    globalShortcut.register(k, () => win && win.webContents.send('media', a));
  }
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
});

app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
