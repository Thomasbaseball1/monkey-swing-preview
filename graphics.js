const artGrade = document.createElement('div');
artGrade.id = 'art-grade';
document.body.appendChild(artGrade);

const bars = document.createElement('div');
bars.className = 'cinematic-bars';
document.body.appendChild(bars);

const graphicsNote = document.createElement('div');
graphicsNote.className = 'graphics-note';
graphicsNote.innerHTML = '<b>v0.6</b> graphics pass<br>procedural texture + valley depth';
document.body.appendChild(graphicsNote);
setTimeout(() => graphicsNote.style.opacity = '0', 5200);

const gCanvas = document.createElement('canvas');
gCanvas.id = 'graphics-layer';
gCanvas.setAttribute('aria-hidden', 'true');
gCanvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;mix-blend-mode:screen;opacity:.88';
document.body.appendChild(gCanvas);
const g = gCanvas.getContext('2d');

let W = 0, H = 0, DPR = 1;
function resize() {
  DPR = Math.min(devicePixelRatio || 1, 1.7);
  W = innerWidth; H = innerHeight;
  gCanvas.width = Math.floor(W * DPR);
  gCanvas.height = Math.floor(H * DPR);
  gCanvas.style.width = W + 'px';
  gCanvas.style.height = H + 'px';
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
}
addEventListener('resize', resize, { passive: true });
resize();

const distanceEl = document.getElementById('distance');
const speedBar = document.getElementById('speedBar');

function rand(a, b) { return a + Math.random() * (b - a); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }

const cloudBands = [];
const godRays = [];
const textureSpecks = [];
const canopySprites = [];
let prevDist = 0;
let speed = 0;
let t0 = performance.now();

for (let i = 0; i < 8; i++) {
  cloudBands.push({ y: rand(H * .05, H * .55), x: rand(-W, W), w: rand(W * .4, W * .9), h: rand(20, 70), a: rand(.025, .075), spd: rand(2, 8) });
}
for (let i = 0; i < 10; i++) {
  godRays.push({ x: rand(-W * .2, W), y: rand(-H * .2, H * .35), w: rand(50, 180), h: rand(H * .75, H * 1.45), a: rand(.025, .08), rot: rand(-.5, .15) });
}
for (let i = 0; i < 220; i++) {
  textureSpecks.push({ x: rand(0, W), y: rand(0, H), r: rand(.3, 1.2), a: rand(.02, .08), drift: rand(.3, 1.6) });
}
for (let i = 0; i < 30; i++) {
  canopySprites.push({ x: rand(0, W), y: rand(-20, H * .42), s: rand(12, 42), a: rand(.025, .12), phase: rand(0, Math.PI * 2), side: Math.random() < .5 ? -1 : 1 });
}

function drawNoise(intensity) {
  g.save();
  g.globalCompositeOperation = 'overlay';
  for (const p of textureSpecks) {
    p.y += (p.drift + intensity * 2) * .18;
    if (p.y > H) { p.y = 0; p.x = rand(0, W); }
    g.fillStyle = `rgba(255,244,205,${p.a})`;
    g.fillRect(p.x, p.y, p.r, p.r);
  }
  g.restore();
}

function drawValley(now, intensity) {
  const horizon = H * .62;
  g.save();
  g.globalCompositeOperation = 'source-over';
  for (let layer = 0; layer < 4; layer++) {
    const alpha = [0.045, 0.06, 0.075, 0.09][layer];
    const color = layer < 2 ? 'rgba(72,138,91,' : 'rgba(8,45,18,';
    const yBase = horizon + layer * H * .08;
    g.fillStyle = `${color}${alpha})`;
    g.beginPath();
    g.moveTo(0, H);
    for (let x = 0; x <= W + 40; x += 40) {
      const y = yBase + Math.sin(x * .012 + now * .00025 + layer * 2.3) * (18 + layer * 9);
      g.lineTo(x, y);
    }
    g.lineTo(W, H); g.closePath(); g.fill();
  }
  g.restore();
}

function drawCloudMist(now, intensity) {
  g.save();
  g.globalCompositeOperation = 'screen';
  for (const band of cloudBands) {
    band.x += (band.spd + intensity * 14) * .016;
    if (band.x > W + band.w) band.x = -band.w;
    const grd = g.createRadialGradient(band.x, band.y, 0, band.x, band.y, band.w * .55);
    grd.addColorStop(0, `rgba(215,255,230,${band.a})`);
    grd.addColorStop(1, 'rgba(215,255,230,0)');
    g.fillStyle = grd;
    g.beginPath();
    g.ellipse(band.x, band.y, band.w, band.h, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}

function drawGodRays(now, intensity) {
  g.save();
  g.globalCompositeOperation = 'screen';
  for (const ray of godRays) {
    const a = ray.a + intensity * .025 + Math.sin(now * .0007 + ray.x) * .01;
    g.save();
    g.translate(ray.x + Math.sin(now * .00018 + ray.w) * 14, ray.y);
    g.rotate(ray.rot);
    const grad = g.createLinearGradient(0, 0, 0, ray.h);
    grad.addColorStop(0, `rgba(255,231,157,${a})`);
    grad.addColorStop(.45, `rgba(255,231,157,${a * .42})`);
    grad.addColorStop(1, 'rgba(255,231,157,0)');
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(ray.w, 0);
    g.lineTo(ray.w * 1.8, ray.h);
    g.lineTo(-ray.w * .45, ray.h);
    g.closePath();
    g.fill();
    g.restore();
  }
  g.restore();
}

function drawCanopySprites(now, intensity) {
  g.save();
  g.globalCompositeOperation = 'multiply';
  for (const leaf of canopySprites) {
    const x = leaf.x + Math.sin(now * .0008 + leaf.phase) * (18 + intensity * 10);
    const y = leaf.y + Math.cos(now * .00055 + leaf.phase) * 10;
    g.save();
    g.translate(x, y);
    g.rotate(Math.sin(now * .0007 + leaf.phase) * .45);
    g.fillStyle = `rgba(0,32,10,${leaf.a})`;
    for (let i = 0; i < 5; i++) {
      g.rotate((Math.PI * 2) / 5);
      g.beginPath();
      g.ellipse(leaf.s * .55, 0, leaf.s, leaf.s * .26, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  }
  g.restore();
}

function drawColorWash(intensity) {
  g.save();
  g.globalCompositeOperation = 'soft-light';
  const warm = g.createLinearGradient(0, 0, W, H);
  warm.addColorStop(0, `rgba(255,218,133,${.08 + intensity * .04})`);
  warm.addColorStop(.45, `rgba(78,170,92,${.045})`);
  warm.addColorStop(1, `rgba(0,18,8,${.16 + intensity * .04})`);
  g.fillStyle = warm;
  g.fillRect(0, 0, W, H);
  g.restore();
}

function frame(now) {
  const dist = Number(distanceEl?.textContent || 0);
  const rawSpeedWidth = parseFloat(speedBar?.style.width || '0') || 0;
  const distSpeed = clamp((dist - prevDist) * .08, 0, 1);
  prevDist = dist;
  speed = lerp(speed, clamp(rawSpeedWidth / 100 + distSpeed, 0, 1.4), .09);

  g.clearRect(0, 0, W, H);
  drawValley(now, speed);
  drawGodRays(now, speed);
  drawCloudMist(now, speed);
  drawCanopySprites(now, speed);
  drawColorWash(speed);
  drawNoise(speed);

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
