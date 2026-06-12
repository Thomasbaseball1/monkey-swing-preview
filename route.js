const routeCanvas = document.createElement('canvas');
routeCanvas.id = 'cinematic-foreground';
document.body.appendChild(routeCanvas);

const routeUI = document.createElement('div');
routeUI.id = 'route-ui';
routeUI.innerHTML = `
  <div id="zoneCard" class="zone-card">
    <div class="zone-kicker">Entering</div>
    <div id="zoneName" class="zone-name">Canopy Run</div>
    <div id="zoneDesc" class="zone-desc">Chain clean swings through the upper jungle.</div>
  </div>
  <div class="chain-label">Swing Chain</div>
  <div class="chain"><div id="chainFill" class="chain-fill"></div></div>
  <div id="milestoneToast" class="milestone-toast">100m reached</div>
  <div id="dangerEdge" class="danger-edge"></div>
`;
document.body.appendChild(routeUI);

const c = routeCanvas.getContext('2d');
let W = 0, H = 0, DPR = 1;
function resize() {
  DPR = Math.min(devicePixelRatio || 1, 1.7);
  W = innerWidth; H = innerHeight;
  routeCanvas.width = Math.floor(W * DPR);
  routeCanvas.height = Math.floor(H * DPR);
  routeCanvas.style.width = W + 'px';
  routeCanvas.style.height = H + 'px';
  c.setTransform(DPR, 0, 0, DPR, 0, 0);
}
addEventListener('resize', resize, { passive: true });
resize();

const distanceEl = document.getElementById('distance');
const comboEl = document.getElementById('comboNum');
const speedBarEl = document.getElementById('speedBar');
const zoneCard = document.getElementById('zoneCard');
const zoneName = document.getElementById('zoneName');
const zoneDesc = document.getElementById('zoneDesc');
const chainFill = document.getElementById('chainFill');
const milestoneToast = document.getElementById('milestoneToast');
const dangerEdge = document.getElementById('dangerEdge');

const zones = [
  { start: 0, name: 'Canopy Run', desc: 'Chain clean swings through the upper jungle.' },
  { start: 130, name: 'Waterfall Gap', desc: 'Keep your speed over the misty river drop.' },
  { start: 260, name: 'Temple Approach', desc: 'Ancient ruins tighten the path. Watch the line.' },
  { start: 420, name: 'High Canopy', desc: 'Longer gaps reward perfect release timing.' },
  { start: 620, name: 'Ruin Sprint', desc: 'Fast hazards. Trust the lock ring and release late.' },
  { start: 850, name: 'Sunshaft Valley', desc: 'Stay smooth and keep the chain alive.' }
];

let currentZone = '';
let zoneTimer = 0;
let chain = 0;
let lastCombo = 1;
let lastDistance = 0;
let speed = 0;
let lastMilestone = 0;
let tPrev = performance.now();
let shake = 0;
const trunks = [];
const silhouettes = [];

function rand(a, b) { return a + Math.random() * (b - a); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }

function spawnTrunk(side = Math.random() < 0.5 ? -1 : 1, boost = 1) {
  trunks.push({
    side,
    x: side < 0 ? rand(-120, 80) : rand(W - 80, W + 120),
    y: rand(-80, H * .25),
    w: rand(24, 58),
    h: rand(H * .6, H * 1.2),
    vy: rand(220, 520) * boost,
    bend: rand(-30, 30),
    alpha: rand(.12, .32),
    life: rand(1.0, 2.3), max: 2.3
  });
}

function spawnSilhouette() {
  silhouettes.push({
    x: rand(0, W), y: H + rand(20, 120),
    s: rand(40, 120), vy: rand(18, 46),
    phase: rand(0, Math.PI * 2), alpha: rand(.035, .09)
  });
}
for (let i = 0; i < 8; i++) spawnSilhouette();

function showZone(z) {
  currentZone = z.name;
  zoneName.textContent = z.name;
  zoneDesc.textContent = z.desc;
  zoneCard.classList.add('show');
  zoneTimer = 3.1;
}

function showMilestone(text) {
  milestoneToast.textContent = text;
  milestoneToast.classList.add('show');
  setTimeout(() => milestoneToast.classList.remove('show'), 1150);
}

function updateMeta(dt) {
  const dist = Number(distanceEl?.textContent || 0);
  const combo = Number(comboEl?.textContent || 1);
  const rawSpeedWidth = parseFloat(speedBarEl?.style.width || '0') || 0;
  speed = lerp(speed, clamp(rawSpeedWidth / 100, 0, 1), .12);

  const zone = zones.reduce((a, z) => dist >= z.start ? z : a, zones[0]);
  if (zone.name !== currentZone) showZone(zone);
  if (zoneTimer > 0) {
    zoneTimer -= dt;
    if (zoneTimer <= 0) zoneCard.classList.remove('show');
  }

  if (combo > lastCombo) {
    chain = clamp(chain + 18 + combo * 3, 0, 100);
    shake = Math.min(.8, shake + .16);
  } else {
    chain = Math.max(0, chain - dt * (9 + speed * 7));
  }
  if (combo <= 1 && lastCombo > 1) chain = Math.max(0, chain - 18);
  lastCombo = combo;
  chainFill.style.width = `${chain}%`;

  const milestone = Math.floor(dist / 100) * 100;
  if (milestone > 0 && milestone !== lastMilestone && dist > lastDistance) {
    lastMilestone = milestone;
    showMilestone(`${milestone}m reached`);
  }
  dangerEdge.classList.toggle('on', speed < .22 && dist > 40 && combo <= 1);
  lastDistance = dist;
}

