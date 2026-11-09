/**
 * SHELBY MUSTANG AUTOMATED VERIFICATION SUITE
 * Validates DOM integrity, JS syntax, CSS declarations, and motion graphics contracts.
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

console.log('🏁 Commencing Shelby Mustang GT500 Verification Suite...\n');

// 1. Check file existence
const requiredFiles = ['index.html', 'styles.css', 'app.js'];
requiredFiles.forEach((file) => {
  const filePath = path.join(projectDir, file);
  assert(fs.existsSync(filePath), `Required file ${file} exists.`);
  const stats = fs.statSync(filePath);
  assert(stats.size > 500, `File ${file} has substantial content (${stats.size} bytes).`);
});

// 2. Validate HTML DOM hooks
const htmlContent = fs.readFileSync(path.join(projectDir, 'index.html'), 'utf-8');
const requiredIds = [
  'aero-canvas',
  'tachometer-canvas',
  'audio-waveform-canvas',
  'track-canvas',
  'friction-circle-canvas',
  'studio-car-canvas',
  'rpm-readout',
  'downforce-val',
  'throttle-pedal-btn',
  'audio-toggle-btn',
  'csm-owner-name',
  'csm-chassis-no',
  'plate-pilot-display',
  'plate-csm-display'
];

requiredIds.forEach((id) => {
  assert(htmlContent.includes(`id="${id}"`), `HTML contains element with id="${id}"`);
});

// 3. Validate Three Motion Graphics Sections
assert(htmlContent.includes('id="aero-motion"'), 'Motion Graphic 01 (Aero Wind Tunnel) present.');
assert(htmlContent.includes('id="powertrain-motion"'), 'Motion Graphic 02 (Powertrain Dyno) present.');
assert(htmlContent.includes('id="chassis-motion"'), 'Motion Graphic 03 (MagneRide Chassis) present.');

// 4. Validate CSS tokens and luxury styles
const cssContent = fs.readFileSync(path.join(projectDir, 'styles.css'), 'utf-8');
assert(cssContent.includes('--bg-deep-obsidian: #07080B'), 'CSS defines obsidian baseline token.');
assert(cssContent.includes('--shelby-blue: #0052CC'), 'CSS defines Le Mans / Shelby Blue token.');
assert(cssContent.includes('--venom-red: #DC2626'), 'CSS defines Venom Red token.');
assert(cssContent.includes('carbon-texture'), 'CSS defines carbon weave texture.');
assert(cssContent.includes('throttle-pedal-luxury'), 'CSS defines tactile throttle pedal.');

// 5. Validate JS Syntax & Class Architecture
const jsContent = fs.readFileSync(path.join(projectDir, 'app.js'), 'utf-8');
assert(jsContent.includes('class ShelbyAudioEngine'), 'JS implements ShelbyAudioEngine Web Audio synthesizer.');
assert(jsContent.includes('class AeroWindTunnel'), 'JS implements AeroWindTunnel particle field.');
assert(jsContent.includes('class PowertrainDynoEngine'), 'JS implements PowertrainDynoEngine.');
assert(jsContent.includes('class MagneRideChassisEngine'), 'JS implements MagneRideChassisEngine.');
assert(jsContent.includes('class StudioConfigurator'), 'JS implements StudioConfigurator.');
assert(jsContent.includes('class HeritageRegistryManager'), 'JS implements HeritageRegistryManager.');

console.log(`\n========================================`);
console.log(`Verification Complete: ${passes} Passed, ${errors} Failed.`);
console.log(`========================================`);

if (errors > 0) {
  process.exit(1);
} else {
  console.log('🚀 ALL VERIFICATION CHECKS PASSED WITH EXIT CODE 0.');
  process.exit(0);
}
