const { execFile } = require('child_process');
const { clipboard } = require('electron');
const https = require('https');
const path = require('path');

const ROOT = __dirname;
const PYTHON = process.env.STEEL_WOOL_PYTHON || 'python3';
const KILL_SWITCH_ENABLED = process.env.STEEL_WOOL_ENABLE_KILL_SWITCH === '1';
const EXPECTED_PUBLIC_IP = (process.env.STEEL_WOOL_EXPECTED_PUBLIC_IP || '').trim();

function appendLog(message) {
  const log = document.getElementById('logOutput');
  if (log) log.textContent += `${message}\n`;
}

function run(command, args = []) {
  execFile(command, args, { cwd: ROOT }, (error, stdout, stderr) => {
    if (error) appendLog(`[error] ${error.message}`);
    if (stdout) appendLog(`[out] ${stdout.trim()}`);
    if (stderr) appendLog(`[err] ${stderr.trim()}`);
  });
}

function launchStealth() {
  run('node', [path.join(ROOT, 'stealth.js')]);
}

function launchTor() {
  run('node', [path.join(ROOT, 'tor-stealth.js')]);
}

function startProxy() {
  run('mitmproxy', ['-s', path.join(ROOT, 'proxy.py')]);
}

function scrubFile() {
  if (!document.getElementById('pluginScrubber').checked) return;

  const fileInput = document.getElementById('fileInput');
  if (!fileInput.files || fileInput.files.length === 0) {
    appendLog('[info] Select a JPEG or PNG first.');
    return;
  }

  const filePath = fileInput.files[0].path;
  if (!filePath) {
    appendLog('[error] Electron did not expose a local path for the selected file.');
    return;
  }

  run(PYTHON, [path.join(ROOT, 'scrubber.py'), filePath]);
}

function checkClipboard() {
  if (!document.getElementById('pluginClipboard').checked) return;

  const content = clipboard.readText();
  const looksSensitive = /\b(?:\d{1,3}\.){3}\d{1,3}\b|https?:\/\//.test(content);

  if (looksSensitive) {
    clipboard.clear();
    appendLog('[clipboard] URL or IPv4-looking content detected and cleared.');
  } else {
    appendLog('[clipboard] No URL or IPv4-looking content detected.');
  }
}

function startVPN() {
  run('sudo', ['wg-quick', 'up', 'wg0']);
}

function stopVPN() {
  run('sudo', ['wg-quick', 'down', 'wg0']);
}

function dropOutboundTraffic() {
  run('sudo', ['iptables', '-P', 'OUTPUT', 'DROP']);
}

function checkIP() {
  if (!KILL_SWITCH_ENABLED || !EXPECTED_PUBLIC_IP) return;

  const request = https.get('https://api.ipify.org', { timeout: 5000 }, (res) => {
    let body = '';
    res.setEncoding('utf8');
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
      const currentIP = body.trim();
      if (!currentIP) return;

      if (currentIP !== EXPECTED_PUBLIC_IP) {
        appendLog(`[network] Expected ${EXPECTED_PUBLIC_IP}, observed ${currentIP}. Dropping outbound traffic.`);
        dropOutboundTraffic();
      }
    });
  });

  request.on('timeout', () => request.destroy(new Error('public-IP check timed out')));
  request.on('error', (error) => appendLog(`[network] IP check failed: ${error.message}`));
}

if (KILL_SWITCH_ENABLED && EXPECTED_PUBLIC_IP) {
  appendLog('[network] Kill-switch monitoring enabled.');
  checkIP();
  setInterval(checkIP, 10000);
} else {
  appendLog('[network] Kill switch disabled. Set STEEL_WOOL_ENABLE_KILL_SWITCH=1 and STEEL_WOOL_EXPECTED_PUBLIC_IP to enable it.');
}

function showPanel(panel) {
  document.getElementById('mainPanel').style.display = panel === 'main' ? 'block' : 'none';
  document.getElementById('logsPanel').style.display = panel === 'logs' ? 'block' : 'none';
  document.getElementById('pluginsPanel').style.display = panel === 'plugins' ? 'block' : 'none';
}
