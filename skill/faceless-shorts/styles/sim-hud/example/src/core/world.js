// Sim HUD worlds: big-scale "simulation" sets. 1 unit = 10 m. Each returns { scene, ...handles, update(t) }.
// Look: clean CG realism (glass, city lights, dusk sky, haze), seen like a simulation camera, under a 2D HUD (hud.js).
import * as THREE from 'three';

const std = (color, rough = 0.7, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, ...extra });
export function canvasTex(w, h, draw, rep = [1, 1]) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 8; return t; }
const rand = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/** a sim camera that can see far (city scale) */
export function simCamera(fov = 32) { return new THREE.PerspectiveCamera(fov, 1080 / 1920, 0.5, 4000); }

/** dusk sky dome: deep blue top → orange/pink horizon (a gradient on a big inverted sphere) */
export function skyDome(top = '#0B1B3A', mid = '#3A4A7A', horizon = '#F49A62') {
  const tex = canvasTex(8, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, top); gr.addColorStop(0.42, mid); gr.addColorStop(0.5, horizon); gr.addColorStop(1, '#2A2230'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  const m = new THREE.Mesh(new THREE.SphereGeometry(1800, 32, 16), new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false }));
  return m;
}

/**
 * CITY AT DUSK with a supertall tower in the middle.
 *   const W = city(E)  → { scene, tower: { h, levels(m) → y }, cab (glowing elevator light), ring(m, color) → a glowing
 *   height ring around the tower at m metres, setCab(m), update(t) }
 */
export function city(E, { towerH = 82.8, seed = 3 } = {}) {
  const scene = new THREE.Scene(); scene.environment = E.envMap; scene.environmentIntensity = 0.55;
  scene.background = new THREE.Color('#1A2240'); scene.fog = new THREE.FogExp2('#3B3F63', 0.0042);
  scene.add(skyDome());
  // ground: dark asphalt with a faint street grid
  const grid = canvasTex(1024, 1024, (g, w, h) => { g.fillStyle = '#15171F'; g.fillRect(0, 0, w, h); g.strokeStyle = '#2A2F3F'; g.lineWidth = 6; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * w / 8, 0); g.lineTo(i * w / 8, h); g.stroke(); g.beginPath(); g.moveTo(0, i * h / 8); g.lineTo(w, i * h / 8); g.stroke(); } }, [40, 40]);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), std('#ffffff', 0.95, { map: grid })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  // city blocks: instanced boxes with lit windows
  const win = canvasTex(256, 512, (g, w, h) => { g.fillStyle = '#20232E'; g.fillRect(0, 0, w, h); for (let y = 6; y < h; y += 22) for (let x = 6; x < w; x += 20) { const r = Math.random(); g.fillStyle = r > 0.62 ? (r > 0.9 ? '#FFE3A8' : '#F6C77A') : '#2B2F3D'; g.fillRect(x, y, 12, 14); } });
  const bmat = std('#ffffff', 0.6, { map: win, emissiveMap: win, emissive: new THREE.Color('#FFD9A0'), emissiveIntensity: 0.85, metalness: 0.2 });
  const N = 520, inst = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), bmat, N), m4 = new THREE.Matrix4(); let k = 0;
  for (let i = 0; i < 4000 && k < N; i++) {
    const a = rand(i + seed) * Math.PI * 2, r = 15 + Math.pow(rand(i * 3 + seed), 0.7) * 220, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (Math.abs(x % 12) < 2.2 || Math.abs(z % 12) < 2.2) continue;                     // keep the streets clear
    const near = Math.max(0, 1 - r / 160), h = 1.5 + rand(i * 7) * (3 + near * 9) + (rand(i * 11) > 0.93 ? 6 + near * 10 : 0), w = 2.2 + rand(i * 5) * 3.5, d = 2.2 + rand(i * 9) * 3.5;
    m4.compose(new THREE.Vector3(x, h / 2, z), new THREE.Quaternion(), new THREE.Vector3(w, h, d)); inst.setMatrixAt(k++, m4);
  }
  inst.count = k; inst.castShadow = true; inst.receiveShadow = true; scene.add(inst);
  // the tower: stepped glass segments, a spire, lit edges
  const glass = new THREE.MeshPhysicalMaterial({ color: '#9CB4CC', metalness: 0.65, roughness: 0.12, envMapIntensity: 1.4, clearcoat: 0.6 });
  const steel = std('#C9D3DE', 0.35, { metalness: 0.8 });
  const tower = new THREE.Group(); scene.add(tower);
  const segs = [[0, 18, 3.4], [18, 34, 2.9], [34, 48, 2.4], [48, 58, 1.9], [58, 66, 1.4], [66, 72, 1.0]];
  for (const [y0, y1, r] of segs) { const c = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.94, r, y1 - y0, 6, 1), glass); c.position.y = (y0 + y1) / 2; c.castShadow = true; tower.add(c);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.96, r * 0.96, 0.25, 6, 1, true), new THREE.MeshBasicMaterial({ color: '#BFE6FF' })); band.position.y = y1; tower.add(band); }
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.6, towerH - 72, 12), steel); spire.position.y = 72 + (towerH - 72) / 2; tower.add(spire);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8), new THREE.MeshBasicMaterial({ color: '#FF5A5A' })); tip.position.y = towerH; tower.add(tip);
  // the elevator: a glowing cabin light riding up the tower's side (a sim marker, not a real external lift)
  const cab = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.7), new THREE.MeshBasicMaterial({ color: new THREE.Color('#5EEAD4').multiplyScalar(2.2) }));
  cab.position.set(0, 0.5, 3.45); scene.add(cab);
  const trail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1, 0.12), new THREE.MeshBasicMaterial({ color: '#5EEAD4', transparent: true, opacity: 0.55 })); trail.position.set(0, 0, 3.45); scene.add(trail);
  const radiusAt = (y) => { for (const [y0, y1, r] of segs) if (y <= y1) return r; return 0.6; };
  function setCab(m) { const y = m / 10; cab.position.set(0, y + 0.45, radiusAt(y) + 0.1); trail.scale.y = Math.max(0.01, y); trail.position.set(0, y / 2, radiusAt(Math.min(y, 1)) + 0.05); }
  /** a glowing ring around the tower at m metres (height markers: "EIFFEL TOWER 330 M") */
  function ring(m, color = '#FFC24B') { const y = m / 10, r = radiusAt(y) + 0.9; const g = new THREE.Mesh(new THREE.TorusGeometry(r, 0.09, 8, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(1.8) })); g.rotation.x = Math.PI / 2; g.position.y = y; scene.add(g); return g; }
  // light: low warm sun + cool sky
  const sun = new THREE.DirectionalLight('#FFB37A', 2.4); sun.position.set(-120, 40, -60); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 90, bottom: -10, near: 1, far: 400 }); sun.shadow.camera.updateProjectionMatrix(); scene.add(sun);
  scene.add(new THREE.HemisphereLight('#7E94D6', '#2A2030', 0.9));
  return { scene, tower: { h: towerH, group: tower, radiusAt }, cab, setCab, ring, update() {} };
}
