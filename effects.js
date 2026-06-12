const effectsRoot = document.createElement('div');
effectsRoot.id = 'effects-ui';
effectsRoot.innerHTML = `
  <div class="effects-stack">
    <div id="badgeGrip" class="effect-badge">Grip</div>
    <div id="badgeLaunch" class="effect-badge">Launch</div>
    <div id="badgeSense" class="effect-badge">Sense</div>
    <div id="badgeFur" class="effect-badge">Golden Fur</div>
  </div>
  <div id="effectToast" class="effect-toast">Unlock active</div>
  <div id="bananaSense" class="banana-sense"><span></span></div>
`;
document.body.appendChild(effectsRoot);

const ripple = document.createElement('div');
ripple.className = 'launch-ripple';
document.body.appendChild(ripple);

const saveKey = 'monkeySwingProgressV1';
const distanceEl = document.getElementById('distance');
const bananaEl = document.getElementById('bananas');
const comboEl = document.getElementById('comboNum');
const reticle = document.getElementById('reticle');
const speedBar = document.getElementById('speedBar');
const toast = document.getElementById('effectToast');
const sense = document.getElementById('bananaSense');
const senseFill = sense?.querySelector('span');

let lastCombo = 1;
let lastBananas = 0;
let lastHold = false;
let toastTimer = 0;
let unlocked = {};

function readProgress() {
  try {
    const p = JSON.parse(localStorage.getItem(saveKey)) || {};
    unlocked = p.unlocks || {};
  } catch {
    unlocked = {};
  }
}
function has(key) {
  return !!unlocked[key];
}
function intText(el) {
  return Number((el?.textContent || '0').replace(/[^0-9.]/g, '')) || 0;
}
function showToast(text) {
  toast.textContent = text;
  toast.classList.add('show');
  toastTimer = 1.1;
}
function pulseRipple() {
  ripple.classList.remove('play');
  void ripple.offsetWidth;
  ripple.classList.add('play');
}
function vibe(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

function applyClasses() {
  document.body.classList.toggle('has-grip', has('grip'));
  document.body.classList.toggle('has-launch', has('launch'));
  document.body.classList.toggle('has-sense', has('sense'));
  document.body.classList.toggle('has-fur', has('fur'));
  document.getElementById('badgeGrip')?.classList.toggle('on', has('grip'));
  document.getElementById('badgeLaunch')?.classList.toggle('on', has('launch'));
  document.getElementById('badgeSense')?.classList.toggle('on', has('sense'));
  document.getElementById('badgeFur')?.classList.toggle('on', has('fur'));
  sense?.classList.toggle('on', has('sense'));
}

function updateSense() {
  if (!has('sense') || !senseFill) return;
  const bananas = intText(bananaEl);
  const dist = intText(distanceEl);
  const cycle = ((dist * 0.7 + bananas * 17) % 100);
  senseFill.style.width = `${Math.max(8, cycle)}%`;
}

function loop() {
  readProgress();
  applyClasses();

  const combo = intText(comboEl);
  const bananas = intText(bananaEl);
  const speedWidth = parseFloat(speedBar?.style.width || '0') || 0;
  const locked = reticle?.classList.contains('lock');

  if (has('grip') && locked && Math.random() < 0.025) {
    if (toastTimer <= 0) showToast('Better Grip ready');
  }

  if (has('launch') && combo > lastCombo) {
    pulseRipple();
    showToast('Launch Power bonus');
    vibe([8, 20, 8]);
  }

  if (has('sense') && bananas > lastBananas) {
    showToast('Banana Sense +1');
    vibe(6);
  }

  if (has('fur') && speedWidth > 78 && toastTimer <= 0) {
    showToast('Golden Fur streak');
  }

  updateSense();
  if (toastTimer > 0) {
    toastTimer -= 1 / 60;
    if (toastTimer <= 0) toast.classList.remove('show');
  }
  lastCombo = combo;
  lastBananas = bananas;
  requestAnimationFrame(loop);
}
loop();

window.addEventListener('pointerup', () => {
  if (has('launch')) {
    pulseRipple();
    vibe(8);
  }
}, { passive: true });
window.addEventListener('touchend', () => {
  if (has('launch')) {
    pulseRipple();
    vibe(8);
  }
}, { passive: true });