function drawLeafShape(ctx, x, y, s, rot, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = `rgba(5,35,13,${alpha})`;
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 1.25, s * .42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `rgba(4,25,10,${alpha * .55})`;
  ctx.beginPath();
  ctx.moveTo(-s, 0);
  ctx.lineTo(s, 0);
  ctx.stroke();
  ctx.restore();
}

function drawForeground(dt, now) {
  c.clearRect(0, 0, W, H);
  const boost = 0.7 + speed * 1.8;

  if (Math.random() < .025 + speed * .045) spawnTrunk(-1, boost);
  if (Math.random() < .025 + speed * .045) spawnTrunk(1, boost);
  if (Math.random() < .01) spawnSilhouette();

  // distant valley silhouettes
  c.save();
  c.globalCompositeOperation = 'source-over';
  for (let i = silhouettes.length - 1; i >= 0; i--) {
    const s = silhouettes[i];
    s.y -= s.vy * dt;
    s.x += Math.sin(now * .0005 + s.phase) * 8 * dt;
    c.fillStyle = `rgba(0,22,8,${s.alpha})`;
    c.beginPath();
    c.moveTo(s.x - s.s * 1.4, H);
    c.quadraticCurveTo(s.x - s.s * .6, s.y - s.s * .5, s.x, s.y);
    c.quadraticCurveTo(s.x + s.s * .7, s.y + s.s * .1, s.x + s.s * 1.5, H);
    c.closePath();
    c.fill();
    if (s.y < H * .25) {
      silhouettes.splice(i, 1);
      spawnSilhouette();
    }
  }
  c.restore();

  // dark side canopy frames to make the path feel directed
  const edgeA = .14 + speed * .10;
  const leftGrad = c.createLinearGradient(0, 0, W * .34, 0);
  leftGrad.addColorStop(0, `rgba(0,20,7,${edgeA})`);
  leftGrad.addColorStop(1, 'rgba(0,20,7,0)');
  c.fillStyle = leftGrad; c.fillRect(0, 0, W * .38, H);
  const rightGrad = c.createLinearGradient(W, 0, W * .66, 0);
  rightGrad.addColorStop(0, `rgba(0,20,7,${edgeA})`);
  rightGrad.addColorStop(1, 'rgba(0,20,7,0)');
  c.fillStyle = rightGrad; c.fillRect(W * .62, 0, W * .38, H);

  // flyby trunks/branches
  for (let i = trunks.length - 1; i >= 0; i--) {
    const tr = trunks[i];
    tr.life -= dt;
    tr.y += tr.vy * dt;
    tr.x += tr.side * -1 * speed * 45 * dt;
    const a = clamp(tr.life / tr.max, 0, 1) * tr.alpha;
    c.save();
    c.translate(tr.x, tr.y);
    c.rotate(tr.side * .18 + Math.sin(now * .001 + tr.x) * .035);
    const grd = c.createLinearGradient(-tr.w, 0, tr.w, 0);
    grd.addColorStop(0, `rgba(10,38,13,${a * .65})`);
    grd.addColorStop(.5, `rgba(33,37,18,${a})`);
    grd.addColorStop(1, `rgba(5,24,9,${a * .6})`);
    c.fillStyle = grd;
    c.beginPath();
    c.roundRect(-tr.w * .5, 0, tr.w, tr.h, tr.w * .35);
    c.fill();
    for (let b = 0; b < 3; b++) {
      c.strokeStyle = `rgba(8,25,8,${a * .75})`;
      c.lineWidth = tr.w * .12;
      c.beginPath();
      const yy = tr.h * (.22 + b * .18);
      c.moveTo(0, yy);
      c.quadraticCurveTo(tr.side * rand(50, 100), yy - rand(30, 80), tr.side * rand(100, 180), yy - rand(70, 140));
      c.stroke();
    }
    c.restore();
    if (tr.life <= 0 || tr.y > H + tr.h) trunks.splice(i, 1);
  }

  // top canopy leaves
  for (let i = 0; i < 18; i++) {
    const x = (i * 83 + Math.sin(now * .00035 + i) * 22) % (W + 90) - 45;
    const y = 15 + Math.sin(now * .0007 + i * 2.1) * 20;
    drawLeafShape(c, x, y, 20 + (i % 4) * 5, Math.sin(i) * .8, .07 + speed * .04);
  }

  // subtle shake/impact glow from chain upgrades
  if (shake > 0) {
    shake = Math.max(0, shake - dt * .95);
    c.strokeStyle = `rgba(255,216,107,${shake * .18})`;
    c.lineWidth = 3;
    c.beginPath();
    c.ellipse(W / 2, H / 2, W * (.22 + shake * .08), H * (.18 + shake * .06), 0, 0, Math.PI * 2);
    c.stroke();
  }
}

let prev = performance.now();
function frame(now) {
  const dt = Math.min(.033, (now - prev) / 1000 || .016);
  prev = now;
  updateMeta(dt);
  drawForeground(dt, now);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
