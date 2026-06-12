const progressionRoot = document.createElement('div');
progressionRoot.id = 'progression-ui';
progressionRoot.innerHTML = `
  <div id="missionCard" class="mission-card">
    <div class="mission-title">Current Mission</div>
    <div id="missionText" class="mission-text">Reach 100m in one run</div>
    <div class="mission-bar"><div id="missionFill" class="mission-fill"></div></div>
  </div>
  <div id="bananaBank" class="banana-bank">Stash 🍌 0</div>
  <button id="openUpgrades" class="open-upgrades">Unlocks</button>
  <div class="unlock-row">
    <div id="skin1" class="unlock-pill active">Classic Arms</div>
    <div id="skin2" class="unlock-pill">Golden Fur</div>
    <div id="skin3" class="unlock-pill">Temple Grip</div>
  </div>
  <div id="rankToast" class="rank-toast">
    <div id="rankGrade" class="rank-grade">A</div>
    <div id="rankSub" class="rank-sub">Run summary</div>
  </div>
`;
document.body.appendChild(progressionRoot);

const panel = document.createElement('div');
panel.id = 'upgradePanel';
panel.className = 'upgrade-panel';
panel.innerHTML = `
  <div class="upgrade-head">
    <div>
      <div class="upgrade-title">Monkey Unlocks</div>
      <div style="font-size:11px;opacity:.72;margin-top:3px">Uses bananas earned from runs.</div>
    </div>
    <button id="closeUpgrades" class="upgrade-close">Close</button>
  </div>
  <div class="upgrade-grid">
    <button id="unlockGrip" class="upgrade"><b>Better Grip</b><span>Marks future vine-forgiveness upgrade.</span><span class="cost">Need: 25 🍌</span></button>
    <button id="unlockLaunch" class="upgrade"><b>Launch Power</b><span>Marks future release-power upgrade.</span><span class="cost">Need: 40 🍌</span></button>
    <button id="unlockSense" class="upgrade"><b>Banana Sense</b><span>Marks future collection upgrade.</span><span class="cost">Need: 60 🍌</span></button>
    <button id="unlockFur" class="upgrade"><b>Golden Fur</b><span>Cosmetic unlock marker.</span><span class="cost">Need: 90 🍌</span></button>
  </div>
`;
document.body.appendChild(panel);

const distanceEl = document.getElementById('distance');
const bananaEl = document.getElementById('bananas');
const comboEl = document.getElementById('comboNum');
const dead = document.getElementById('dead');
const deadStats = document.getElementById('deadStats');
const startBtn = document.getElementById('start');
const restartBtn = document.getElementById('restart');
const missionText = document.getElementById('missionText');
const missionFill = document.getElementById('missionFill');
const missionCard = document.getElementById('missionCard');
const stashEl = document.getElementById('bananaBank');
const rankToast = document.getElementById('rankToast');
const rankGrade = document.getElementById('rankGrade');
const rankSub = document.getElementById('rankSub');
const openUpgrades = document.getElementById('openUpgrades');
const closeUpgrades = document.getElementById('closeUpgrades');

const saveKey = 'monkeySwingProgressV1';
let progress = loadProgress();
let runStartBananas = 0;
let runSaved = false;
let lastDead = false;
let bestComboThisRun = 1;
let currentMissionIndex = progress.missionIndex || 0;

const missions = [
  { text: 'Reach 100m in one run', type: 'distance', target: 100, reward: 15 },
  { text: 'Collect 8 bananas in one run', type: 'bananas', target: 8, reward: 20 },
  { text: 'Reach a 4x combo', type: 'combo', target: 4, reward: 25 },
  { text: 'Reach 250m in one run', type: 'distance', target: 250, reward: 35 },
  { text: 'Collect 20 bananas total', type: 'totalBananas', target: 20, reward: 40 },
  { text: 'Reach 500m in one run', type: 'distance', target: 500, reward: 60 }
];

function loadProgress() {
  try { return JSON.parse(localStorage.getItem(saveKey)) || defaultProgress(); }
  catch { return defaultProgress(); }
}
function defaultProgress() { return { stash: 0, best: 0, totalBananas: 0, missionIndex: 0, unlocks: {} }; }
function saveProgress() { progress.missionIndex = currentMissionIndex; localStorage.setItem(saveKey, JSON.stringify(progress)); }
function intText(el) { return Number((el?.textContent || '0').replace(/[^0-9.]/g, '')) || 0; }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function startRun() {
  runStartBananas = intText(bananaEl);
  runSaved = false;
  bestComboThisRun = 1;
  rankToast.classList.remove('show');
  missionCard.classList.remove('dim');
}
startBtn?.addEventListener('click', startRun);
restartBtn?.addEventListener('click', startRun);
startBtn?.addEventListener('touchend', startRun, { passive: true });
restartBtn?.addEventListener('touchend', startRun, { passive: true });

