const seedInput = document.getElementById('seedInput');
const windowInput = document.getElementById('windowInput');
const lengthInput = document.getElementById('lengthInput');
const charsetInput = document.getElementById('charsetInput');
const runBtn = document.getElementById('runBtn');
const resetBtn = document.getElementById('resetBtn');
const consoleEl = document.getElementById('console');
const recoveredSeedEl = document.getElementById('recoveredSeed');
const predictedTokenEl = document.getElementById('predictedToken');
const attackStatusEl = document.getElementById('attackStatus');

const DEFAULTS = {
  seed: 1735689600123,
  windowMs: 2000,
  length: 16,
  charset: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
};

function javaRandom(seed) {
  let internal = (BigInt(seed) ^ 0x5DEECE66Dn) & ((1n << 48n) - 1n);
  function next(bits) {
    internal = (internal * 0x5DEECE66Dn + 0xBn) & ((1n << 48n) - 1n);
    return Number(internal >> (48n - BigInt(bits)));
  }
  return {
    nextInt(bound) {
      if (bound <= 0) throw new Error('bound must be positive');
      if ((bound & (bound - 1)) === 0) {
        return (bound * next(31)) >> 31;
      }
      let bits, val;
      do {
        bits = next(31);
        val = bits % bound;
      } while (bits - val + (bound - 1) < 0);
      return val;
    },
  };
}

function generateToken(seed, length, charset) {
  const rng = javaRandom(seed);
  let token = '';
  for (let i = 0; i < length; i += 1) {
    token += charset.charAt(rng.nextInt(charset.length));
  }
  return token;
}

function recoverSeed(expectedToken, windowStart, windowEnd, length, charset) {
  for (let candidate = windowStart; candidate <= windowEnd; candidate += 1) {
    if (expectedToken === generateToken(candidate, length, charset)) {
      return candidate;
    }
  }
  return null;
}

function log(lines) {
  consoleEl.textContent = lines.join('\n');
}

function runEmulator() {
  const seed = Number(seedInput.value);
  const windowMs = Number(windowInput.value);
  const length = Number(lengthInput.value);
  const charset = charsetInput.value.trim();

  if (!Number.isFinite(seed) || !Number.isFinite(windowMs) || !Number.isFinite(length)) {
    log(['Invalid numeric inputs.']);
    return;
  }
  if (!charset.length) {
    log(['Character set cannot be empty.']);
    return;
  }

  const observedToken = generateToken(seed, length, charset);
  const windowStart = seed - windowMs;
  const windowEnd = seed + windowMs;
  const recoveredSeed = recoverSeed(observedToken, windowStart, windowEnd, length, charset);

  const lines = [
    `Simulated vulnerable token: ${observedToken}`,
    `Search window: [${windowStart}, ${windowEnd}]`,
  ];

  if (recoveredSeed === null) {
    lines.push('Recovered seed: <not found>');
    lines.push('Predicted token: <none>');
    lines.push('Attack successful: false');
    recoveredSeedEl.textContent = 'Not found';
    predictedTokenEl.textContent = '—';
    attackStatusEl.textContent = 'Failed';
    attackStatusEl.style.color = '#9b2c2c';
  } else {
    const predictedToken = generateToken(recoveredSeed, length, charset);
    lines.push(`Recovered seed: ${recoveredSeed}`);
    lines.push(`Predicted token: ${predictedToken}`);
    lines.push(`Attack successful: ${observedToken === predictedToken}`);
    recoveredSeedEl.textContent = String(recoveredSeed);
    predictedTokenEl.textContent = predictedToken;
    attackStatusEl.textContent = 'Recovered';
    attackStatusEl.style.color = '#2f6f4e';
  }

  log(lines);
}

function reset() {
  seedInput.value = DEFAULTS.seed;
  windowInput.value = DEFAULTS.windowMs;
  lengthInput.value = DEFAULTS.length;
  charsetInput.value = DEFAULTS.charset;
  consoleEl.textContent = '';
  recoveredSeedEl.textContent = '—';
  predictedTokenEl.textContent = '—';
  attackStatusEl.textContent = '—';
  attackStatusEl.style.color = 'inherit';
}

runBtn.addEventListener('click', runEmulator);
resetBtn.addEventListener('click', reset);

reset();
