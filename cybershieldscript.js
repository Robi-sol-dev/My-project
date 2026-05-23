// =====================
// TAB SWITCHING
// =====================
function switchTab(panel, btn) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('panel-' + panel).classList.add('active');
  btn.classList.add('active');
}

// =====================
// PASSWORD STRENGTH CHECKER
// =====================
function toggleVis() {
  const inp = document.getElementById('pw-input');
  const btn = document.getElementById('vis-btn');
  if (inp.type === 'password') {
    inp.type = 'text';
    btn.textContent = 'HIDE';
  } else {
    inp.type = 'password';
    btn.textContent = 'SHOW';
  }
}

function checkPassword() {
  const pw = document.getElementById('pw-input').value;
  const fill = document.getElementById('strength-fill');
  const text = document.getElementById('strength-text');
  const suggestion = document.getElementById('suggestion-box');
  const sugText = document.getElementById('suggestion-text');

  const checks = {
    length: pw.length >= 8,
    upper:  /[A-Z]/.test(pw),
    lower:  /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
    long:   pw.length >= 12
  };

  setCrit('crit-length', checks.length);
  setCrit('crit-upper',  checks.upper);
  setCrit('crit-lower',  checks.lower);
  setCrit('crit-number', checks.number);
  setCrit('crit-symbol', checks.symbol);
  setCrit('crit-long',   checks.long);

  const score = Object.values(checks).filter(Boolean).length;

  if (!pw) {
    fill.style.width = '0%';
    fill.style.background = 'transparent';
    text.textContent = '—';
    text.style.color = 'var(--muted)';
    suggestion.classList.remove('visible');
    return;
  }

  let label, color, width;
  if (score <= 2)      { label = 'VERY WEAK';    color = 'var(--danger)';  width = '15%'; }
  else if (score === 3){ label = 'WEAK';          color = 'var(--warn)';    width = '35%'; }
  else if (score === 4){ label = 'MODERATE';      color = '#f0c040';        width = '60%'; }
  else if (score === 5){ label = 'STRONG';        color = 'var(--accent)';  width = '80%'; }
  else                 { label = 'VERY STRONG';   color = 'var(--accent2)'; width = '100%'; }

  fill.style.width = width;
  fill.style.background = color;
  text.textContent = label;
  text.style.color = color;

  if (score < 5) {
    suggestion.classList.add('visible');
    sugText.textContent = generateStrongPassword(16);
  } else {
    suggestion.classList.remove('visible');
  }
}

function setCrit(id, pass) {
  const el = document.getElementById(id);
  if (pass) el.classList.add('pass');
  else el.classList.remove('pass');
}

// =====================
// PASSWORD GENERATOR
// =====================
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const NUMS  = '0123456789';
const SYMS  = '!@#$%^&*()-_=+[]{}|;:,.<>?';

function generateStrongPassword(len) {
  const chars = UPPER + LOWER + NUMS + SYMS;
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  let pw = '';
  for (let i = 0; i < len; i++) {
    pw += chars[arr[i] % chars.length];
  }
  return pw;
}

function updateLen(val) {
  document.getElementById('len-display').textContent = val;
  generatePassword();
}

function generatePassword() {
  const len = parseInt(document.getElementById('len-slider').value);
  const useUpper = document.getElementById('opt-upper').checked;
  const useLower = document.getElementById('opt-lower').checked;
  const useNum   = document.getElementById('opt-num').checked;
  const useSym   = document.getElementById('opt-sym').checked;

  let chars = '';
  let guaranteed = '';

  if (useUpper) { chars += UPPER; guaranteed += UPPER[Math.floor(Math.random() * UPPER.length)]; }
  if (useLower) { chars += LOWER; guaranteed += LOWER[Math.floor(Math.random() * LOWER.length)]; }
  if (useNum)   { chars += NUMS;  guaranteed += NUMS[Math.floor(Math.random() * NUMS.length)]; }
  if (useSym)   { chars += SYMS;  guaranteed += SYMS[Math.floor(Math.random() * SYMS.length)]; }

  if (!chars) {
    document.getElementById('gen-result').textContent = 'Select at least one option.';
    return;
  }

  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  let pw = '';
  for (let i = 0; i < len; i++) pw += chars[arr[i] % chars.length];

  // Inject guaranteed chars at random positions
  let pwArr = pw.split('');
  for (let i = 0; i < guaranteed.length && i < len; i++) {
    const pos = Math.floor(Math.random() * len);
    pwArr[pos] = guaranteed[i];
  }
  pw = pwArr.join('');

  document.getElementById('gen-result').textContent = pw;
  document.getElementById('copy-btn').textContent = 'COPY';

  // Entropy calculation
  const poolSize = chars.length;
  const entropy = Math.floor(len * Math.log2(poolSize));
  const strength = entropy < 40 ? 'Weak' : entropy < 60 ? 'Moderate' : entropy < 80 ? 'Strong' : 'Very Strong';
  document.getElementById('entropy-info').innerHTML =
    `Pool size: <span>${poolSize} chars</span> &nbsp;|&nbsp; Entropy: <span>~${entropy} bits</span> &nbsp;|&nbsp; Strength: <span>${strength}</span>`;

  // Update checkbox display
  document.querySelectorAll('.checkbox-opt input').forEach(cb => {
    cb.nextElementSibling.textContent = cb.checked ? '✓' : '';
  });
}

