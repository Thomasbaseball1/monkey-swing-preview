const fxCanvas = document.createElement('canvas');
fxCanvas.id = 'screen-fx';
fxCanvas.setAttribute('aria-hidden', 'true');
document.body.appendChild(fxCanvas);

const ctx = fxCanvas.getContext('2d');
let W = 0, H = 0, DPR = 1;
let hold = false;
let targetIntensity = 0;
let intensity = 0;
let lastDistance = 0;
let apparentSpeed = 0;
let audioReady = false;
let audioCtx, windGain, swingOsc, pickupOsc;

const particles = [];
const leaves = [];
const pollen = [];
const streaks = [];
const distanceEl = document.getElementById('distance');
const bananaEl = document.getElementById('bananas');
const speedBar = document.getElementById('speedBar');
const callout = document.getElementById('callout');

function resizeFx() {
  DPR = Math.min(window.devicePixelRatio || 1, 1.7);
  W = window.innerWidth;
  H = window.innerHeight;
  fxCanvas.width = Math.floor(W * DPR);
  fxCanvas.height = Math.floor(H * DPR);
  fxCanvas.style.width = W + 'px';
  fxCanvas.style.height = H + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener('resize', resizeFx, { passive: true });
resizeFx();

function rand(a, b) { return a + Math.random() * (b - a); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }

function makePollen() {
  for (let i = 0; i < 70; i++) {
    pollen.push({
      x: rand(0, W), y: rand(0, H), r: rand(0.7, 2.2),
      z: rand(0.25, 1), drift: rand(-0.16, 0.16), phase: rand(0, Math.PI * 2),
      a: rand(0.06, 0.24)
    });
  }
}
makePollen();

function spawnLeaf(boost = 1) {
  leaves.push({
    x: rand(-80, W + 80), y: rand(-60, H * 0.7),
    vx: rand(-60, 70) * boost, vy: rand(140, 380) * boost,
    rot: rand(0, Math.PI * 2), vr: rand(-4, 4),
    sx: rand(11, 28), sy: rand(5, 13), life: rand(1.0, 2.2), max: 2.2,
    hue: Math.random() < 0.5 ? 'green' : 'gold'
  });
}

function spawnStreak(boost = 1) {
  streaks.push({
    x: rand(-50, W + 50), y: rand(0, H),
    len: rand(40, 140) * boost, w: rand(0.8, 2.2),
    life: rand(0.18, 0.45), max: 0.45,
    vx: rand(-18, 18), vy: rand(680, 1100) * boost
  });
}

function burstTextPulse() {
  const flash = document.getElementById('flash');
  if (!flash) return;
  flash.classList.add('on');
  setTimeout(() => flash.classList.remove('on'), 90);
}

let lastBananas = Number(bananaEl?.textContent || 0);
function watchBananas() {
  const b = Number(bananaEl?.textContent || 0);
  if (b > lastBananas) {
    for (let i = 0; i < 18; i++) {
      particles.push({ x: W * 0.72, y: H * 0.15, vx: rand(-180, 180), vy: rand(-120, 170), r: rand(2, 5), life: rand(0.45, 0.8), max: 0.8, color: 'gold' });
    }
    burstTextPulse();
    playPickup();
  }
  lastBananas = b;
}
setInterval(watchBananas, 160);

function initAudio() {
  if (audioReady) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    windGain = audioCtx.createGain();
    windGain.gain.value = 0.0001;
    windGain.connect(audioCtx.destination);

    const bufferSize = 2 * audioCtx.sampleRate;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = (Math.random() * 2 - 1) * 0.45;
    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 420;
    noise.connect(filter);
    filter.connect(windGain);
    noise.start();

    audioReady = true;
  } catch (e) {}
}

