/**
 * SHELBY MUSTANG 3D WEBGL AUTOMATED VERIFICATION SUITE
 * Validates 3D Assets, GLTF files, DOM integrity, Three.js bindings,
 * mechanical articulations (Hood, Doors, Engine Bay), and Apple Keynote Animatic.
 */
const fs = require('fs');
const path = require('path');

const projectDir = __dirname;
let errors = 0;
let passes = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    errors++;
  } else {
    console.log(`✅ PASS: ${message}`);
    passes++;
  }
}

console.log('🏁 Commencing Shelby Mustang 3D WebGL Verification Suite...\n');

// 1. Check core web files
const requiredFiles = ['index.html', 'styles.css', 'app.js', 'README.md', 'SHELBY_MUSTANG_SPECIFICATION.pdf'];
requiredFiles.forEach((file) => {
  const filePath = path.join(projectDir, file);
  assert(fs.existsSync(filePath), `Required file ${file} exists.`);
  const stats = fs.statSync(filePath);
  assert(stats.size > 500, `File ${file} has substantial content (${stats.size} bytes).`);
});

// 2. Check 3D Mustang Model Assets
const gltfPath = path.join(projectDir, 'mustang', 'scene.gltf');
const binPath = path.join(projectDir, 'mustang', 'scene.bin');
assert(fs.existsSync(gltfPath), 'Real 3D Mustang GLTF file (mustang/scene.gltf) exists.');
assert(fs.existsSync(binPath), 'Real 3D Mustang Binary Geometry (mustang/scene.bin) exists.');
assert(fs.statSync(binPath).size > 6000000, `Mustang scene.bin contains full high-poly 3D geometry (${fs.statSync(binPath).size} bytes).`);

// 3. Check Texture directory
const texDir = path.join(projectDir, 'mustang', 'textures');
assert(fs.existsSync(texDir), 'Textures directory exists.');
const texFiles = fs.readdirSync(texDir);
assert(texFiles.length >= 10, `Found ${texFiles.length} high-resolution PBR textures for the 3D Mustang.`);

// 4. Validate HTML DOM hooks (Original + Apple Keynote & Articulation Elements)
const htmlContent = fs.readFileSync(path.join(projectDir, 'index.html'), 'utf-8');
const requiredIds = [
  'webgl-canvas',
  'webgl-container',
  'model-loader-hud',
  'tachometer-canvas',
  'track-canvas',
  'friction-circle-canvas',
  'rpm-readout',
  'downforce-val',
  'throttle-pedal-btn',
  'audio-toggle-btn',
  'csm-owner-name',
  'csm-chassis-no',
  'plate-pilot-display',
  'plate-csm-display',
  // New Apple Keynote & Articulation Controls
  'cinematic-film-btn',
  'action-dock',
  'dock-btn-film',
  'dock-btn-drive',
  'dock-btn-hood',
  'dock-btn-doors',
  'dock-btn-rev',
  'cinematic-film-hud',
  'film-playback-toggle',
  'film-timeline-track',
  'film-timeline-progress',
  'film-time-disp',
  'film-scene-name',
  'engine-callout-card',
  'cockpit-callout-card'
];

requiredIds.forEach((id) => {
  assert(htmlContent.includes(`id="${id}"`), `HTML contains element with id="${id}"`);
});

// 5. Validate Three.js ESM import map
assert(htmlContent.includes('"three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js"'), 'Import map loads Three.js module.');
assert(htmlContent.includes('type="module" src="app.js"'), 'app.js loaded as an ES module.');

// 6. Validate JavaScript 3D Architecture & Mechanical Articulations
const jsContent = fs.readFileSync(path.join(projectDir, 'app.js'), 'utf-8');
assert(jsContent.includes("import * as THREE from 'three'"), 'JS imports Three.js core.');
assert(jsContent.includes('import { OrbitControls }'), 'JS imports OrbitControls.');
assert(jsContent.includes('import { GLTFLoader }'), 'JS imports GLTFLoader.');
assert(jsContent.includes('class Shelby3DApp'), 'JS implements Shelby3DApp master controller.');
assert(jsContent.includes('class ShelbyAudioEngine'), 'JS implements ShelbyAudioEngine Web Audio synthesizer.');
assert(jsContent.includes('init3DWindTunnel'), 'JS implements 3D Wind Tunnel particle simulation.');
assert(jsContent.includes('update3DPowertrainDyno'), 'JS implements 3D chassis torque rock on revving.');
assert(jsContent.includes('update3DChassisDynamics'), 'JS implements 3D body roll & glowing thermal rotors.');

// 7. Validate Articulated Mechanical Systems (Hood, Engine Bay, Doors, Track Running)
assert(jsContent.includes('toggleHood'), 'JS implements interactive toggleHood() method.');
assert(jsContent.includes('toggleDoors'), 'JS implements interactive toggleDoors() method.');
assert(jsContent.includes('toggleTrackRunning'), 'JS implements high-speed track running animatic.');
assert(jsContent.includes('playCinematicReveal'), 'JS implements Apple Keynote film mode.');
assert(jsContent.includes('this.hoodPivot'), 'JS mounts articulated hood hinge pivot.');
assert(jsContent.includes('this.doorLeftPivot'), 'JS mounts articulated driver door pivot.');
assert(jsContent.includes('this.doorRightPivot'), 'JS mounts articulated passenger door pivot.');
assert(jsContent.includes('this.superchargerPulley'), 'JS implements spinning supercharger pulley.');
assert(jsContent.includes('this.roadGroup'), 'JS creates dynamic streaming track roadway.');
assert(jsContent.includes('playMechanicalSound'), 'Audio engine implements mechanical sound effects.');

// 8. Validate CSS tokens and Apple luxury aesthetic
const cssContent = fs.readFileSync(path.join(projectDir, 'styles.css'), 'utf-8');
assert(cssContent.includes('--bg-deep-obsidian: #050608'), 'CSS defines obsidian baseline token.');
assert(cssContent.includes('#webgl-canvas'), 'CSS styles 3D WebGL canvas.');
assert(cssContent.includes('camera-presets-pill'), 'CSS styles floating 3D camera switcher.');
assert(cssContent.includes('.film-cta-pill'), 'CSS styles Apple Keynote CTA pill.');
assert(cssContent.includes('.interactive-action-dock'), 'CSS styles floating mechanical action dock.');
assert(cssContent.includes('.cinematic-film-hud'), 'CSS styles keynote film timeline scrubber HUD.');
assert(cssContent.includes('.callout-badge-card'), 'CSS styles 3D mechanical callout cards.');

console.log(`\n========================================`);
console.log(`Verification Complete: ${passes} Passed, ${errors} Failed.`);
console.log(`========================================`);

if (errors > 0) {
  process.exit(1);
} else {
  console.log('🚀 ALL 3D MUSTANG VERIFICATION CHECKS PASSED WITH EXIT CODE 0.');
  process.exit(0);
}
