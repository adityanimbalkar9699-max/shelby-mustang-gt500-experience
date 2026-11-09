/**
 * SHELBY MUSTANG GT500 - MASTER 3D WEBGL ENGINE
 * Powered by Three.js & Web Audio API
 * Features Real 3D Shelby Mustang Model & 3 Visual Motion Graphics in 3D Space:
 * 1. 3D Supersonic Wind Tunnel Particle Field
 * 2. 3D Powertrain Dyno with Physical Chassis Torque Rock
 * 3. 3D MagneRide 1,000Hz Suspension with Real-time Body Roll & Thermal Rotors
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ============================================================================
// AUDIO SYNTHESIZER: PROCEDURAL V8 & SUPERCHARGER SOUND ENGINE (Web Audio API)
// ============================================================================
class ShelbyAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = true;
    this.currentRPM = 850;
    this.targetRPM = 850;
    this.isRevving = false;
    
    // Nodes
    this.masterGain = null;
    this.v8Osc1 = null;
    this.v8Osc2 = null;
    this.v8Gain = null;
    this.blowerOsc = null;
    this.blowerGain = null;
    this.exhaustFilter = null;
    this.analyser = null;
    this.dataArray = null;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      // --- V8 Sub-Bass & Exhaust Fundamental ---
      this.v8Osc1 = this.ctx.createOscillator();
      this.v8Osc1.type = 'sawtooth';
      this.v8Osc1.frequency.setValueAtTime(38, this.ctx.currentTime); // 850 RPM fundamental

      this.v8Osc2 = this.ctx.createOscillator();
      this.v8Osc2.type = 'triangle';
      this.v8Osc2.frequency.setValueAtTime(76, this.ctx.currentTime); // 2nd harmonic

      this.exhaustFilter = this.ctx.createBiquadFilter();
      this.exhaustFilter.type = 'lowpass';
      this.exhaustFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
      this.exhaustFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);

      this.v8Gain = this.ctx.createGain();
      this.v8Gain.gain.setValueAtTime(0.35, this.ctx.currentTime);

      this.v8Osc1.connect(this.exhaustFilter);
      this.v8Osc2.connect(this.exhaustFilter);
      this.exhaustFilter.connect(this.v8Gain);
      this.v8Gain.connect(this.masterGain);

      // --- Eaton Supercharger High-Pitched Roots Whine ---
      this.blowerOsc = this.ctx.createOscillator();
      this.blowerOsc.type = 'sine';
      this.blowerOsc.frequency.setValueAtTime(1400, this.ctx.currentTime);

      this.blowerGain = this.ctx.createGain();
      this.blowerGain.gain.setValueAtTime(0.01, this.ctx.currentTime);

      this.blowerOsc.connect(this.blowerGain);
      this.blowerGain.connect(this.masterGain);

      // Output chain
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      this.v8Osc1.start();
      this.v8Osc2.start();
      this.blowerOsc.start();

      const statusEl = document.getElementById('audio-engine-status');
      if (statusEl) statusEl.textContent = 'WEB AUDIO: 760HP SYNTHESIZED';
    } catch (e) {
      console.warn('AudioContext waiting for user gesture:', e);
    }
  }

  toggleMute() {
    this.init();
    if (!this.ctx) return false;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isMuted = !this.isMuted;
    const now = this.ctx.currentTime;
    if (this.isMuted) {
      this.masterGain.gain.setTargetAtTime(0, now, 0.05);
    } else {
      this.masterGain.gain.setTargetAtTime(0.28, now, 0.05);
    }
    return !this.isMuted;
  }

  updateEngineRPM(rpm, loadFactor = 0.5) {
    this.currentRPM = rpm;
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    // 5.2L V8 firing frequency = (RPM / 60) * 4
    const v8Freq = Math.max(30, (rpm / 60) * 4);
    this.v8Osc1.frequency.setTargetAtTime(v8Freq, now, 0.03);
    this.v8Osc2.frequency.setTargetAtTime(v8Freq * 1.5, now, 0.03);

    const filterFreq = 320 + (rpm / 8250) * 3200 + loadFactor * 1200;
    this.exhaustFilter.frequency.setTargetAtTime(filterFreq, now, 0.03);

    // Supercharger pulley whine scales with RPM
    const blowerFreq = 1000 + (rpm / 8250) * 4200;
    this.blowerOsc.frequency.setTargetAtTime(blowerFreq, now, 0.03);
    
    const blowerVol = 0.01 + loadFactor * 0.12 * (rpm / 8250);
    this.blowerGain.gain.setTargetAtTime(blowerVol, now, 0.03);
  }
}

const audioEngine = new ShelbyAudioEngine();

// ============================================================================
// MASTER 3D THREE.JS WEBGL CAR ENGINE & SCENE
// ============================================================================
class Shelby3DApp {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    this.container = document.getElementById('webgl-container');
    if (!this.canvas || !this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.carRoot = null;
    this.carMeshes = {
      body: [],
      wheels: [],
      calipers: [],
      glass: [],
      spoiler: []
    };

    // Active Modes & Telemetry
    this.activeMode = 'hero'; // 'hero', 'aero', 'powertrain', 'chassis', 'configurator'
    this.currentPaintColor = 0x0A0D14; // Default Shadow Obsidian
    this.currentRPM = 850;
    this.targetRPM = 850;
    this.isFullThrottle = false;
    this.needleVelocity = 0;
    this.chassisRoll = 0;
    this.chassisPitch = 0;
    this.trackProgress = 0;
    this.activeTrack = 'laguna';

    // 3D Motion Graphic 1: Particle Streamlines
    this.windSpeed = 130;
    this.particleMode = 'stream';
    this.wingAngle = 8.5;
    this.streamlines = null;
    this.num3DParticles = 1800;

    // Camera Targets
    this.targetCamPos = new THREE.Vector3(5.5, 2.2, 5.5);
    this.targetLookAt = new THREE.Vector3(0, 0.6, 0);

    this.initScene();
    this.initLighting();
    this.initStudioFloor();
    this.init3DWindTunnel();
    this.loadMustangModel();
    this.initModeNavigation();
    this.initDynoGauges();
    this.initChassisCircuits();
    this.initStudioConfigurator();
    this.initPlaqueAndShortcuts();

    this.animate();
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050608);
    this.scene.fog = new THREE.FogExp2(0x050608, 0.035);

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.set(5.5, 2.2, 5.5);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02; // Prevent camera from dropping below floor
    this.controls.minDistance = 2.5;
    this.controls.maxDistance = 18;
    this.controls.target.set(0, 0.6, 0);

    window.addEventListener('resize', () => this.onResize());
  }

  onResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  initLighting() {
    // 1. Soft Ambient Sky/Ground Light
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x0a0c12, 0.85);
    this.scene.add(hemiLight);

    // 2. Key Directional Studio Light
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    keyLight.position.set(6, 10, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 30;
    keyLight.shadow.bias = -0.0005;
    this.scene.add(keyLight);

    // 3. Cool Blue Rim / Silhouette Kicker Light
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 3.2);
    rimLight.position.set(-8, 6, -7);
    this.scene.add(rimLight);

    // 4. Undercarriage Ground Accent Light (Shelby Cobalt Glow)
    this.underGlow = new THREE.PointLight(0x0052cc, 2.5, 7);
    this.underGlow.position.set(0, 0.15, 0);
    this.scene.add(this.underGlow);
  }

  initStudioFloor() {
    // Studio Turntable Platform
    const floorGeo = new THREE.CylinderGeometry(8, 8.2, 0.2, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0a0d14,
      roughness: 0.25,
      metalness: 0.8
    });
    const platform = new THREE.Mesh(floorGeo, floorMat);
    platform.position.y = -0.1;
    platform.receiveShadow = true;
    this.scene.add(platform);

    // Subtle Radial Concentric Marker Ring
    const ringGeo = new THREE.RingGeometry(7.6, 7.7, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x1e293b, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    this.scene.add(ring);
  }

  // ==========================================================================
  // REAL 3D SHELBY MUSTANG MODEL LOADING & FALLBACK
  // ==========================================================================
  loadMustangModel() {
    this.carRoot = new THREE.Group();
    this.scene.add(this.carRoot);

    const loaderHud = document.getElementById('model-loader-hud');
    const loaderText = document.getElementById('loader-progress-text');

    const loader = new GLTFLoader();
    const modelUrl = 'mustang/scene.gltf';

    loader.load(
      modelUrl,
      (gltf) => {
        const car = gltf.scene;

        // Traverse and upgrade to Apple-grade physical materials
        car.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            const name = child.name.toLowerCase();
            const matName = child.material ? child.material.name.toLowerCase() : '';

            // Body paint detection
            if (name.includes('body') || matName.includes('body') || name.includes('carrosserie')) {
              child.material = new THREE.MeshPhysicalMaterial({
                color: this.currentPaintColor,
                metalness: 0.88,
                roughness: 0.15,
                clearcoat: 1.0,
                clearcoatRoughness: 0.08
              });
              this.carMeshes.body.push(child);
            }
            // Calipers (Brembo Red)
            else if (name.includes('caliper') || name.includes('etrier')) {
              child.material = new THREE.MeshStandardMaterial({
                color: 0xDC2626,
                roughness: 0.2,
                metalness: 0.7
              });
              this.carMeshes.calipers.push(child);
            }
            // Wheels / Rims
            else if (name.includes('wheel') || name.includes('jante') || name.includes('rim')) {
              child.material = new THREE.MeshStandardMaterial({
                color: 0x0f172a,
                roughness: 0.18,
                metalness: 0.95
              });
              this.carMeshes.wheels.push(child);
            }
            // Glass / Windshield
            else if (name.includes('glass') || name.includes('vitre') || name.includes('windshield')) {
              child.material = new THREE.MeshPhysicalMaterial({
                color: 0x0a101d,
                transmission: 0.85,
                roughness: 0.05,
                transparent: true,
                opacity: 0.8
              });
              this.carMeshes.glass.push(child);
            }
            // Carbon Fiber Spoiler / Diffuser
            else if (name.includes('spoiler') || name.includes('wing') || name.includes('carbon')) {
              this.carMeshes.spoiler.push(child);
            }
          }
        });

        // Compute Bounding Box to center and scale perfectly
        const bbox = new THREE.Box3().setFromObject(car);
        const center = bbox.getCenter(new THREE.Vector3());
        const size = bbox.getSize(new THREE.Vector3());
        
        // Scale to realistic ~4.8 meters length
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetScale = 4.8 / maxDim;
        car.scale.set(targetScale, targetScale, targetScale);
        
        // Center on floor
        car.position.sub(center.multiplyScalar(targetScale));
        car.position.y = 0; // Sit on turntable
        
        this.carRoot.add(car);

        if (loaderHud) loaderHud.classList.add('fade-out');
        console.log('🏁 Real 3D Shelby Mustang GT500 Mesh Loaded & Normalized.');
      },
      (xhr) => {
        if (loaderText && xhr.total > 0) {
          const pct = Math.round((xhr.loaded / xhr.total) * 100);
          loaderText.textContent = `LOADING MUSTANG MESH: ${pct}%`;
        }
      },
      (err) => {
        console.warn('GLTF direct load notice (using procedural 3D fallback):', err);
        this.buildProceduralMustang();
        if (loaderHud) loaderHud.classList.add('fade-out');
      }
    );
  }

  // Fallback high-fidelity procedural 3D Mustang geometry (guarantees 100% 3D uptime)
  buildProceduralMustang() {
    if (this.carRoot.children.length > 0) return;

    const carGroup = new THREE.Group();

    // Body Paint Material
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: this.currentPaintColor,
      metalness: 0.9,
      roughness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08
    });

    // 1. Lower Chassis & Aggressive Splitter
    const chassisGeo = new THREE.BoxGeometry(2.1, 0.45, 4.8);
    const chassis = new THREE.Mesh(chassisGeo, bodyMat);
    chassis.position.y = 0.45;
    chassis.castShadow = true;
    carGroup.add(chassis);
    this.carMeshes.body.push(chassis);

    // 2. Cabin & Fastback Roofline
    const cabinGeo = new THREE.BoxGeometry(1.6, 0.55, 2.4);
    const cabinMat = new THREE.MeshPhysicalMaterial({
      color: 0x05070c,
      transmission: 0.8,
      transparent: true,
      opacity: 0.85,
      roughness: 0.05
    });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 0.95, -0.2);
    cabin.castShadow = true;
    carGroup.add(cabin);

    // 3. Bulging Muscular Hood
    const hoodGeo = new THREE.BoxGeometry(1.7, 0.2, 1.6);
    const hood = new THREE.Mesh(hoodGeo, bodyMat);
    hood.position.set(0, 0.72, 1.4);
    hood.castShadow = true;
    carGroup.add(hood);
    this.carMeshes.body.push(hood);

    // 4. GT4 High-Downforce Carbon Rear Wing
    const wingGeo = new THREE.BoxGeometry(1.9, 0.08, 0.35);
    const carbonMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3, metalness: 0.6 });
    const wing = new THREE.Mesh(wingGeo, carbonMat);
    wing.position.set(0, 1.15, -2.2);
    wing.castShadow = true;
    carGroup.add(wing);

    // Wing Struts
    const strutGeo = new THREE.BoxGeometry(0.06, 0.3, 0.15);
    const strutL = new THREE.Mesh(strutGeo, carbonMat);
    strutL.position.set(-0.55, 0.95, -2.15);
    const strutR = new THREE.Mesh(strutGeo, carbonMat);
    strutR.position.set(0.55, 0.95, -2.15);
    carGroup.add(strutL);
    carGroup.add(strutR);

    // 5. 4 Performance Wheels & Red Brembo Calipers
    const wheelPositions = [
      [-1.02, 0.4, 1.5],   // FL
      [1.02, 0.4, 1.5],    // FR
      [-1.02, 0.4, -1.4],  // RL
      [1.02, 0.4, -1.4]    // RR
    ];

    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 32);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.95 });

    const caliperGeo = new THREE.BoxGeometry(0.12, 0.22, 0.14);
    const caliperMat = new THREE.MeshStandardMaterial({ color: 0xDC2626, roughness: 0.3, metalness: 0.5 });

    wheelPositions.forEach((pos) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.position.set(...pos);
      w.castShadow = true;
      carGroup.add(w);
      this.carMeshes.wheels.push(w);

      const c = new THREE.Mesh(caliperGeo, caliperMat);
      c.position.set(pos[0] * 0.9, pos[1] + 0.08, pos[2]);
      carGroup.add(c);
      this.carMeshes.calipers.push(c);
    });

    this.carRoot.add(carGroup);
  }

  // ==========================================================================
  // 3D MOTION GRAPHIC 1: SUPERSONIC 3D WIND TUNNEL PARTICLE FIELD
  // ==========================================================================
  init3DWindTunnel() {
    const particleCount = this.num3DParticles;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Emitted in an upstream bounding volume: Z from 6 to -6, X from -3 to 3, Y from 0 to 3
      positions[i * 3 + 0] = (Math.random() - 0.5) * 6; // X
      positions[i * 3 + 1] = Math.random() * 2.8 + 0.1;  // Y
      positions[i * 3 + 2] = 8 + Math.random() * 6;     // Z (Starts in front)

      speeds[i] = 1.0 + Math.random() * 0.8;

      // Initial Cyan color
      colors[i * 3 + 0] = 0.22;
      colors[i * 3 + 1] = 0.74;
      colors[i * 3 + 2] = 0.97;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.particleSpeeds = speeds;

    const material = new THREE.PointsMaterial({
      size: 0.085,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    this.streamlines = new THREE.Points(geometry, material);
    this.scene.add(this.streamlines);
  }

  update3DWindTunnel(delta) {
    if (!this.streamlines) return;

    const pos = this.streamlines.geometry.attributes.position.array;
    const col = this.streamlines.geometry.attributes.color.array;
    const speedMult = (this.windSpeed / 130) * 14 * delta;

    for (let i = 0; i < this.num3DParticles; i++) {
      const idx = i * 3;
      pos[idx + 2] -= this.particleSpeeds[i] * speedMult; // Flow along Z (Front to Back)

      const px = pos[idx + 0];
      const py = pos[idx + 1];
      const pz = pos[idx + 2];

      // Deflection around 3D Mustang bounding region
      if (Math.abs(px) < 1.3 && pz > -2.8 && pz < 2.5) {
        // Upwash over hood and roof
        if (pz > 0 && py < 1.4) {
          pos[idx + 1] += 0.035 * (this.windSpeed / 130);
        }
        // Downforce deflection off rear wing
        else if (pz < -1.8 && py < 1.6) {
          pos[idx + 1] -= (this.wingAngle / 8.5) * 0.04;
        }
      }

      // Shader Mode Colorization in 3D
      if (this.particleMode === 'pressure') {
        // Red stagnation at front bumper, cobalt/cyan over roof
        if (pz > 1.8 && py < 0.9) {
          col[idx + 0] = 0.95; col[idx + 1] = 0.15; col[idx + 2] = 0.15; // Red Stagnation
        } else if (py > 1.2) {
          col[idx + 0] = 0.05; col[idx + 1] = 0.55; col[idx + 2] = 0.95; // Low pressure suction
        } else {
          col[idx + 0] = 0.95; col[idx + 1] = 0.65; col[idx + 2] = 0.1;
        }
      } else if (this.particleMode === 'vortex') {
        if (pz < -2.2) {
          col[idx + 0] = 1.0; col[idx + 1] = 0.25; col[idx + 2] = 0.45; // Vortex Wake
          pos[idx + 0] += Math.sin(pz * 4) * 0.03; // Turbulence twist
        } else {
          col[idx + 0] = 0.35; col[idx + 1] = 0.45; col[idx + 2] = 0.55;
        }
      } else {
        // Laminar Cyan
        col[idx + 0] = 0.22; col[idx + 1] = 0.74; col[idx + 2] = 0.97;
      }

      // Reset when flowing past the rear
      if (pos[idx + 2] < -8) {
        pos[idx + 0] = (Math.random() - 0.5) * 6;
        pos[idx + 1] = Math.random() * 2.8 + 0.1;
        pos[idx + 2] = 8 + Math.random() * 2;
      }
    }

    this.streamlines.geometry.attributes.position.needsUpdate = true;
    this.streamlines.geometry.attributes.color.needsUpdate = true;

    // Aerodynamic Telemetry HUD Formula
    const baseDownforce = 120;
    const speedRatio = this.windSpeed / 130;
    const wingFactor = 1 + (this.wingAngle - 8.5) * 0.08;
    const calculatedLbs = Math.round(baseDownforce * (speedRatio * speedRatio) * 3.4 * wingFactor);
    const calculatedCd = (0.35 + (this.wingAngle / 15) * 0.06).toFixed(2);

    const dfEl = document.getElementById('downforce-val');
    const cdEl = document.getElementById('drag-coeff-val');
    const spEl = document.getElementById('flow-speed-val');
    const waDisp = document.getElementById('wing-angle-disp');

    if (dfEl) dfEl.innerHTML = `${calculatedLbs} <small>LBS</small>`;
    if (cdEl) cdEl.innerHTML = `${calculatedCd} <small>Cd</small>`;
    if (spEl) spEl.innerHTML = `${this.windSpeed} <small>MPH</small>`;
    if (waDisp) waDisp.textContent = `${this.wingAngle.toFixed(1)}°`;
  }

  // ==========================================================================
  // NAVIGATION & 3D CAMERA MODES
  // ==========================================================================
  initModeNavigation() {
    const navButtons = document.querySelectorAll('.nav-mode-btn');
    const exploreAero = document.getElementById('explore-aero-trigger');
    const reserveBtn = document.getElementById('nav-reserve-btn');

    const switchMode = (mode) => {
      this.activeMode = mode;
      navButtons.forEach((b) => {
        b.classList.toggle('active', b.getAttribute('data-mode') === mode);
      });

      document.querySelectorAll('.mode-panel').forEach((panel) => {
        panel.classList.toggle('active', panel.id === `panel-${mode}`);
      });

      // Smooth camera interpolation based on mode
      if (mode === 'hero') {
        this.setCameraTarget(5.5, 2.2, 5.5, 0, 0.6, 0);
      } else if (mode === 'aero') {
        this.setCameraTarget(5.8, 1.8, 0.2, 0, 0.6, 0); // Side profile to view wind tunnel
      } else if (mode === 'powertrain') {
        this.setCameraTarget(2.8, 1.6, 3.8, 0, 0.7, 1.2); // Close up on front hood
      } else if (mode === 'chassis') {
        this.setCameraTarget(4.8, 2.8, -4.5, 0, 0.5, 0); // Dynamic cornering tracking view
      } else if (mode === 'configurator') {
        this.setCameraTarget(4.5, 2.0, 4.5, 0, 0.6, 0); // Studio 360 view
      }
    };

    navButtons.forEach((btn) => {
      btn.addEventListener('click', () => switchMode(btn.getAttribute('data-mode')));
    });

    if (exploreAero) exploreAero.addEventListener('click', () => switchMode('aero'));
    if (reserveBtn) reserveBtn.addEventListener('click', () => switchMode('configurator'));

    // Camera preset pill buttons
    const camBtns = document.querySelectorAll('.cam-btn');
    camBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        camBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const cam = btn.getAttribute('data-cam');
        if (cam === 'orbit') this.setCameraTarget(5.5, 2.2, 5.5, 0, 0.6, 0);
        else if (cam === 'front-apex') this.setCameraTarget(3.5, 1.4, 4.2, 0, 0.5, 0.5);
        else if (cam === 'side-aero') this.setCameraTarget(6.2, 1.4, 0, 0, 0.6, 0);
        else if (cam === 'rear-wing') this.setCameraTarget(-2.2, 1.8, -4.5, 0, 0.9, -1.8);
        else if (cam === 'top-down') this.setCameraTarget(0.1, 7.5, 0.1, 0, 0, 0);
      });
    });

    // Aero Wind Tunnel HUD Controls
    const speedBtns = document.querySelectorAll('[data-speed]');
    speedBtns.forEach((b) => {
      b.addEventListener('click', () => {
        speedBtns.forEach((btn) => btn.classList.remove('active'));
        b.classList.add('active');
        this.windSpeed = parseInt(b.getAttribute('data-speed'), 10);
      });
    });

    const btnStream = document.getElementById('btn-mode-stream');
    const btnPressure = document.getElementById('btn-mode-pressure');
    const btnVortex = document.getElementById('btn-mode-vortex');
    const pBtns = [btnStream, btnPressure, btnVortex];

    if (btnStream) btnStream.addEventListener('click', () => {
      pBtns.forEach((b) => b && b.classList.remove('active'));
      btnStream.classList.add('active');
      this.particleMode = 'stream';
    });
    if (btnPressure) btnPressure.addEventListener('click', () => {
      pBtns.forEach((b) => b && b.classList.remove('active'));
      btnPressure.classList.add('active');
      this.particleMode = 'pressure';
    });
    if (btnVortex) btnVortex.addEventListener('click', () => {
      pBtns.forEach((b) => b && b.classList.remove('active'));
      btnVortex.classList.add('active');
      this.particleMode = 'vortex';
    });

    const wingSlider = document.getElementById('wing-angle-slider');
    if (wingSlider) {
      wingSlider.addEventListener('input', (e) => {
        this.wingAngle = parseFloat(e.target.value);
      });
    }
  }

  setCameraTarget(x, y, z, tx, ty, tz) {
    this.targetCamPos.set(x, y, z);
    this.targetLookAt.set(tx, ty, tz);
  }

  // ==========================================================================
  // 3D MOTION GRAPHIC 2: PREDATOR V8 DYNO & PHYSICAL CHASSIS TORQUE
  // ==========================================================================
  initDynoGauges() {
    const throttleBtn = document.getElementById('throttle-pedal-btn');
    const quickRevBtn = document.getElementById('quick-rev-btn');
    const manualSlider = document.getElementById('manual-rpm-slider');

    const startRev = () => {
      this.isFullThrottle = true;
      this.targetRPM = 8250;
      if (throttleBtn) throttleBtn.classList.add('depressed');
      audioEngine.updateEngineRPM(this.targetRPM, 1.0);
    };

    const stopRev = () => {
      this.isFullThrottle = false;
      this.targetRPM = manualSlider ? parseFloat(manualSlider.value) : 850;
      if (throttleBtn) throttleBtn.classList.remove('depressed');
      audioEngine.updateEngineRPM(this.targetRPM, 0.1);
    };

    if (throttleBtn) {
      throttleBtn.addEventListener('mousedown', startRev);
      throttleBtn.addEventListener('mouseup', stopRev);
      throttleBtn.addEventListener('mouseleave', stopRev);
      throttleBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startRev(); });
      throttleBtn.addEventListener('touchend', (e) => { e.preventDefault(); stopRev(); });
    }

    if (quickRevBtn) {
      quickRevBtn.addEventListener('click', () => {
        startRev();
        setTimeout(stopRev, 1500);
      });
    }

    if (manualSlider) {
      manualSlider.addEventListener('input', (e) => {
        if (!this.isFullThrottle) {
          this.targetRPM = parseFloat(e.target.value);
          audioEngine.updateEngineRPM(this.targetRPM, (this.targetRPM - 850) / 7400);
        }
      });
    }

    this.tachCanvas = document.getElementById('tachometer-canvas');
    this.tachCtx = this.tachCanvas ? this.tachCanvas.getContext('2d') : null;
  }

  update3DPowertrainDyno() {
    // Spring physics integration for RPM
    const springK = 0.18;
    const damping = 0.78;
    const force = (this.targetRPM - this.currentRPM) * springK;
    this.needleVelocity = (this.needleVelocity + force) * damping;
    this.currentRPM += this.needleVelocity;

    if (this.currentRPM < 850) this.currentRPM = 850;
    if (this.currentRPM > 8250) this.currentRPM = 8250;

    // REAL 3D CHASSIS TORQUE REACTION:
    // Engine torque twists the 3D car body along the Z-axis (roll) and pitches slightly!
    if (this.carRoot) {
      const rpmFrac = (this.currentRPM - 850) / 7400;
      const torqueShake = (Math.random() - 0.5) * 0.008 * (1 + rpmFrac * 2);
      const torqueTwist = -rpmFrac * 0.045; // 3D roll under load

      // Apply physical rotation to the 3D car body
      this.carRoot.rotation.z = THREE.MathUtils.lerp(this.carRoot.rotation.z, torqueTwist + torqueShake, 0.2);
      this.carRoot.position.y = Math.sin(Date.now() * 0.03) * (0.002 + rpmFrac * 0.006);
    }

    // Telemetry Calculations
    const rpmFrac = (this.currentRPM - 850) / (8250 - 850);
    const calcHP = Math.round(98 + Math.pow(rpmFrac, 1.25) * 662);
    const calcTorque = Math.round(220 + Math.sin(rpmFrac * Math.PI * 0.85) * 405);
    const calcBoost = ((rpmFrac * 12.2) * (this.isFullThrottle ? 1.0 : 0.4)).toFixed(1);

    const rpmReadout = document.getElementById('rpm-readout');
    const gearDisp = document.getElementById('gear-indicator');
    const hpDisp = document.getElementById('dyno-hp-disp');
    const tqDisp = document.getElementById('dyno-torque-disp');
    const bDisp = document.getElementById('boost-psi-disp');
    const bFill = document.getElementById('boost-meter-fill');
    const hpFill = document.getElementById('hp-meter-fill');
    const tqFill = document.getElementById('torque-meter-fill');

    if (rpmReadout) rpmReadout.textContent = Math.round(this.currentRPM);
    if (hpDisp) hpDisp.innerHTML = `${calcHP} <small>BHP</small>`;
    if (tqDisp) tqDisp.innerHTML = `${calcTorque} <small>LB-FT</small>`;
    if (bDisp) bDisp.innerHTML = `${calcBoost} <small>PSI</small>`;

    if (gearDisp) {
      if (this.currentRPM > 6500) gearDisp.textContent = '3RD [80ms]';
      else if (this.currentRPM > 3500) gearDisp.textContent = '2ND';
      else gearDisp.textContent = this.isFullThrottle ? '1ST' : 'IDLE';
    }

    if (bFill) bFill.style.width = `${(parseFloat(calcBoost) / 14) * 100}%`;
    if (hpFill) hpFill.style.width = `${(calcHP / 760) * 100}%`;
    if (tqFill) tqFill.style.width = `${(calcTorque / 625) * 100}%`;

    // 8-Cylinder Firing Order Pulse
    const firingOrder = [1, 5, 4, 8, 6, 3, 7, 2];
    const activeCylIndex = Math.floor(Date.now() / Math.max(15, Math.floor(60000 / this.currentRPM / 4))) % 8;
    const activeCyl = firingOrder[activeCylIndex];

    const pods = document.querySelectorAll('.cylinder-pod');
    pods.forEach((p) => {
      const c = parseInt(p.getAttribute('data-cyl'), 10);
      p.classList.toggle('firing', c === activeCyl);
    });

    this.drawTachometerDial();
  }

  drawTachometerDial() {
    if (!this.tachCtx) return;
    const ctx = this.tachCtx;
    const w = this.tachCanvas.width;
    const h = this.tachCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = w * 0.42;

    ctx.clearRect(0, 0, w, h);

    // Bezel
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#080A0F';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    ctx.stroke();

    const startAngle = (135 * Math.PI) / 180;
    const sweepRange = (270 * Math.PI) / 180;

    // Redline arc (7,500 to 9,000 RPM)
    const redlineStart = startAngle + (7500 / 9000) * sweepRange;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.88, redlineStart, startAngle + sweepRange);
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Needle
    const needleAngle = startAngle + (this.currentRPM / 9000) * sweepRange;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(needleAngle);

    ctx.shadowColor = '#EF4444';
    ctx.shadowBlur = this.currentRPM > 7000 ? 15 : 6;

    ctx.beginPath();
    ctx.moveTo(-10, -2);
    ctx.lineTo(radius * 0.82, 0);
    ctx.lineTo(-10, 2);
    ctx.fillStyle = '#EF4444';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#0F172A';
    ctx.fill();
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  // ==========================================================================
  // 3D MOTION GRAPHIC 3: MAGNERIDE SUSPENSION & REAL-TIME 3D BODY ROLL
  // ==========================================================================
  initChassisCircuits() {
    this.trackCanvas = document.getElementById('track-canvas');
    this.trackCtx = this.trackCanvas ? this.trackCanvas.getContext('2d') : null;
    this.gCanvas = document.getElementById('friction-circle-canvas');
    this.gCtx = this.gCanvas ? this.gCanvas.getContext('2d') : null;

    const circuitBtns = document.querySelectorAll('.circuit-btn');
    circuitBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        circuitBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeTrack = btn.getAttribute('data-track');
        this.trackProgress = 0;
        const nameEl = document.getElementById('track-turn-name');
        if (nameEl) {
          if (this.activeTrack === 'laguna') nameEl.textContent = 'WEATHERTECH LAGUNA SECA — CORKSCREW';
          else if (this.activeTrack === 'nurburgring') nameEl.textContent = 'NÜRBURGRING NORDSCHLEIFE — KARUSSELL';
          else nameEl.textContent = 'ROAD AMERICA — CANADA CORNER';
        }
      });
    });
  }

  update3DChassisDynamics() {
    this.trackProgress = (this.trackProgress + 0.0032) % 1;
    const t = this.trackProgress;

    // Simulate Lateral & Longitudinal G Vectors
    const angle = t * Math.PI * 2;
    let latG = Math.sin(angle * 2) * 1.34;
    let longG = Math.cos(angle * 3) * 0.95;

    // REAL 3D BODY ROLL & PITCH KINEMATICS:
    // In cornering, body rolls along Z-axis (lean). Under braking, body pitches down along X-axis (dive).
    if (this.carRoot && this.activeMode === 'chassis') {
      const targetRoll = -latG * 0.065; // 3D Body Roll
      const targetPitch = longG * 0.045; // 3D Brake Dive / Squat
      this.carRoot.rotation.z = THREE.MathUtils.lerp(this.carRoot.rotation.z, targetRoll, 0.15);
      this.carRoot.rotation.x = THREE.MathUtils.lerp(this.carRoot.rotation.x, targetPitch, 0.15);

      // 3D BREMBO BRAKE ROTORS THERMAL GLOW:
      // When hard braking (longG < -0.4), heated rotor materials glow red!
      const isHardBraking = longG < -0.3;
      this.carMeshes.calipers.forEach((caliper) => {
        if (caliper.material) {
          caliper.material.emissive = isHardBraking ? new THREE.Color(0xFF2200) : new THREE.Color(0x000000);
          caliper.material.emissiveIntensity = isHardBraking ? 1.5 : 0;
        }
      });
    }

    // Telemetry HUD readouts
    const latGEl = document.getElementById('lat-g-disp');
    const longGEl = document.getElementById('long-g-disp');
    if (latGEl) latGEl.textContent = `${latG >= 0 ? '+' : ''}${latG.toFixed(2)}g`;
    if (longGEl) {
      const mode = longG < 0 ? 'BRAKING' : 'ACCEL';
      longGEl.textContent = `${longG.toFixed(2)}g (${mode})`;
    }

    // 4 Corners Damper Bars
    const fl = Math.min(100, Math.max(15, 50 - latG * 25 - longG * 35));
    const fr = Math.min(100, Math.max(15, 50 + latG * 25 - longG * 35));
    const rl = Math.min(100, Math.max(15, 50 - latG * 25 + longG * 30));
    const rr = Math.min(100, Math.max(15, 50 + latG * 25 + longG * 30));

    this.updateCorner('fl', fl, Math.round(420 + Math.max(0, -longG) * 220));
    this.updateCorner('fr', fr, Math.round(440 + Math.max(0, -longG) * 220));
    this.updateCorner('rl', rl, Math.round(310 + Math.max(0, -longG) * 110));
    this.updateCorner('rr', rr, Math.round(330 + Math.max(0, -longG) * 110));

    this.draw2DFrictionCircle(latG, longG);
  }

  updateCorner(id, pct, temp) {
    const bar = document.getElementById(`damper-${id}-bar`);
    const t = document.getElementById(`rotor-${id}-temp`);
    if (bar) bar.style.height = `${pct}%`;
    if (t) t.textContent = `ROTOR: ${temp}°C`;
  }

  draw2DFrictionCircle(latG, longG) {
    if (!this.gCtx) return;
    const ctx = this.gCtx;
    const w = this.gCanvas.width;
    const h = this.gCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = w * 0.42;

    ctx.clearRect(0, 0, w, h);

    // Friction circles
    [0.5, 1.0, 1.5].forEach((g) => {
      ctx.beginPath();
      ctx.arc(cx, cy, (g / 1.5) * r, 0, Math.PI * 2);
      ctx.strokeStyle = g === 1.5 ? '#DC2626' : 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Acceleration Vector Point
    const vx = cx + (latG / 1.5) * r;
    const vy = cy - (longG / 1.5) * r;

    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(vx, vy);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(vx, vy, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#EF4444';
    ctx.fill();
  }

  // ==========================================================================
  // REAL-TIME 3D STUDIO BESPOKE CONFIGURATOR
  // ==========================================================================
  initStudioConfigurator() {
    const swatchBtns = document.querySelectorAll('.swatch-btn');
    swatchBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        swatchBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const hexStr = btn.getAttribute('data-color').replace('#', '0x');
        const colorHex = parseInt(hexStr, 16);
        const rough = parseFloat(btn.getAttribute('data-rough'));
        const metal = parseFloat(btn.getAttribute('data-metal'));

        this.currentPaintColor = colorHex;

        // Instantly update the Real 3D Mustang body material!
        this.carMeshes.body.forEach((mesh) => {
          if (mesh.material) {
            mesh.material.color.setHex(colorHex);
            mesh.material.roughness = rough;
            mesh.material.metalness = metal;
            mesh.material.needsUpdate = true;
          }
        });
      });
    });

    const pkgBtns = document.querySelectorAll('.pkg-btn');
    const priceDisp = document.getElementById('total-price-disp');
    pkgBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        pkgBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const isTrack = btn.getAttribute('data-pkg') === 'track';
        if (priceDisp) priceDisp.textContent = isTrack ? '$106,795' : '$91,295';
      });
    });

    const saveSpecBtn = document.getElementById('save-spec-btn');
    if (saveSpecBtn) {
      saveSpecBtn.addEventListener('click', () => {
        window.open('SHELBY_MUSTANG_SPECIFICATION.pdf', '_blank');
      });
    }
  }

  // ==========================================================================
  // CSM PLAQUE & GLOBAL SHORTCUTS
  // ==========================================================================
  initPlaqueAndShortcuts() {
    const nameInput = document.getElementById('csm-owner-name');
    const csmInput = document.getElementById('csm-chassis-no');
    const nameDisp = document.getElementById('plate-pilot-display');
    const csmDisp = document.getElementById('plate-csm-display');

    if (nameInput && nameDisp) {
      nameInput.addEventListener('input', (e) => {
        nameDisp.textContent = e.target.value.toUpperCase() || 'OFFICIAL SHELBY PILOT';
      });
    }

    if (csmInput && csmDisp) {
      csmInput.addEventListener('input', (e) => {
        csmDisp.textContent = e.target.value.toUpperCase() || 'CSM #2026-GT500';
      });
    }

    const audioBtn = document.getElementById('audio-toggle-btn');
    const audioLabel = document.getElementById('audio-label');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        const active = audioEngine.toggleMute();
        audioBtn.classList.toggle('active', active);
        if (audioLabel) audioLabel.textContent = active ? 'SOUND: ACTIVE (760HP)' : 'SOUND: MUTED';
      });
    }

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (document.activeElement.tagName === 'INPUT') return;
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        const pBtn = document.getElementById('throttle-pedal-btn');
        if (pBtn) pBtn.dispatchEvent(new Event('mousedown'));
      }
      if (e.key === 'm' || e.key === 'M') {
        if (audioBtn) audioBtn.click();
      }
      if (e.key === '0') document.querySelector('[data-mode="hero"]')?.click();
      if (e.key === '1') document.querySelector('[data-mode="aero"]')?.click();
      if (e.key === '2') document.querySelector('[data-mode="powertrain"]')?.click();
      if (e.key === '3') document.querySelector('[data-mode="chassis"]')?.click();
      if (e.key === '4') document.querySelector('[data-mode="configurator"]')?.click();
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        const pBtn = document.getElementById('throttle-pedal-btn');
        if (pBtn) pBtn.dispatchEvent(new Event('mouseup'));
      }
    });
  }

  // ==========================================================================
  // MASTER RENDER LOOP
  // ==========================================================================
  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = 0.016; // ~60 FPS

    // Camera target interpolation
    this.camera.position.lerp(this.targetCamPos, 0.05);
    this.controls.target.lerp(this.targetLookAt, 0.05);
    this.controls.update();

    // Auto turntable rotation in hero mode
    if (this.activeMode === 'hero' && !this.controls.state) {
      if (this.carRoot) {
        this.carRoot.rotation.y += 0.003;
      }
    } else {
      if (this.carRoot && this.activeMode !== 'hero') {
        this.carRoot.rotation.y = THREE.MathUtils.lerp(this.carRoot.rotation.y, 0, 0.05);
      }
    }

    // 1. Update 3D Wind Tunnel Streamlines
    this.update3DWindTunnel(delta);

    // 2. Update 3D Powertrain Dyno & Chassis Shake
    this.update3DPowertrainDyno();

    // 3. Update 3D MagneRide Suspension & Body Roll
    this.update3DChassisDynamics();

    // Render WebGL Scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Bootstrap on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.shelbyApp = new Shelby3DApp();
});
