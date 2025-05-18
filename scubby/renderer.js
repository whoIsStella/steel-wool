const { exec } = require('child_process');
const clipboard = require('electron').clipboard;
const https = require('https');

function launchStealth() {
  exec("node stealth.js", logCallback);
}

function launchTor() {
  exec("node tor-stealth.js", logCallback);
}

function startProxy() {
  exec("mitmproxy -s proxy.py", logCallback);
}

function scrubFile() {
  if (!document.getElementById('pluginScrubber').checked) return;
  const fileInput = document.getElementById('fileInput');
  const filePath = fileInput.files[0].path;
  exec(`python3 scrubber.py "${filePath}"`, logCallback);
}

function checkClipboard() {
  if (!document.getElementById('pluginClipboard').checked) return;
  const content = clipboard.readText();
  if (content.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b|https?:\/\//)) {
    alert("Sensitive data detected in clipboard. Auto-clearing.");
    clipboard.clear();
  } else {
    alert("Clipboard is clean.");
  }
}

function toggleVPN() {
  exec("sudo wg-quick up wg0", logCallback);
}

function checkIP() {
  https.get('https://api.ipify.org', res => {
    res.on('data', data => {
      const ip = data.toString();
      if (!ip.startsWith('YOUR_VPN_SUBNET')) {
        alert("VPN Disconnected! Killing network.");
        exec("sudo iptables -P OUTPUT DROP", logCallback);
      }
    });
  });
}
setInterval(checkIP, 10000);

function showPanel(panel) {
  document.getElementById('mainPanel').style.display = panel === 'main' ? 'block' : 'none';
  document.getElementById('logsPanel').style.display = panel === 'logs' ? 'block' : 'none';
  document.getElementById('pluginsPanel').style.display = panel === 'plugins' ? 'block' : 'none';
}

function logCallback(error, stdout, stderr) {
  const log = document.getElementById('logOutput');
  if (error) log.textContent += `[Error] ${error.message}\n`;
  if (stdout) log.textContent += `[Out] ${stdout}\n`;
  if (stderr) log.textContent += `[Err] ${stderr}\n`;
}
