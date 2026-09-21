const { app, BrowserWindow, clipboard, dialog, ipcMain } = require('electron');
const { execFile, spawn } = require('child_process');
const https = require('https');
const path = require('path');

app.disableHardwareAcceleration();

const ROOT = __dirname;
const PYTHON = process.env.STEEL_WOOL_PYTHON || 'python3';
const NODE = process.env.STEEL_WOOL_NODE || 'node';
const KILL_SWITCH_ENABLED = process.env.STEEL_WOOL_ENABLE_KILL_SWITCH === '1';
const EXPECTED_PUBLIC_IP = (process.env.STEEL_WOOL_EXPECTED_PUBLIC_IP || '').trim();
const children = new Set();

function sendLog(message) {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send('steel-wool:log', message);
  }
}

function spawnTracked(label, command, args = []) {
  sendLog(`[${label}] starting`);
  const child = spawn(command, args, { cwd: ROOT, shell: false });
  children.add(child);

  child.stdout?.on('data', (data) => sendLog(`[${label}] ${data.toString().trim()}`));
  child.stderr?.on('data', (data) => sendLog(`[${label}] ${data.toString().trim()}`));
  child.on('error', (error) => sendLog(`[${label}] error: ${error.message}`));
  child.on('exit', (code, signal) => {
    children.delete(child);
    sendLog(`[${label}] exited (${signal || code})`);
  });
}

function runOnce(label, command, args = []) {
  sendLog(`[${label}] starting`);
  execFile(command, args, { cwd: ROOT }, (error, stdout, stderr) => {
    if (error) sendLog(`[${label}] error: ${error.message}`);
    if (stdout?.trim()) sendLog(`[${label}] ${stdout.trim()}`);
    if (stderr?.trim()) sendLog(`[${label}] ${stderr.trim()}`);
    if (!error) sendLog(`[${label}] complete`);
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 680,
    webPreferences: {
      preload: path.join(ROOT, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  win.loadFile('index.html');
}

ipcMain.on('steel-wool:launch-browser', () => {
  spawnTracked('browser', NODE, [path.join(ROOT, 'stealth.js')]);
});

ipcMain.on('steel-wool:launch-tor', () => {
  spawnTracked('tor-browser', NODE, [path.join(ROOT, 'tor-stealth.js')]);
});

ipcMain.on('steel-wool:start-proxy', () => {
  spawnTracked('request-scrubber', 'mitmproxy', ['-s', path.join(ROOT, 'proxy.py')]);
});

ipcMain.on('steel-wool:start-vpn', () => {
  runOnce('wireguard', 'sudo', ['wg-quick', 'up', 'wg0']);
});

ipcMain.on('steel-wool:stop-vpn', () => {
  runOnce('wireguard', 'sudo', ['wg-quick', 'down', 'wg0']);
});

ipcMain.handle('steel-wool:check-clipboard', () => {
  const content = clipboard.readText();
  const looksSensitive = /\b(?:\d{1,3}\.){3}\d{1,3}\b|https?:\/\//.test(content);
  if (looksSensitive) clipboard.clear();
  return looksSensitive;
});

ipcMain.handle('steel-wool:scrub-image', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png'] }],
  });
  if (result.canceled || result.filePaths.length === 0) return { canceled: true };

  const filePath = result.filePaths[0];
  runOnce('metadata-scrubber', PYTHON, [path.join(ROOT, 'scrubber.py'), filePath]);
  return { canceled: false };
});

function dropOutboundTraffic() {
  runOnce('kill-switch', 'sudo', ['iptables', '-P', 'OUTPUT', 'DROP']);
}

function checkPublicIP() {
  if (!KILL_SWITCH_ENABLED || !EXPECTED_PUBLIC_IP) return;

  const request = https.get('https://api.ipify.org', { timeout: 5000 }, (res) => {
    let body = '';
    res.setEncoding('utf8');
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
      const currentIP = body.trim();
      if (currentIP && currentIP !== EXPECTED_PUBLIC_IP) {
        sendLog(`[network] expected ${EXPECTED_PUBLIC_IP}, observed ${currentIP}; dropping outbound traffic`);
        dropOutboundTraffic();
      }
    });
  });

  request.on('timeout', () => request.destroy(new Error('public IP check timed out')));
  request.on('error', (error) => sendLog(`[network] IP check failed: ${error.message}`));
}

app.whenReady().then(() => {
  createWindow();

  if (KILL_SWITCH_ENABLED && EXPECTED_PUBLIC_IP) {
    sendLog('[network] kill-switch monitoring enabled');
    checkPublicIP();
    setInterval(checkPublicIP, 10000).unref();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  for (const child of children) child.kill();
  if (process.platform !== 'darwin') app.quit();
});
