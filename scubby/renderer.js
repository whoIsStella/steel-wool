function appendLog(message) {
  const log = document.getElementById('logOutput');
  if (log) {
    log.textContent += `${message}\n`;
    log.scrollTop = log.scrollHeight;
  }
}

function launchStealth() {
  window.steelWool.launchBrowser();
}

function launchTor() {
  window.steelWool.launchTor();
}

function startProxy() {
  window.steelWool.startProxy();
}

function startVPN() {
  window.steelWool.startVPN();
}

function stopVPN() {
  window.steelWool.stopVPN();
}

async function scrubFile() {
  if (!document.getElementById('pluginScrubber').checked) return;
  const result = await window.steelWool.scrubImage();
  if (result.canceled) appendLog('[metadata-scrubber] canceled');
}

async function checkClipboard() {
  if (!document.getElementById('pluginClipboard').checked) return;
  const cleared = await window.steelWool.checkClipboard();
  appendLog(cleared
    ? '[clipboard] URL or IPv4-looking content detected and cleared'
    : '[clipboard] no URL or IPv4-looking content detected');
}

function showPanel(panel) {
  document.getElementById('mainPanel').style.display = panel === 'main' ? 'block' : 'none';
  document.getElementById('logsPanel').style.display = panel === 'logs' ? 'block' : 'none';
  document.getElementById('pluginsPanel').style.display = panel === 'plugins' ? 'block' : 'none';
}

window.steelWool.onLog(appendLog);