function playWhoosh() {
  if (!audioReady || !audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(130, now);
  osc.frequency.exponentialRampToValueAtTime(55, now + 0.18);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(700, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.035, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
  osc.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
  osc.start(now); osc.stop(now + 0.22);
}

function playPickup() {
  if (!audioReady || !audioCtx) return;
  const now = audioCtx.currentTime;
  for (const [f, delay] of [[720, 0], [980, 0.055]]) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle'; osc.frequency.value = f;
    gain.gain.setValueAtTime(0.0001, now + delay);
    gain.gain.exponentialRampToValueAtTime(0.025, now + delay + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.11);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(now + delay); osc.stop(now + delay + 0.12);
  }
}

window.addEventListener('pointerdown', () => { hold = true; initAudio(); playWhoosh(); }, { passive: true });
window.addEventListener('pointerup', () => { hold = false; playWhoosh(); }, { passive: true });
window.addEventListener('touchstart', () => { hold = true; initAudio(); playWhoosh(); }, { passive: true });
window.addEventListener('touchend', () => { hold = false; playWhoosh(); }, { passive: true });

let prev = performance.now();
function draw(now) {
  const dt = Math.min(0.033, (now - prev) / 1000 || 0.016);
  prev = now;
  ctx.clearRect(0, 0, W, H);

  const dist = Number(distanceEl?.textContent || 0);
  apparentSpeed = lerp(apparentSpeed, clamp((dist - lastDistance) * 4.0, 0, 42), 0.14);
  lastDistance = dist;
  const speedWidth = parseFloat(speedBar?.style.width || '0') || 0;
  targetIntensity = clamp(speedWidth / 100 + apparentSpeed / 55 + (hold ? 0.16 : 0), 0, 1.45);
  intensity = lerp(intensity, targetIntensity, 0.08);

  if (windGain && audioCtx) {
    const gain = clamp(0.004 + intensity * 0.045, 0.0001, 0.06);
    windGain.gain.setTargetAtTime(gain, audioCtx.currentTime, 0.12);
  }

  // Sun bloom / warm cinematic grade
  const sunX = W * 0.68 + Math.sin(now * 0.00015) * 20;
  const sunY = H * 0.18;
  const rg = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, W * 0.72);
  rg.addColorStop(0, `rgba(255,238,174,${0.16 + intensity * 0.05})`);
  rg.addColorStop(0.14, `rgba(255,209,92,${0.06 + intensity * 0.03})`);
  rg.addColorStop(1, 'rgba(255,209,92,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, W, H);

  // Pollen / dust motes
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (const p of pollen) {
    p.y += (18 + intensity * 36) * p.z * dt;
    p.x += (Math.sin(now * 0.001 + p.phase) * 10 + p.drift * 25) * dt;
    if (p.y > H + 10) { p.y = -10; p.x = rand(0, W); }
    if (p.x < -10) p.x = W + 10;
    if (p.x > W + 10) p.x = -10;
    ctx.fillStyle = `rgba(255,232,160,${p.a})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.z, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  // Speed streaks
  if (Math.random() < 0.22 + intensity * 0.32) spawnStreak(0.75 + intensity * 1.25);
  for (let i = streaks.length - 1; i >= 0; i--) {
    const s = streaks[i];
    s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt;
    const a = clamp(s.life / s.max, 0, 1) * (0.15 + intensity * 0.18);
    ctx.strokeStyle = `rgba(230,255,225,${a})`;
    ctx.lineWidth = s.w;
    ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - 10, s.y + s.len); ctx.stroke();
    if (s.life <= 0 || s.y > H + 160) streaks.splice(i, 1);
  }

  // Foreground leaf flybys
  if (Math.random() < 0.03 + intensity * 0.07) spawnLeaf(0.8 + intensity * 1.3);
  for (let i = leaves.length - 1; i >= 0; i--) {
    const l = leaves[i];
    l.life -= dt; l.x += l.vx * dt + Math.sin(now * 0.004 + l.rot) * 18 * dt; l.y += l.vy * dt; l.rot += l.vr * dt;
    const a = clamp(l.life / l.max, 0, 1);
    ctx.save();
    ctx.translate(l.x, l.y); ctx.rotate(l.rot);
    ctx.fillStyle = l.hue === 'gold' ? `rgba(199,176,72,${a * 0.55})` : `rgba(43,145,61,${a * 0.62})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, l.sx, l.sy, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(255,255,210,${a * 0.10})`;
    ctx.beginPath(); ctx.moveTo(-l.sx * 0.75, 0); ctx.lineTo(l.sx * 0.75, 0); ctx.stroke();
    ctx.restore();
    if (l.life <= 0 || l.y > H + 120) leaves.splice(i, 1);
  }

  // Edge motion blur / tunnel effect
  const edge = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.22, W / 2, H / 2, Math.max(W, H) * 0.68);
  edge.addColorStop(0, 'rgba(0,0,0,0)');
  edge.addColorStop(0.72, `rgba(0,0,0,${0.10 + intensity * 0.10})`);
  edge.addColorStop(1, `rgba(0,0,0,${0.34 + intensity * 0.22})`);
  ctx.fillStyle = edge; ctx.fillRect(0, 0, W, H);

  // Bottom jungle shadow
  const bottom = ctx.createLinearGradient(0, H * 0.55, 0, H);
  bottom.addColorStop(0, 'rgba(0,0,0,0)');
  bottom.addColorStop(1, `rgba(0,10,4,${0.24 + intensity * 0.08})`);
  ctx.fillStyle = bottom; ctx.fillRect(0, H * 0.45, W, H * 0.55);

  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);