function copyPassword() {
  const pw = document.getElementById('gen-result').textContent;
  if (!pw || pw.includes('Select') || pw.includes('Click')) return;
  navigator.clipboard.writeText(pw).then(() => {
    const btn = document.getElementById('copy-btn');
    btn.textContent = 'COPIED!';
    btn.style.color = 'var(--accent2)';
    btn.style.borderColor = 'var(--accent2)';
    setTimeout(() => {
      btn.textContent = 'COPY';
      btn.style.color = '';
      btn.style.borderColor = '';
    }, 2000);
  });
}

// =====================
// LOGIN SECURITY TESTER
// =====================
let loginAttempts = 0;
const MAX_ATTEMPTS = 5;
let isLocked = false;
let lockTimer = null;
let logEntries = [];

const CORRECT_USER = 'admin';
const CORRECT_PASS = 'shield123';

function attemptLogin() {
  if (isLocked) return;

  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  const status = document.getElementById('login-status');
  const ts = new Date().toLocaleTimeString();

  if (!user || !pass) {
    status.className = 'login-status error';
    status.textContent = '▸ ERROR: Username and password required.';
    return;
  }

  if (user === CORRECT_USER && pass === CORRECT_PASS) {
    status.className = 'login-status success';
    status.textContent = '▸ ACCESS GRANTED — Authentication successful.';
    loginAttempts = 0;
    updateDots();
    document.getElementById('attempt-val').textContent = '0 / 5';
    addLog(ts, user, 'SUCCESS ✓');
  } else {
    loginAttempts++;
    updateDots();
    document.getElementById('attempt-val').textContent = loginAttempts + ' / 5';
    addLog(ts, user, 'FAILED ✗');

    if (loginAttempts >= MAX_ATTEMPTS) {
      lockAccount();
    } else {
      const remaining = MAX_ATTEMPTS - loginAttempts;
      status.className = 'login-status error';
      status.textContent = `▸ ACCESS DENIED — Invalid credentials. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`;
    }
  }
}

function lockAccount() {
  isLocked = true;
  document.getElementById('locked-overlay').classList.add('show');
  document.getElementById('login-btn').disabled = true;
  document.getElementById('login-btn').style.opacity = '0.4';
  document.getElementById('login-status').className = 'login-status locked';
  document.getElementById('login-status').textContent = '▸ ACCOUNT LOCKED — Brute-force protection activated.';

  let sec = 30;
  document.getElementById('countdown').textContent = sec;

  lockTimer = setInterval(() => {
    sec--;
    document.getElementById('countdown').textContent = sec;
    if (sec <= 0) {
      clearInterval(lockTimer);
      unlockAccount();
    }
  }, 1000);
}

function unlockAccount() {
  isLocked = false;
  loginAttempts = 0;
  document.getElementById('locked-overlay').classList.remove('show');
  document.getElementById('login-btn').disabled = false;
  document.getElementById('login-btn').style.opacity = '1';
  document.getElementById('login-status').className = 'login-status';
  document.getElementById('login-status').style.display = 'none';
  document.getElementById('attempt-val').textContent = '0 / 5';
  updateDots();
  addLog(new Date().toLocaleTimeString(), '—', 'UNLOCKED ○');
}

function resetLogin() {
  if (lockTimer) clearInterval(lockTimer);
  isLocked = false;
  loginAttempts = 0;
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
  document.getElementById('login-status').className = 'login-status';
  document.getElementById('locked-overlay').classList.remove('show');
  document.getElementById('login-btn').disabled = false;
  document.getElementById('login-btn').style.opacity = '1';
  document.getElementById('attempt-val').textContent = '0 / 5';
  updateDots();
  logEntries = [];
  document.getElementById('attack-log').innerHTML = 'Waiting for login attempts...';
}

function updateDots() {
  for (let i = 1; i <= 5; i++) {
    const dot = document.getElementById('dot-' + i);
    dot.className = 'attempt-dot';
    if (i <= loginAttempts) {
      dot.classList.add(loginAttempts >= MAX_ATTEMPTS ? 'danger' : 'used');
    }
  }
}

function addLog(time, user, result) {
  logEntries.unshift(`[${time}] user:${user || '?'} → ${result}`);
  if (logEntries.length > 8) logEntries.pop();
  const log = document.getElementById('attack-log');
  log.innerHTML = logEntries.map(e => {
    let color = e.includes('SUCCESS') ? 'var(--accent2)' : e.includes('UNLOCK') ? 'var(--accent)' : 'var(--danger)';
    return `<div style="color:${color}">${e}</div>`;
  }).join('');
}

// Enter key support for login panel
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && document.getElementById('panel-login').classList.contains('active')) {
    attemptLogin();
  }
});