function missionValue(m) {
  const dist = intText(distanceEl);
  const bananas = intText(bananaEl);
  const combo = intText(comboEl);
  bestComboThisRun = Math.max(bestComboThisRun, combo);
  if (m.type === 'distance') return dist;
  if (m.type === 'bananas') return bananas;
  if (m.type === 'combo') return bestComboThisRun;
  if (m.type === 'totalBananas') return progress.totalBananas;
  return 0;
}

function updateMission() {
  const m = missions[currentMissionIndex % missions.length];
  missionText.textContent = m.text + `  (+${m.reward} 🍌)`;
  const value = missionValue(m);
  missionFill.style.width = `${clamp(value / m.target * 100, 0, 100)}%`;
  if (value >= m.target) {
    progress.stash += m.reward;
    currentMissionIndex += 1;
    saveProgress();
    showRank('Mission', `Completed: ${m.text} • +${m.reward} bananas`);
  }
}

function gradeRun(distance, bananas, combo) {
  const score = distance + bananas * 12 + combo * 20;
  if (score >= 850) return 'S';
  if (score >= 520) return 'A';
  if (score >= 300) return 'B';
  if (score >= 150) return 'C';
  return 'D';
}
function showRank(grade, sub) {
  rankGrade.textContent = grade;
  rankSub.textContent = sub;
  rankToast.classList.add('show');
  setTimeout(() => rankToast.classList.remove('show'), 2500);
}

function saveRun() {
  if (runSaved) return;
  runSaved = true;
  const distance = intText(distanceEl);
  const bananas = intText(bananaEl);
  const earned = Math.max(0, bananas - runStartBananas);
  progress.stash += earned;
  progress.totalBananas += earned;
  progress.best = Math.max(progress.best || 0, distance);
  saveProgress();
  const grade = gradeRun(distance, earned, bestComboThisRun);
  showRank(grade, `${distance}m • +${earned} bananas saved • Best ${progress.best}m`);
  if (deadStats && !deadStats.dataset.progressionTouched) {
    deadStats.textContent += ` • Grade ${grade} • +${earned} stash`;
    deadStats.dataset.progressionTouched = '1';
  }
}

function refreshStash() {
  stashEl.textContent = `Stash 🍌 ${progress.stash || 0}`;
  document.getElementById('skin2')?.classList.toggle('active', !!progress.unlocks?.fur);
  document.getElementById('skin3')?.classList.toggle('active', !!progress.unlocks?.grip);
  for (const [id, key, need] of [
    ['unlockGrip', 'grip', 25], ['unlockLaunch', 'launch', 40], ['unlockSense', 'sense', 60], ['unlockFur', 'fur', 90]
  ]) {
    const btn = document.getElementById(id);
    if (!btn) continue;
    btn.disabled = !!progress.unlocks?.[key] || (progress.stash || 0) < need;
    const label = btn.querySelector('.cost');
    if (label) label.textContent = progress.unlocks?.[key] ? 'Unlocked' : `Need: ${need} 🍌`;
  }
}

function unlock(key, need, label) {
  if (progress.unlocks?.[key] || (progress.stash || 0) < need) return;
  progress.stash -= need;
  progress.unlocks = progress.unlocks || {};
  progress.unlocks[key] = true;
  saveProgress();
  refreshStash();
  showRank('Unlock', label);
}
document.getElementById('unlockGrip')?.addEventListener('click', () => unlock('grip', 25, 'Better Grip marker unlocked'));
document.getElementById('unlockLaunch')?.addEventListener('click', () => unlock('launch', 40, 'Launch Power marker unlocked'));
document.getElementById('unlockSense')?.addEventListener('click', () => unlock('sense', 60, 'Banana Sense marker unlocked'));
document.getElementById('unlockFur')?.addEventListener('click', () => unlock('fur', 90, 'Golden Fur marker unlocked'));
openUpgrades?.addEventListener('click', () => panel.classList.add('show'));
closeUpgrades?.addEventListener('click', () => panel.classList.remove('show'));

function loop() {
  const isDead = dead?.classList.contains('show');
  updateMission();
  refreshStash();
  missionCard.classList.toggle('dim', isDead);
  if (isDead && !lastDead) saveRun();
  if (!isDead && lastDead && deadStats) delete deadStats.dataset.progressionTouched;
  lastDead = isDead;
  requestAnimationFrame(loop);
}
refreshStash();
loop();
