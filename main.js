echo "
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { exec } = require('child_process');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, 'ui/billing.html'));
}

app.whenReady().then(() => {
  exec('python app.py', (err) => {
    if (err) console.error('Flask failed to start');
  });
  createWindow();
});
" > main.js
