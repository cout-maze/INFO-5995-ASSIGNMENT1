const fileInput = document.getElementById('fileInput');
const filePicker = document.getElementById('filePicker');
const parseBtn = document.getElementById('parseBtn');
const clearBtn = document.getElementById('clearBtn');
const consoleEl = document.getElementById('console');
const resultsEl = document.getElementById('results');

function parseLine(line) {
  const parts = line.trim().split(' ');
  if (parts.length === 4 && parts[0] === 'Username:' && parts[2] === 'Password:') {
    return { user: parts[1].trim(), pass: parts[3].trim() };
  }
  return null;
}

function log(lines) {
  consoleEl.textContent = lines.join('\n');
}

function renderResults(rows) {
  resultsEl.innerHTML = '';
  if (rows.length === 0) {
    resultsEl.textContent = 'No credentials recovered.';
    return;
  }
  rows.forEach((row) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<div>Recovered username: <span>${row.user}</span></div><div>Recovered password: <span>${row.pass}</span></div>`;
    resultsEl.appendChild(card);
  });
}

function parseCredentials() {
  const lines = fileInput.value.split('\n');
  const output = [];
  const consoleLines = [];

  lines.forEach((line) => {
    if (!line.trim()) return;
    const parsed = parseLine(line);
    if (parsed) {
      output.push(parsed);
      consoleLines.push(`Recovered username: ${parsed.user}`);
      consoleLines.push(`Recovered password: ${parsed.pass}`);
    } else {
      consoleLines.push(`Skipped line: ${line}`);
    }
  });

  if (consoleLines.length === 0) {
    consoleLines.push('No input lines to parse.');
  }

  log(consoleLines);
  renderResults(output);
}

function clearAll() {
  fileInput.value = '';
  consoleEl.textContent = '';
  resultsEl.textContent = 'No credentials recovered.';
}

function loadFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    fileInput.value = String(reader.result || '');
  };
  reader.readAsText(file);
}

parseBtn.addEventListener('click', parseCredentials);
clearBtn.addEventListener('click', clearAll);
filePicker.addEventListener('change', loadFile);

clearAll();
