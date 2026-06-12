import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

const $ = (id) => document.getElementById(id);
const ui = {
  dist: $('distance'), ban: $('bananas'), combo: $('combo'), comboNum: $('comboNum'),
  reticle: $('reticle'), callout: $('callout'), menu: $('menu'), dead: $('dead'),
  deadStats: $('deadStats'), start: $('start'), restart: $('restart'), speedBar: $('speedBar'), flash: $('flash')
};

const canvas = $('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.14;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x8fd5a7, 0.014);
const camera = new THREE.PerspectiveCamera(78, innerWidth / innerHeight, 0.08, 620);
scene.add(camera);
const clock = new THREE.Clock();

const input = { hold: false, active: false, lastX: 0, steer: 0, target: 0 };
const game = { running: false, dead: false, time: 0, bananas: 0, combo: 1, best: 0, lock: null, msgTimer: 0, lastVine: null };
const player = {
  pos: new THREE.Vector3(0, 8, 0),
  vel: new THREE.Vector3(0, 0, 24),
  attached: null,
  rope: 9.5,
  assist: 0,
  roll: 0,
  bob: 0,
  shake: 0
};

const groups = {
  world: new THREE.Group(), vines: new THREE.Group(), pickups: new THREE.Group(),
  hazards: new THREE.Group(), river: new THREE.Group(), fx: new THREE.Group(), arms: new THREE.Group(),
  canopy: new THREE.Group(), birds: new THREE.Group()
};
scene.add(groups.world, groups.vines, groups.pickups, groups.hazards, groups.river, groups.fx, groups.canopy, groups.birds);
camera.add(groups.arms);

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

const mats = {
  leafDark: new THREE.MeshStandardMaterial({ color: 0x104f25, roughness: 0.92 }),
  leaf: new THREE.MeshStandardMaterial({ color: 0x1d7d35, roughness: 0.88 }),
  leafSun: new THREE.MeshStandardMaterial({ color: 0x4cb75c, roughness: 0.82 }),
  trunk: new THREE.MeshStandardMaterial({ color: 0x593518, roughness: 0.96 }),
  bark: new THREE.MeshStandardMaterial({ color: 0x342112, roughness: 1 }),
  vine: new THREE.MeshStandardMaterial({ color: 0x306a2e, roughness: 0.84 }),
  vineRidge: new THREE.MeshStandardMaterial({ color: 0x77542a, roughness: 0.9 }),
  rock: new THREE.MeshStandardMaterial({ color: 0x4c5845, roughness: 0.95 }),
  ruin: new THREE.MeshStandardMaterial({ color: 0x85806a, roughness: 0.9 }),
  banana: new THREE.MeshStandardMaterial({ color: 0xffd845, roughness: 0.46, emissive: 0x2d1d00, emissiveIntensity: 0.16 }),
  fur: new THREE.MeshStandardMaterial({ color: 0x7a4324, roughness: 0.92 }),
  palm: new THREE.MeshStandardMaterial({ color: 0x2c8c3b, roughness: 0.86, side: THREE.DoubleSide }),
  hazard: new THREE.MeshStandardMaterial({ color: 0x5a3018, roughness: 0.9 }),
  water: new THREE.MeshStandardMaterial({ color: 0x61d7ff, transparent: true, opacity: 0.55, roughness: 0.18, metalness: 0.03 }),
  glow: new THREE.MeshBasicMaterial({ color: 0xffdf74, transparent: true, opacity: 0.55, depthWrite: false }),
  lock: new THREE.MeshBasicMaterial({ color: 0x72ff9a, transparent: true, opacity: 0.66, depthWrite: false }),
  mist: new THREE.MeshBasicMaterial({ color: 0xe6fff0, transparent: true, opacity: 0.11, depthWrite: false, side: THREE.DoubleSide }),
  sunShaft: new THREE.MeshBasicMaterial({ color: 0xffe39a, transparent: true, opacity: 0.05, side: THREE.DoubleSide, depthWrite: false }),
  bird: new THREE.MeshBasicMaterial({ color: 0x13210f, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
};

function cylinder(a, b, h, radial = 8, mat = mats.trunk) {
  return new THREE.Mesh(new THREE.CylinderGeometry(a, b, h, radial, 1), mat);
}

function readUnlocks() {
  try { return (JSON.parse(localStorage.getItem('monkeySwingProgressV1')) || {}).unlocks || {}; }
  catch { return {}; }
}

function makeSky() {
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: { top: { value: new THREE.Color(0x89dcf4) }, mid: { value: new THREE.Color(0x9bd99e) }, bot: { value: new THREE.Color(0x07190d) } },
    vertexShader: `varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `uniform vec3 top;uniform vec3 mid;uniform vec3 bot;varying vec3 p;void main(){float h=normalize(p).y*.5+.5;vec3 c=mix(bot,mid,smoothstep(.02,.55,h));c=mix(c,top,smoothstep(.50,1.0,h));gl_FragColor=vec4(c,1.0);}`
  });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(560, 32, 16), skyMat));
  const sun = new THREE.Mesh(new THREE.SphereGeometry(18, 24, 12), new THREE.MeshBasicMaterial({ color: 0xffe6a1, transparent: true, opacity: 0.92 }));
  sun.position.set(-95, 90, 240);
  scene.add(sun);
}
makeSky();
scene.add(new THREE.HemisphereLight(0xbff7ff, 0x13280d, 1.55));
const sunLight = new THREE.DirectionalLight(0xffd189, 3.8); sunLight.position.set(-45, 75, -35); scene.add(sunLight);
const rim = new THREE.DirectionalLight(0x78ffb3, 1.08); rim.position.set(36, 30, 35); scene.add(rim);

function makeLeafCluster(scale = 1, richness = 8) {
  const g = new THREE.Group();
  for (let i = 0; i < richness; i++) {
    const mat = Math.random() < 0.23 ? mats.leafSun : Math.random() < 0.5 ? mats.leaf : mats.leafDark;
    const o = new THREE.Mesh(new THREE.SphereGeometry(rand(1.1, 2.2) * scale, 8, 6), mat);
    o.scale.set(rand(1.2, 2.0), rand(0.35, 0.68), rand(0.75, 1.2));
    o.position.set(Math.cos(i * 2.17) * rand(0.55, 1.9) * scale, rand(-0.35, 0.8) * scale, Math.sin(i * 1.63) * rand(0.55, 1.9) * scale);
    o.rotation.set(rand(-0.3, 0.3), rand(0, Math.PI), rand(-0.3, 0.3));
    g.add(o);
  }
  return g;
}

function makePalmFan(scale = 1) {
  const g = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(1.2 * scale, 5.5 * scale), mats.palm);
    leaf.rotation.z = (i - 3) * 0.35;
    leaf.rotation.x = rand(-0.65, -0.15);
    leaf.position.x = Math.sin((i - 3) * 0.35) * 1.8 * scale;
    leaf.position.z = Math.cos((i - 3) * 0.35) * 1.2 * scale;
    g.add(leaf);
  }
  return g;
}

function tree(x, z, big = false) {
  const g = new THREE.Group();
  const h = big ? rand(34, 55) : rand(22, 43);
  const trunk = cylinder(rand(0.35, 0.75), rand(0.8, 1.35), h, 7, mats.trunk);
  trunk.position.y = h / 2; trunk.rotation.z = rand(-0.08, 0.08); g.add(trunk);
  for (let i = 0; i < (big ? 3 : 1); i++) {
    const branch = cylinder(0.18, 0.28, rand(5, 11), 6, mats.bark);
    branch.position.set(rand(-0.9, 0.9), rand(h * 0.55, h * 0.82), rand(-0.9, 0.9));
    branch.rotation.set(rand(0.6, 1.2), rand(0, Math.PI * 2), rand(-0.7, 0.7));
    g.add(branch);
  }
  const crown = Math.random() < 0.28 ? makePalmFan(rand(1.5, 2.4)) : makeLeafCluster(big ? rand(3.4, 5.1) : rand(2.4, 4.2), big ? 11 : 8);
  crown.position.y = h + rand(-0.8, 2.4); g.add(crown);
  g.position.set(x, -7, z); g.rotation.y = rand(-0.25, 0.25); groups.world.add(g);
}

function rock(x, z, s = 1) {
  const o = new THREE.Mesh(new THREE.DodecahedronGeometry(rand(2.5, 7) * s, 0), mats.rock);
  o.position.set(x, rand(-4, 1.5), z); o.scale.set(rand(1, 2.0), rand(1.7, 4.1), rand(1, 2.0));
  o.rotation.set(rand(0, 0.5), rand(0, Math.PI * 2), rand(0, 0.42)); groups.world.add(o);
}

function cliffWall(side, z) {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const b = new THREE.Mesh(new THREE.DodecahedronGeometry(rand(4, 10), 0), mats.rock);
    b.position.set(side * rand(18, 31), rand(-8, 8), z + rand(-10, 10));
    b.scale.set(rand(1.2, 2.7), rand(2.2, 5.2), rand(1.2, 2.5));
    b.rotation.set(rand(-0.3, 0.3), rand(0, Math.PI), rand(-0.3, 0.3)); g.add(b);
  }
  groups.world.add(g);
}

function ruin(z) {
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const c = cylinder(0.45, 0.62, rand(6, 12), 10, mats.ruin);
    c.position.set((i - 2) * 2.5, c.geometry.parameters.height / 2 - 5, rand(-1.1, 1.1)); g.add(c);
  }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(12, 1.15, 1.6), mats.ruin); lintel.position.y = 6.1; g.add(lintel);
  g.position.set(rand(-9, 9), 0, z); g.rotation.y = rand(-0.38, 0.38); groups.world.add(g);
}

function waterfall(z) {
  const g = new THREE.Group(), x = rand(-18, 18);
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(11, 34, 1, 12), mats.water); sheet.position.set(x, 4, z); sheet.rotation.y = rand(-0.35, 0.35); g.add(sheet);
  const mist = new THREE.Mesh(new THREE.SphereGeometry(8.5, 16, 8), mats.mist); mist.position.set(x, -12, z + 3); mist.scale.set(1.7, 0.35, 1); g.add(mist);
  groups.world.add(g);
}

let vines = [], bananas = [], hazards = [], maxZ = 0;

function buildVineGeometry(points, thick = 0.095) {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 22, thick, 8, false);
}
function setVineGeometry(v, points) {
  const data = v.userData;
  data.ropeMesh.geometry.dispose();
  data.ridgeMesh.geometry.dispose();
  data.ropeMesh.geometry = buildVineGeometry(points, 0.095);
  data.ridgeMesh.geometry = buildVineGeometry(points.map(p => p.clone().add(new THREE.Vector3(0.075, 0, 0))), 0.034);
}
function restoreVine(v) {
  if (!v.userData.deformed) return;
  setVineGeometry(v, v.userData.restPoints);
  v.userData.ring.position.copy(v.userData.gripOffset);
  v.userData.deformed = false;
}
function deformVineToPlayer(v) {
  const localEnd = player.pos.clone().sub(v.position).add(new THREE.Vector3(input.steer * 0.08, -0.25, -0.35));
  const p0 = new THREE.Vector3(0, 0, 0);
  const p1 = localEnd.clone().multiplyScalar(0.33).add(new THREE.Vector3(0.18, -0.08, 0.05));
  const p2 = localEnd.clone().multiplyScalar(0.68).add(new THREE.Vector3(-0.12, 0.05, -0.05));
  setVineGeometry(v, [p0, p1, p2, localEnd]);
  v.userData.ring.position.copy(localEnd);
  v.userData.deformed = true;
}

function vine(x, y, z) {
  const g = new THREE.Group();
  const p0 = new THREE.Vector3(0, 0, 0);
  const p1 = new THREE.Vector3(rand(-0.35, 0.35), -2.5, rand(-0.22, 0.22));
  const p2 = new THREE.Vector3(rand(-0.55, 0.55), -5.4, rand(-0.3, 0.3));
  const p3 = new THREE.Vector3(rand(-0.75, 0.75), -8.0, rand(-0.4, 0.4));
  const restPoints = [p0, p1, p2, p3].map(p => p.clone());
  const ropeMesh = new THREE.Mesh(buildVineGeometry(restPoints, 0.095), mats.vine);
  const ridgeMesh = new THREE.Mesh(buildVineGeometry(restPoints.map(p => p.clone().add(new THREE.Vector3(0.075, 0, 0))), 0.034), mats.vineRidge);
  g.add(ropeMesh, ridgeMesh);
  for (let i = 0; i < 3; i++) {
    const lf = makeLeafCluster(0.35, 4);
    lf.position.set(rand(-0.6, 0.6), rand(-5.0, -1.1), rand(-0.25, 0.25));
    lf.scale.setScalar(rand(0.6, 1.0)); g.add(lf);
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.045, 8, 36), mats.lock);
  ring.visible = false; ring.rotation.x = Math.PI / 2; ring.position.copy(p3); g.add(ring);
  g.position.set(x, y, z);
  g.userData = {
    anchor: new THREE.Vector3(x, y, z),
    gripOffset: p3.clone(),
    grabPoint: new THREE.Vector3(x + p3.x, y + p3.y, z + p3.z),
    ring, ropeMesh, ridgeMesh, restPoints,
    sway: rand(0, Math.PI * 2), deformed: false
  };
  groups.vines.add(g); vines.push(g);
}

function banana(x, y, z) {
  const g = new THREE.Group();
  const tor = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.105, 8, 24, Math.PI * 1.18), mats.banana); tor.rotation.z = 0.72; g.add(tor);
  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.82, 12, 8), mats.glow); glow.scale.set(1, 0.72, 1); g.add(glow);
  g.position.set(x, y, z); g.userData = { spin: rand(0, Math.PI * 2), collected: false }; groups.pickups.add(g); bananas.push(g);
}

function hazard(x, y, z) {
  const g = new THREE.Group(); const log = cylinder(0.42, 0.55, 5.2, 10, mats.hazard); log.rotation.z = Math.PI / 2; g.add(log);
  for (let i = 0; i < 10; i++) { const sp = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.78, 6), mats.rock); sp.position.set(rand(-2.35, 2.35), rand(0.25, 0.62), rand(-0.28, 0.28)); sp.rotation.x = Math.PI; g.add(sp); }
  g.position.set(x, y, z); g.rotation.y = rand(-0.45, 0.45); g.userData = { radius: 1.55 }; groups.hazards.add(g); hazards.push(g);
}

function riverPiece(z) {
  const w = new THREE.Mesh(new THREE.PlaneGeometry(10, 38), mats.water); w.position.set(Math.sin(z * 0.012) * 8, -12.2, z + 17); w.rotation.x = -Math.PI / 2; groups.river.add(w);
}

function canopyCurtain(z) {
  const side = Math.random() < 0.5 ? -1 : 1;
  const g = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const lf = new THREE.Mesh(new THREE.PlaneGeometry(rand(1.8, 3.2), rand(4.0, 6.2)), mats.palm);
    lf.position.set(side * rand(5.5, 10.5), rand(9, 17), z + rand(-6, 9));
    lf.rotation.set(rand(-0.4, 0.4), side * rand(0.7, 1.25), rand(-0.9, 0.9)); g.add(lf);
  }
  groups.canopy.add(g);
}

function section(z) {
  const big = Math.floor(z / 120) % 3 === 1;
  for (let i = 0; i < 2; i++) { tree(rand(-30, -10), z + rand(-8, 8), big && Math.random() < 0.35); tree(rand(10, 30), z + rand(-8, 8), big && Math.random() < 0.35); }
  if (Math.random() < 0.7) cliffWall(-1, z); if (Math.random() < 0.7) cliffWall(1, z);
  if (Math.random() < 0.58) rock(rand(-18, -8), z + rand(-8, 8), rand(0.75, 1.55)); if (Math.random() < 0.58) rock(rand(8, 18), z + rand(-8, 8), rand(0.75, 1.55));
  if (Math.random() < 0.88) vine(rand(-4.0, 4.0), rand(13.2, 16.5), z + rand(0, 4));
  if (Math.random() < 0.64) { const x = rand(-3.8, 3.8); banana(x, rand(6.5, 10.5), z + rand(-1, 6)); if (Math.random() < 0.45) banana(x + rand(-1.1, 1.1), rand(7, 10.8), z + rand(2, 8)); }
  if (z > 85 && Math.random() < 0.28) hazard(rand(-4.6, 4.6), rand(6.5, 10.6), z + rand(4, 9));
  if (Math.floor(z) % 240 < 12) ruin(z + 48); if (Math.floor(z) % 320 < 12) waterfall(z + 68); if (Math.random() < 0.5) riverPiece(z); if (Math.random() < 0.55) canopyCurtain(z);
}

function ensureWorld() {
  while (maxZ < player.pos.z + 460) { maxZ += 12; section(maxZ); }
  for (const group of [groups.world, groups.vines, groups.pickups, groups.hazards, groups.river, groups.canopy]) {
    for (let i = group.children.length - 1; i >= 0; i--) if (group.children[i].position.z < player.pos.z - 90) group.remove(group.children[i]);
  }
  vines = vines.filter(o => o.parent && o.position.z > player.pos.z - 90);
  bananas = bananas.filter(o => o.parent && o.position.z > player.pos.z - 90);
  hazards = hazards.filter(o => o.parent && o.position.z > player.pos.z - 90);
}

function makeArms() {
  function hand(side) {
    const g = new THREE.Group();
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.88, 6, 10), mats.fur); upper.rotation.set(0.5, 0, side * 0.55); upper.position.set(side * 0.43, -0.38, -0.62); g.add(upper);
    const palm = new THREE.Mesh(new THREE.SphereGeometry(0.19, 14, 10), mats.fur); palm.scale.set(1, 0.82, 1.22); palm.position.set(side * 0.31, -0.62, -0.98); g.add(palm);
    for (let i = 0; i < 5; i++) { const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.024, 0.22, 4, 6), mats.fur); f.position.set(side * (0.205 + i * 0.032), -0.64, -1.15); f.rotation.x = 1.2; g.add(f); }
    return g;
  }
  groups.arms.add(hand(-1), hand(1)); groups.arms.userData.l = groups.arms.children[0]; groups.arms.userData.r = groups.arms.children[1];
}
makeArms();

function makeAtmosphere() {
  const shafts = new THREE.Group();
  for (let i = 0; i < 18; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(rand(8, 18), rand(78, 130)), mats.sunShaft.clone()); p.material.opacity = rand(0.022, 0.065); p.position.set(rand(-58, 58), rand(18, 38), rand(20, 320)); p.rotation.set(rand(0.35, 0.85), rand(-0.45, 0.45), rand(-0.2, 0.2)); shafts.add(p); }
  scene.add(shafts); groups.fx.userData.shafts = shafts;
  for (let i = 0; i < 20; i++) { const mist = new THREE.Mesh(new THREE.PlaneGeometry(rand(18, 46), rand(8, 18)), mats.mist.clone()); mist.material.opacity = rand(0.035, 0.095); mist.position.set(rand(-38, 38), rand(-6, 8), rand(20, 360)); mist.rotation.set(rand(-0.15, 0.15), rand(-0.3, 0.3), rand(-0.1, 0.1)); groups.fx.add(mist); }
  for (let i = 0; i < 16; i++) { const bird = new THREE.Mesh(new THREE.PlaneGeometry(rand(0.6, 1.2), rand(0.12, 0.22)), mats.bird); bird.position.set(rand(-45, 45), rand(18, 35), rand(40, 360)); bird.userData = { phase: rand(0, Math.PI * 2), speed: rand(0.6, 1.4) }; groups.birds.add(bird); }
}
makeAtmosphere();

function reset() {
  game.running = true; game.dead = false; game.time = 0; game.bananas = 0; game.combo = 1; game.lastVine = null; game.msgTimer = 0;
  player.pos.set(0, 8, 0); player.vel.set(0, 0, 25); player.attached = null; player.rope = 9.5; player.assist = 0.45; player.shake = 0;
  input.hold = false; input.target = 0; input.steer = 0;
  for (const g of [groups.world, groups.vines, groups.pickups, groups.hazards, groups.river, groups.canopy]) while (g.children.length) g.remove(g.children[0]);
  vines = []; bananas = []; hazards = []; maxZ = 0; for (let i = 0; i < 38; i++) { maxZ += 12; section(maxZ); }
  ui.menu.classList.add('hide'); ui.dead.classList.remove('show'); navigator.vibrate && navigator.vibrate(8);
}
function die() { if (game.dead) return; game.dead = true; game.running = false; game.best = Math.max(game.best, Math.floor(player.pos.z)); ui.deadStats.textContent = `Distance: ${Math.floor(player.pos.z)}m • Bananas: ${game.bananas} • Best: ${game.best}m`; ui.dead.classList.add('show'); navigator.vibrate && navigator.vibrate([35, 40, 90]); }
function call(text) { ui.callout.textContent = text; ui.callout.classList.add('show'); game.msgTimer = 1.05; }
function flash() { ui.flash?.classList.add('on'); setTimeout(() => ui.flash?.classList.remove('on'), 80); }

function currentHandPoint() {
  return player.pos.clone().add(new THREE.Vector3(input.steer * 0.18, -0.15, 0.35));
}

function lockVine() {
  const unlocks = readUnlocks();
  const hand = currentHandPoint();
  let best = null, bestScore = 9999;
  for (const v of vines) {
    v.userData.ring.visible = false;
    if (v === game.lastVine || v === player.attached) continue;
    const gp = v.userData.grabPoint;
    const to = new THREE.Vector3().subVectors(gp, hand);
    const dist = to.length();
    const zMin = -0.8;
    const zMax = unlocks.grip ? 13.5 : 11.2;
    const sideMax = unlocks.grip ? 5.6 : 4.6;
    const verticalMax = unlocks.grip ? 4.8 : 3.9;
    const grabRadius = unlocks.grip ? 6.2 : 5.15;
    if (to.z < zMin || to.z > zMax) continue;
    if (Math.abs(to.x) > sideMax) continue;
    if (Math.abs(to.y) > verticalMax) continue;
    if (dist > grabRadius) continue;
    const score = Math.abs(to.z - 4.8) * 1.25 + Math.abs(to.x) * 1.7 + Math.abs(to.y) * 1.05 + dist * 0.3;
    if (score < bestScore) { bestScore = score; best = v; }
  }
  if (best) best.userData.ring.visible = true;
  game.lock = best;
  ui.reticle.classList.toggle('lock', !!best);
  return best;
}

function attach(v) {
  if (!v || player.attached) return;
  const hand = currentHandPoint();
  const toGrip = v.userData.grabPoint.clone().sub(hand);
  if (toGrip.length() > (readUnlocks().grip ? 6.4 : 5.35)) return;
  player.attached = v;
  game.lastVine = v;
  player.rope = clamp(player.pos.distanceTo(v.userData.anchor), 6.8, 12.4);
  player.vel.z = Math.max(player.vel.z, 19.5);
  player.vel.y = Math.max(player.vel.y, -1.0);
  player.assist = 0.18;
  player.shake = 0.035;
  game.combo = clamp(game.combo + 0.25, 1, 10);
  navigator.vibrate && navigator.vibrate(8);
}

function release() {
  if (!player.attached) return;
  const unlocks = readUnlocks();
  const anchor = player.attached.userData.anchor;
  const forward = player.pos.z - anchor.z;
  const perfect = forward > player.rope * 0.38 && player.vel.y > -4.5;
  player.attached = null;
  const powerBonus = unlocks.launch ? 2.4 : 0;
  player.vel.z = Math.max(player.vel.z, perfect ? 28 : 23.5) + (perfect ? 3.0 : 0) + game.combo * 0.32 + powerBonus;
  player.vel.y += perfect ? 2.9 : 1.6;
  player.assist = perfect ? 0.85 : 0.55;
  player.shake = perfect ? 0.07 : 0.035;
  if (perfect) { game.combo = clamp(game.combo + 0.65, 1, 10); call('Perfect release'); flash(); navigator.vibrate && navigator.vibrate([8, 20, 12]); }
}

function physics(dt) {
  input.steer = lerp(input.steer, input.target, 1 - Math.pow(0.001, dt));
  player.assist = Math.max(0, player.assist - dt * 0.65);
  const target = lockVine();
  if (input.hold && !player.attached && target) attach(target);
  if (!input.hold && player.attached) release();

  if (player.attached) {
    const a = player.attached.userData.anchor;
    player.vel.y -= 13.4 * dt;
    player.vel.x += input.steer * 10.5 * dt;
    player.vel.z += 4.3 * dt;
    player.pos.addScaledVector(player.vel, dt);
    const ropeVec = new THREE.Vector3().subVectors(player.pos, a);
    const len = ropeVec.length();
    if (len > player.rope) {
      const n = ropeVec.normalize();
      player.pos.copy(a).addScaledVector(n, player.rope);
      const radial = n.multiplyScalar(player.vel.dot(n));
      player.vel.sub(radial.multiplyScalar(0.965));
      player.vel.z += 0.45;
    }
    if (player.pos.z > a.z + player.rope * 0.95 || player.vel.z > 45) release();
  } else {
    player.vel.y -= 16.6 * dt;
    player.vel.z = lerp(player.vel.z, 22.0, 0.38 * dt);
    player.vel.x += input.steer * 12.0 * dt;
    player.vel.x *= Math.pow(0.935, dt * 60);
    player.pos.addScaledVector(player.vel, dt);
    game.combo = Math.max(1, game.combo - dt * 0.22);
    if (player.pos.y < -3.2 || Math.abs(player.pos.x) > 14) die();
  }
  player.pos.x = clamp(player.pos.x, -12, 12);

  const sense = readUnlocks().sense;
  for (const b of bananas) {
    const radius = sense ? 2.35 : 1.55;
    if (!b.userData.collected && b.position.distanceTo(player.pos) < radius) {
      b.userData.collected = true; groups.pickups.remove(b); game.bananas++; game.combo = clamp(game.combo + 0.5, 1, 10); call('+1 banana'); navigator.vibrate && navigator.vibrate(7);
    }
  }
  for (const h of hazards) if (h.position.distanceTo(player.pos) < h.userData.radius + 0.55) die();
}

function updateCamera(dt) {
  player.bob += dt * (player.attached ? 8.5 : 10);
  const speed = player.vel.length();
  camera.fov = lerp(camera.fov, clamp(76 + (speed - 20) * 0.56, 76, 92), 1 - Math.pow(0.02, dt));
  camera.updateProjectionMatrix();
  player.roll = lerp(player.roll, clamp(-player.vel.x * 0.018 + input.steer * 0.08, -0.16, 0.16), 1 - Math.pow(0.02, dt));
  player.shake = Math.max(0, player.shake - dt * 0.8);
  const jitter = player.shake ? new THREE.Vector3(rand(-player.shake, player.shake), rand(-player.shake, player.shake), 0) : new THREE.Vector3();
  camera.position.copy(player.pos).add(jitter); camera.position.y += 0.66 + Math.sin(player.bob) * 0.035;
  camera.lookAt(player.pos.x + player.vel.x * 0.032 + input.steer * 1.15, player.pos.y + 0.35 + player.vel.y * 0.015, player.pos.z + 10.5);
  camera.rotateZ(player.roll);
  const grab = player.attached ? 1 : (input.hold && game.lock ? 0.42 : 0);
  const arms = groups.arms;
  arms.position.set(input.steer * 0.055, -0.025 + Math.sin(player.bob) * 0.006, -0.02);
  arms.rotation.x = lerp(arms.rotation.x, grab ? -0.2 : 0.08, 0.12);
  arms.userData.l.position.y = lerp(arms.userData.l.position.y, grab ? 0.13 : 0, 0.12);
  arms.userData.r.position.y = lerp(arms.userData.r.position.y, grab ? 0.13 : 0, 0.12);
  arms.userData.l.rotation.z = lerp(arms.userData.l.rotation.z, grab ? -0.28 : 0, 0.12);
  arms.userData.r.rotation.z = lerp(arms.userData.r.rotation.z, grab ? 0.28 : 0, 0.12);
}

function visuals(dt) {
  const shafts = groups.fx.userData.shafts;
  if (shafts) { shafts.position.z = player.pos.z; shafts.position.x = player.pos.x * 0.25; }
  for (const v of vines) {
    if (v === player.attached) {
      v.rotation.set(0, 0, 0);
      deformVineToPlayer(v);
      v.userData.ring.visible = true;
    } else {
      restoreVine(v);
      v.rotation.z = Math.sin(game.time * 1.5 + v.userData.sway) * 0.055;
      v.rotation.x = Math.sin(game.time * 1.1 + v.userData.sway) * 0.025;
    }
    v.userData.ring.rotation.z += dt * 1.8;
  }
  for (const b of bananas) { b.rotation.y += dt * 3.6; b.position.y += Math.sin(game.time * 4 + b.userData.spin) * 0.004; }
  for (const h of hazards) h.rotation.z += dt * 0.65;
  for (const w of groups.river.children) w.material.opacity = 0.48 + Math.sin(game.time * 1.2 + w.position.z) * 0.05;
  for (const bird of groups.birds.children) { bird.position.x += dt * bird.userData.speed * 1.7; bird.position.y += Math.sin(game.time * 6 + bird.userData.phase) * 0.006; bird.rotation.z = Math.sin(game.time * 9 + bird.userData.phase) * 0.35; if (bird.position.x > 55) bird.position.x = -55; if (bird.position.z < player.pos.z - 30) bird.position.z = player.pos.z + rand(180, 390); }
}

function updateUI(dt) {
  ui.dist.textContent = Math.max(0, Math.floor(player.pos.z));
  ui.ban.textContent = game.bananas;
  ui.comboNum.textContent = Math.floor(game.combo);
  ui.combo.classList.toggle('show', game.combo >= 2);
  ui.speedBar.style.width = `${clamp((player.vel.length() - 12) / 38 * 100, 0, 100)}%`;
  if (game.msgTimer > 0) { game.msgTimer -= dt; if (game.msgTimer <= 0) ui.callout.classList.remove('show'); }
}

function loop() {
  const dt = Math.min(clock.getDelta(), 0.033);
  game.time += dt;
  if (game.running) { physics(dt); ensureWorld(); updateCamera(dt); visuals(dt); updateUI(dt); }
  else { player.pos.z += dt * 5; player.pos.y = 8 + Math.sin(game.time * 0.7) * 0.8; ensureWorld(); updateCamera(dt); visuals(dt); }
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

function down(x) { input.active = true; input.hold = true; input.lastX = x; input.target = 0; }
function move(x) { if (!input.active) return; input.target = clamp((x - input.lastX) / Math.max(innerWidth, 1) * 7.4, -1, 1); }
function up() { input.active = false; input.hold = false; input.target = 0; }
window.addEventListener('pointerdown', e => { if (!ui.menu.contains(e.target) && !ui.dead.contains(e.target)) down(e.clientX); }, { passive: true });
window.addEventListener('pointermove', e => move(e.clientX), { passive: true });
window.addEventListener('pointerup', up, { passive: true });
window.addEventListener('touchstart', e => { if (!ui.menu.contains(e.target) && !ui.dead.contains(e.target)) { down(e.changedTouches[0].clientX); e.preventDefault(); } }, { passive: false });
window.addEventListener('touchmove', e => { move(e.changedTouches[0].clientX); e.preventDefault(); }, { passive: false });
window.addEventListener('touchend', e => { up(); e.preventDefault(); }, { passive: false });
window.addEventListener('keydown', e => { if (e.code === 'Space') input.hold = true; if (e.code === 'ArrowLeft' || e.code === 'KeyA') input.target = -1; if (e.code === 'ArrowRight' || e.code === 'KeyD') input.target = 1; });
window.addEventListener('keyup', e => { if (e.code === 'Space') input.hold = false; if (['ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD'].includes(e.code)) input.target = 0; });
ui.start.addEventListener('click', reset); ui.restart.addEventListener('click', reset);
ui.start.addEventListener('touchend', e => { e.preventDefault(); reset(); }, { passive: false });
ui.restart.addEventListener('touchend', e => { e.preventDefault(); reset(); }, { passive: false });
window.addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.7)); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });

for (let i = 0; i < 40; i++) { maxZ += 12; section(maxZ); }
loop();
