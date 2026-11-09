/**
 * SHELBY MUSTANG GT500 - LUXURY INTERACTIVE MOTION ENGINE
 * Features 3 World-Class Visual Motion Graphics:
 * 1. Aerodynamic Supersonic Wind Tunnel Particle Field
 * 2. 5.2L Supercharged Predator V8 Dyno & Acoustic Synthesizer
 * 3. MagneRide 1,000Hz Suspension & Apex G-Force Telemetry HUD
 */

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
      this.exhaustFilter.Q.setValueAtTime(4, this.ctx.currentTime);

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
      if (statusEl) statusEl.textContent = 'WEB AUDIO: SYNTHESIZED 760HP';
    } catch (e) {
      console.warn('AudioContext not allowed without user gesture yet:', e);
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
    // 5.2L V8 four-stroke: Fundamental firing frequency = (RPM / 60) * 4 cylinders per rev
    const v8Freq = Math.max(30, (rpm / 60) * 4);
    
    this.v8Osc1.frequency.setTargetAtTime(v8Freq, now, 0.03);
    this.v8Osc2.frequency.setTargetAtTime(v8Freq * 1.5, now, 0.03);

    // Filter opening with throttle & revs
    const filterFreq = 300 + (rpm / 8250) * 3200 + loadFactor * 1200;
    this.exhaustFilter.frequency.setTargetAtTime(filterFreq, now, 0.03);

    // Supercharger pulley ratio 2.65: Whine frequency scales with RPM and load
    const blowerFreq = 900 + (rpm / 8250) * 4200;
    this.blowerOsc.frequency.setTargetAtTime(blowerFreq, now, 0.03);
    
    // Supercharger volume increases dramatically under boost / load
    const blowerVol = 0.01 + loadFactor * 0.12 * (rpm / 8250);
    this.blowerGain.gain.setTargetAtTime(blowerVol, now, 0.03);
  }

  getWaveformData() {
    if (!this.analyser || !this.dataArray) {
      return new Uint8Array(32).fill(128);
    }
    this.analyser.getByteTimeDomainData(this.dataArray);
    return this.dataArray;
  }
}

const audioEngine = new ShelbyAudioEngine();

// ============================================================================
// MOTION GRAPHIC 1: SUPERSONIC WIND TUNNEL PARTICLE FIELD
// ============================================================================
class AeroWindTunnel {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.particles = [];
    this.numParticles = 1400;
    this.windSpeed = 130; // MPH
    this.mode = 'stream'; // 'stream', 'pressure', 'vortex'
    this.wingAngle = 8.5; // degrees
    this.mouse = { x: -1000, y: -1000, active: false };

    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Mouse interactive vortex disruption
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      this.mouse.y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
      this.mouse.active = true;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.mouse.active = false;
    });

    this.initParticles();
    this.animate();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * (window.devicePixelRatio || 1);
    this.canvas.height = rect.height * (window.devicePixelRatio || 1);
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < this.numParticles; i++) {
      this.particles.push(this.createParticle(Math.random() * this.canvas.width));
    }
  }

  createParticle(startX) {
    const ySpread = Math.random();
    return {
      x: startX !== undefined ? startX : -20,
      y: ySpread * this.canvas.height,
      origY: ySpread * this.canvas.height,
      speedX: 2 + Math.random() * 2,
      size: 1 + Math.random() * 2,
      opacity: 0.3 + Math.random() * 0.7,
      vortexAngle: Math.random() * Math.PI * 2,
      vortexSpeed: 0.05 + Math.random() * 0.1,
      color: '#38BDF8'
    };
  }

  setSpeed(mph) {
    this.windSpeed = mph;
    this.updateHUD();
  }

  setMode(mode) {
    this.mode = mode;
  }

  setWingAngle(deg) {
    this.wingAngle = deg;
    this.updateHUD();
  }

  updateHUD() {
    // Aerodynamic Downforce Formula: Downforce proportional to (Velocity^2) * sin(WingAngle)
    const baseDownforce = 120;
    const speedRatio = this.windSpeed / 130;
    const wingFactor = 1 + (this.wingAngle - 8.5) * 0.08;
    const calculatedLbs = Math.round(baseDownforce * (speedRatio * speedRatio) * 3.4 * wingFactor);
    
    // Drag coefficient changes with wing angle
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

  drawShelbySilhouette(cx, cy, scale) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    // Car Body Gradient (Carbon & Brushed Steel)
    const carGrad = ctx.createLinearGradient(-350, -80, 350, 100);
    carGrad.addColorStop(0, '#0F172A');
    carGrad.addColorStop(0.4, '#1E293B');
    carGrad.addColorStop(0.7, '#334155');
    carGrad.addColorStop(1, '#090D16');

    ctx.fillStyle = carGrad;
    ctx.strokeStyle = '#60A5FA';
    ctx.lineWidth = 1.5;

    // Streamlined GT500 Profile Path
    ctx.beginPath();
    ctx.moveTo(-320, 45); // Front splitter tip
    ctx.lineTo(-300, 35); // Front air intake
    ctx.lineTo(-240, 20); // Front bumper curve
    ctx.lineTo(-190, -5); // Front wheel arch peak
    ctx.lineTo(-110, -18); // Muscular hood line
    ctx.lineTo(-50, -32);  // Base of windshield
    ctx.lineTo(40, -68);   // Windshield peak
    ctx.lineTo(140, -68);  // Roof line
    ctx.lineTo(240, -25);  // Fastback slope
    ctx.lineTo(290, 5);    // Rear deck lid
    ctx.lineTo(310, 15);   // Rear spoiler base
    ctx.lineTo(325, 45);   // Rear diffuser
    ctx.lineTo(310, 52);   // Diffuser fins
    ctx.lineTo(260, 52);   // Rear tire back
    ctx.arc(210, 52, 38, 0, Math.PI, true); // Rear wheel arch
    ctx.lineTo(-130, 52);  // Side skirt
    ctx.arc(-180, 52, 38, 0, Math.PI, true); // Front wheel arch
    ctx.lineTo(-315, 52);  // Under splitter
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // GT4 Carbon Rear Wing (Rotates with Wing Angle Slider)
    ctx.save();
    ctx.translate(285, 2);
    ctx.rotate((-this.wingAngle * Math.PI) / 180);
    ctx.fillStyle = '#0F172A';
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2;
    ctx.fillRect(-20, -12, 50, 6);
    ctx.strokeRect(-20, -12, 50, 6);
    // Endplates
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(25, -20, 6, 22);
    ctx.restore();

    // Hood Heat Extractor Louver Slits
    ctx.strokeStyle = '#93C5FD';
    ctx.lineWidth = 1;
    for (let lx = -130; lx <= -70; lx += 15) {
      ctx.beginPath();
      ctx.moveTo(lx, -16);
      ctx.lineTo(lx + 8, -22);
      ctx.stroke();
    }

    // Le Mans Dual Stripes along body
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-300, 32);
    ctx.lineTo(-100, -20);
    ctx.lineTo(40, -66);
    ctx.lineTo(140, -66);
    ctx.lineTo(290, 3);
    ctx.stroke();

    // High Performance Wheels
    ctx.fillStyle = '#050608';
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 2;

    // Front Wheel
    ctx.beginPath();
    ctx.arc(-180, 52, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Front Brake Caliper (Brembo Red)
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(-195, 35, 12, 22);

    // Rear Wheel
    ctx.fillStyle = '#050608';
    ctx.beginPath();
    ctx.arc(210, 52, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Rear Brake Caliper
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(195, 37, 10, 18);

    ctx.restore();
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Dark wind tunnel background with motion trail fade
    ctx.fillStyle = 'rgba(4, 6, 10, 0.28)';
    ctx.fillRect(0, 0, w, h);

    // Geometric Grid background lines (Wind Tunnel laser lines)
    ctx.strokeStyle = 'rgba(0, 82, 204, 0.05)';
    ctx.lineWidth = 1;
    for (let gy = 0; gy < h; gy += 40) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(w, gy);
      ctx.stroke();
    }

    const carCenterX = w * 0.52;
    const carCenterY = h * 0.55;
    const scale = Math.min(w / 1000, 1.1);

    // Render 1,400+ Aerodynamic Particles
    const speedMult = (this.windSpeed / 100) * 4.5;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += p.speedX * speedMult;

      // Relative coordinates to car
      const rx = (p.x - carCenterX) / scale;
      const ry = (p.y - carCenterY) / scale;

      // Aerodynamic Obstacle Deflection Model (NACA airfoil & body shape)
      let deflectionY = 0;
      let pressureIntensity = 0.5;

      // Front splitter stagnation zone
      if (rx > -340 && rx < -200 && ry > 0 && ry < 60) {
        deflectionY = (ry - 45) * 0.08;
        pressureIntensity = 1.0; // High Stagnation Pressure
      }
      // Hood and windshield upwash
      else if (rx >= -200 && rx < 60 && ry > -80 && ry < 30) {
        deflectionY = -((rx + 200) / 260) * 2.8;
        pressureIntensity = 0.8;
      }
      // Roof fastback flow
      else if (rx >= 60 && rx < 260 && ry > -85 && ry < 20) {
        deflectionY = ((rx - 60) / 200) * 2.2;
        pressureIntensity = 0.3; // Low pressure laminar flow
      }
      // Rear GT4 wing vortex downwash
      else if (rx >= 260 && rx < 340 && ry > -30 && ry < 40) {
        deflectionY = (this.wingAngle / 8.5) * 2.4;
        pressureIntensity = 0.9;
      }
      // Diffuser low pressure extraction (underbody Venturi ground effect)
      else if (rx > -180 && rx < 320 && ry >= 35 && ry <= 65) {
        deflectionY = 0.8;
        pressureIntensity = 0.2; // Suction zone
      }
      // Rear turbulent wake vortex
      else if (rx >= 330 && rx < 600 && ry > -50 && ry < 70) {
        p.vortexAngle += p.vortexSpeed * (speedMult * 0.8);
        deflectionY = Math.sin(p.vortexAngle) * (1.8 + (this.wingAngle / 10) * 1.5);
      }

      // Cursor vortex turbulence
      if (this.mouse.active) {
        const dx = p.x - this.mouse.x;
        const dy = p.y - this.mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          const force = (1 - dist / 120) * 5;
          deflectionY += (dy / (dist || 1)) * force;
        }
      }

      p.y += deflectionY;

      // Particle Color Mapping according to visual mode
      let strokeColor = 'rgba(56, 189, 248, ';
      if (this.mode === 'pressure') {
        if (pressureIntensity > 0.85) strokeColor = 'rgba(239, 68, 68, '; // Stagnation High Pressure
        else if (pressureIntensity > 0.5) strokeColor = 'rgba(245, 158, 11, '; // Moderate Pressure
        else strokeColor = 'rgba(6, 182, 212, '; // Low Pressure Suction
      } else if (this.mode === 'vortex') {
        if (rx >= 310) strokeColor = 'rgba(244, 63, 94, '; // Wake vortex highlighted
        else strokeColor = 'rgba(148, 163, 184, ';
      }

      // Draw dynamic streak line
      ctx.strokeStyle = `${strokeColor}${p.opacity})`;
      ctx.lineWidth = p.size;
      ctx.beginPath();
      ctx.moveTo(p.x - p.speedX * speedMult * 1.8, p.y - deflectionY);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();

      // Reset when exiting right screen
      if (p.x > w + 40) {
        this.particles[i] = this.createParticle(-20);
      }
    }

    // Draw the Master Shelby Silhouette
    this.drawShelbySilhouette(carCenterX, carCenterY, scale);
  }
}

// ============================================================================
// MOTION GRAPHIC 2: PREDATOR 5.2L V8 DYNO & TACHOMETER
// ============================================================================
class PowertrainDynoEngine {
  constructor() {
    this.tachCanvas = document.getElementById('tachometer-canvas');
    this.waveCanvas = document.getElementById('audio-waveform-canvas');
    if (!this.tachCanvas) return;

    this.tachCtx = this.tachCanvas.getContext('2d');
    this.waveCtx = this.waveCanvas ? this.waveCanvas.getContext('2d') : null;

    this.currentRPM = 850;
    this.targetRPM = 850;
    this.needleVelocity = 0;
    this.isFullThrottle = false;
    this.firingStep = 0;

    // Cross-Plane V8 Firing Order: 1 - 5 - 4 - 8 - 6 - 3 - 7 - 2
    this.firingOrder = [1, 5, 4, 8, 6, 3, 7, 2];

    this.initControls();
    this.animate();
  }

  initControls() {
    const throttleBtn = document.getElementById('throttle-pedal-btn');
    const quickRevBtn = document.getElementById('quick-rev-btn');
    const manualSlider = document.getElementById('manual-rpm-slider');

    const startRev = () => {
      this.isFullThrottle = true;
      this.targetRPM = 8250; // Redline screaming apex
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
        setTimeout(stopRev, 1400);
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

    // Spacebar keybind for throttle
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !e.repeat && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        startRev();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        stopRev();
      }
    });
  }

  drawTachometer() {
    const ctx = this.tachCtx;
    const w = this.tachCanvas.width;
    const h = this.tachCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = w * 0.42;

    ctx.clearRect(0, 0, w, h);

    // Bezel brushed ring
    const bezelGrad = ctx.createRadialGradient(cx, cy, radius * 0.85, cx, cy, radius * 1.05);
    bezelGrad.addColorStop(0, '#0F172A');
    bezelGrad.addColorStop(0.5, '#334155');
    bezelGrad.addColorStop(1, '#050608');

    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.05, 0, Math.PI * 2);
    ctx.fillStyle = bezelGrad;
    ctx.fill();

    // Inner dial face
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#080A0F';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Gauge Sweep: From 135° to 405° (270° total span for 0 - 9000 RPM)
    const startAngle = (135 * Math.PI) / 180;
    const sweepRange = (270 * Math.PI) / 180;

    // Redline arc (7,500 to 9,000 RPM)
    const redlineStart = startAngle + (7500 / 9000) * sweepRange;
    const redlineEnd = startAngle + sweepRange;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.88, redlineStart, redlineEnd);
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Supercharger Boost Ring (outer glow)
    const boostRatio = Math.max(0, (this.currentRPM - 1500) / 6750);
    const boostAngle = startAngle + boostRatio * sweepRange;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.96, startAngle, boostAngle);
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Gauge Tick Marks & Numbers
    for (let r = 0; r <= 9000; r += 500) {
      const angle = startAngle + (r / 9000) * sweepRange;
      const isMajor = r % 1000 === 0;
      const innerR = radius * (isMajor ? 0.76 : 0.82);
      const outerR = radius * 0.88;

      const x1 = cx + Math.cos(angle) * innerR;
      const y1 = cy + Math.sin(angle) * innerR;
      const x2 = cx + Math.cos(angle) * outerR;
      const y2 = cy + Math.sin(angle) * outerR;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = r >= 7500 ? '#EF4444' : isMajor ? '#F8FAFC' : '#475569';
      ctx.lineWidth = isMajor ? 3 : 1.5;
      ctx.stroke();

      if (isMajor) {
        const textR = radius * 0.65;
        const tx = cx + Math.cos(angle) * textR;
        const ty = cy + Math.sin(angle) * textR + 5;
        ctx.fillStyle = r >= 7500 ? '#EF4444' : '#94A3B8';
        ctx.font = 'bold 15px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText((r / 1000).toString(), tx, ty);
      }
    }

    // Needle Drawing with Spring Physics
    const needleAngle = startAngle + (this.currentRPM / 9000) * sweepRange;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(needleAngle);

    // Needle drop shadow
    ctx.shadowColor = '#EF4444';
    ctx.shadowBlur = this.currentRPM > 7000 ? 20 : 8;

    // Needle Blade
    ctx.beginPath();
    ctx.moveTo(-15, -3);
    ctx.lineTo(radius * 0.85, 0);
    ctx.lineTo(-15, 3);
    ctx.closePath();
    ctx.fillStyle = '#EF4444';
    ctx.fill();

    // Center Hub Cap
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fillStyle = '#0F172A';
    ctx.fill();
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  drawWaveform() {
    if (!this.waveCtx) return;
    const ctx = this.waveCtx;
    const w = this.waveCanvas.width;
    const h = this.waveCanvas.height;

    ctx.clearRect(0, 0, w, h);
    const data = audioEngine.getWaveformData();

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#38BDF8';
    ctx.beginPath();

    const sliceWidth = w / data.length;
    let x = 0;

    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 128.0;
      const y = (v * h) / 2;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);

      x += sliceWidth;
    }
    ctx.stroke();
  }

  updateTelemetry() {
    // Spring physics integration for responsive needle sweep
    const springK = 0.18;
    const damping = 0.78;
    const force = (this.targetRPM - this.currentRPM) * springK;
    this.needleVelocity = (this.needleVelocity + force) * damping;
    this.currentRPM += this.needleVelocity;

    if (this.currentRPM < 850) this.currentRPM = 850;
    if (this.currentRPM > 8250) this.currentRPM = 8250;

    // Power calculations: Predator 5.2L V8
    // Peak HP: 760 BHP @ 7,300 RPM. Peak Torque: 625 LB-FT @ 5,000 RPM.
    const rpmFrac = (this.currentRPM - 850) / (8250 - 850);
    const calcHP = Math.round(95 + Math.pow(rpmFrac, 1.25) * 665);
    const calcTorque = Math.round(220 + Math.sin(rpmFrac * Math.PI * 0.85) * 405);
    const calcBoost = ((rpmFrac * 12.2) * (this.isFullThrottle ? 1.0 : 0.4)).toFixed(1);

    // DOM Updates
    const rpmReadout = document.getElementById('rpm-readout');
    const gearDisp = document.getElementById('gear-indicator');
    const hpDisp = document.getElementById('dyno-hp-disp');
    const tqDisp = document.getElementById('dyno-torque-disp');
    const bDisp = document.getElementById('boost-psi-disp');
    const bFill = document.getElementById('boost-meter-fill');
    const hpFill = document.getElementById('hp-meter-fill');
    const tqFill = document.getElementById('torque-meter-fill');
    
    // Hero HUD synced metrics
    const heroBoostVal = document.getElementById('hero-boost-val');
    const heroBoostBar = document.getElementById('hero-boost-bar');
    const heroEgtVal = document.getElementById('hero-egt-val');
    const heroEgtBar = document.getElementById('hero-egt-bar');

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

    if (heroBoostVal) heroBoostVal.textContent = `${calcBoost} PSI`;
    if (heroBoostBar) heroBoostBar.style.width = `${(parseFloat(calcBoost) / 14) * 100}%`;
    if (heroEgtVal) {
      const egt = Math.round(520 + (this.currentRPM / 8250) * 380);
      heroEgtVal.textContent = `${egt}° C`;
      if (heroEgtBar) heroEgtBar.style.width = `${(egt / 950) * 100}%`;
    }

    // Cylinder firing sequence animation step
    this.firingStep++;
    const activeCylIndex = Math.floor(this.firingStep / Math.max(1, Math.floor(6000 / this.currentRPM))) % 8;
    const activeCyl = this.firingOrder[activeCylIndex];

    const pods = document.querySelectorAll('.cylinder-pod');
    pods.forEach((pod) => {
      const cylNum = parseInt(pod.getAttribute('data-cyl'), 10);
      if (cylNum === activeCyl) {
        pod.classList.add('firing');
      } else {
        pod.classList.remove('firing');
      }
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.updateTelemetry();
    this.drawTachometer();
    this.drawWaveform();
  }
}

// ============================================================================
// MOTION GRAPHIC 3: MAGNERIDE 1,000Hz CHASSIS & G-FORCE HUD
// ============================================================================
class MagneRideChassisEngine {
  constructor() {
    this.trackCanvas = document.getElementById('track-canvas');
    this.gCanvas = document.getElementById('friction-circle-canvas');
    if (!this.trackCanvas || !this.gCanvas) return;

    this.trackCtx = this.trackCanvas.getContext('2d');
    this.gCtx = this.gCanvas.getContext('2d');

    this.isPlaying = true;
    this.trackProgress = 0; // 0 to 1 along circuit
    this.activeTrack = 'laguna';
    this.trailPoints = [];

    this.initControls();
    this.animate();
  }

  initControls() {
    const playBtn = document.getElementById('track-play-toggle');
    const playIcon = document.getElementById('play-icon');
    const playText = document.getElementById('play-text');

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        this.isPlaying = !this.isPlaying;
        if (playIcon) playIcon.textContent = this.isPlaying ? '⏸' : '▶';
        if (playText) playText.textContent = this.isPlaying ? 'PAUSE SIMULATION' : 'RESUME TELEMETRY';
      });
    }

    const trackBtns = document.querySelectorAll('.circuit-btn');
    trackBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        trackBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeTrack = btn.getAttribute('data-track');
        this.trackProgress = 0;
        this.trailPoints = [];
        this.updateTrackMeta();
      });
    });
  }

  updateTrackMeta() {
    const nameEl = document.getElementById('track-turn-name');
    if (!nameEl) return;
    if (this.activeTrack === 'laguna') {
      nameEl.textContent = 'WEATHERTECH RACEWAY LAGUNA SECA — THE CORKSCREW';
    } else if (this.activeTrack === 'nurburgring') {
      nameEl.textContent = 'NÜRBURGRING NORDSCHLEIFE — KARUSSELL BANKING';
    } else {
      nameEl.textContent = 'ROAD AMERICA — CANADA CORNER APEX';
    }
  }

  // Generate 2D parametric track path
  getTrackPoint(t) {
    const w = this.trackCanvas.width;
    const h = this.trackCanvas.height;
    const cx = w * 0.5;
    const cy = h * 0.5;

    let x, y, speed, latG, longG;

    if (this.activeTrack === 'laguna') {
      // Laguna Seca Elevation Drop & Double Apex
      const angle = t * Math.PI * 2;
      x = cx + Math.cos(angle) * (w * 0.36) + Math.sin(angle * 2) * 50;
      y = cy + Math.sin(angle) * (h * 0.34) + Math.cos(angle * 3) * 35;
      latG = Math.sin(angle * 2) * 1.35;
      longG = Math.cos(angle) * 0.95;
      speed = Math.round(55 + (1 - Math.abs(latG) / 1.4) * 85);
    } else if (this.activeTrack === 'nurburgring') {
      // High-G banked carousel
      const angle = t * Math.PI * 2;
      x = cx + Math.cos(angle) * (w * 0.4) + Math.sin(angle * 4) * 30;
      y = cy + Math.sin(angle) * (h * 0.38) + Math.sin(angle * 2) * 40;
      latG = Math.cos(angle * 3) * 1.42;
      longG = Math.sin(angle * 1.5) * 0.88;
      speed = Math.round(62 + (1 - Math.abs(latG) / 1.5) * 98);
    } else {
      // Road America heavy braking zone into tight right
      const angle = t * Math.PI * 2;
      x = cx + Math.cos(angle) * (w * 0.42);
      y = cy + Math.sin(angle) * (h * 0.3);
      latG = Math.sin(angle) * 1.25;
      longG = Math.cos(angle * 2) * 1.15;
      speed = Math.round(48 + (1 - Math.abs(latG) / 1.3) * 115);
    }

    return { x, y, speed, latG, longG };
  }

  drawTrack() {
    const ctx = this.trackCtx;
    const w = this.trackCanvas.width;
    const h = this.trackCanvas.height;

    ctx.fillStyle = '#030406';
    ctx.fillRect(0, 0, w, h);

    // Track Surface Line
    ctx.beginPath();
    for (let step = 0; step <= 200; step++) {
      const pt = this.getTrackPoint(step / 200);
      if (step === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.closePath();
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#1E293B';
    ctx.stroke();

    // Racing line with apex curbs
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.stroke();

    // Car Position on Track
    const carPos = this.getTrackPoint(this.trackProgress);

    // Telemetry Trail
    this.trailPoints.push({ x: carPos.x, y: carPos.y });
    if (this.trailPoints.length > 25) this.trailPoints.shift();

    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < this.trailPoints.length; i++) {
      const p = this.trailPoints[i];
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    // Car Blip
    ctx.beginPath();
    ctx.arc(carPos.x, carPos.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#F59E0B';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // DOM Telemetry update
    const speedEl = document.getElementById('track-speed-telemetry');
    if (speedEl) speedEl.textContent = `APEX SPEED: ${carPos.speed} MPH • BRAKING LOAD: ${Math.max(0, -carPos.longG).toFixed(2)}G`;

    return carPos;
  }

  drawFrictionCircle(telemetry) {
    const ctx = this.gCtx;
    const w = this.gCanvas.width;
    const h = this.gCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const maxRadius = w * 0.42;

    ctx.clearRect(0, 0, w, h);

    // Concentric G-Rings: 0.5G, 1.0G, 1.5G
    const gLevels = [0.5, 1.0, 1.5];
    gLevels.forEach((g) => {
      const r = (g / 1.5) * maxRadius;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = g === 1.5 ? '#DC2626' : 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#64748B';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText(`${g}G`, cx + r - 10, cy - 4);
    });

    // Crosshairs
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.moveTo(cx, 10);
    ctx.lineTo(cx, h - 10);
    ctx.moveTo(10, cy);
    ctx.lineTo(w - 10, cy);
    ctx.stroke();

    // Plot G Vector Point
    const gX = cx + (telemetry.latG / 1.5) * maxRadius;
    const gY = cy - (telemetry.longG / 1.5) * maxRadius;

    // Vector line from origin
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(gX, gY);
    ctx.stroke();

    // G Vector Dot with Pulsing Halo
    const totalG = Math.sqrt(telemetry.latG * telemetry.latG + telemetry.longG * telemetry.longG).toFixed(2);
    ctx.beginPath();
    ctx.arc(gX, gY, 6, 0, Math.PI * 2);
    ctx.fillStyle = totalG > 1.2 ? '#EF4444' : '#F59E0B';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Update Telemetry labels
    const gReadout = document.getElementById('current-g-readout');
    const latGEl = document.getElementById('lat-g-disp');
    const longGEl = document.getElementById('long-g-disp');

    if (gReadout) gReadout.textContent = `${totalG} G`;
    if (latGEl) latGEl.textContent = `${telemetry.latG >= 0 ? '+' : ''}${telemetry.latG.toFixed(2)}g`;
    if (longGEl) {
      const mode = telemetry.longG < 0 ? 'BRAKING' : 'ACCELERATION';
      longGEl.textContent = `${telemetry.longG.toFixed(2)}g (${mode})`;
    }

    // 4 Corner MagneRide Damper Loads
    const lat = telemetry.latG;
    const lon = telemetry.longG;

    // FL: compressed in hard braking + right turns
    const fl = Math.min(100, Math.max(15, 50 - lat * 30 - lon * 35));
    const fr = Math.min(100, Math.max(15, 50 + lat * 30 - lon * 35));
    const rl = Math.min(100, Math.max(15, 50 - lat * 30 + lon * 30));
    const rr = Math.min(100, Math.max(15, 50 + lat * 30 + lon * 30));

    this.updateCornerPod('fl', fl, Math.round(380 + (-lon > 0 ? -lon * 240 : 0)));
    this.updateCornerPod('fr', fr, Math.round(390 + (-lon > 0 ? -lon * 240 : 0)));
    this.updateCornerPod('rl', rl, Math.round(280 + (-lon > 0 ? -lon * 120 : 0)));
    this.updateCornerPod('rr', rr, Math.round(290 + (-lon > 0 ? -lon * 120 : 0)));
  }

  updateCornerPod(id, pct, tempC) {
    const valEl = document.getElementById(`damper-${id}-val`);
    const barEl = document.getElementById(`damper-${id}-bar`);
    const tempEl = document.getElementById(`rotor-${id}-temp`);

    if (valEl) valEl.textContent = `${Math.round(pct)}%`;
    if (barEl) barEl.style.height = `${pct}%`;
    if (tempEl) tempEl.textContent = `${tempC}°C`;
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    if (this.isPlaying) {
      this.trackProgress = (this.trackProgress + 0.0028) % 1;
    }
    const telemetry = this.drawTrack();
    this.drawFrictionCircle(telemetry);
  }
}

// ============================================================================
// STUDIO BESPOKE 360° CONFIGURATOR
// ============================================================================
class StudioConfigurator {
  constructor() {
    this.canvas = document.getElementById('studio-car-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.currentColor = '#0F172A';
    this.currentStripeColor = '#FFFFFF';
    this.currentStripeMode = 'dual-white';
    this.currentPackage = 'track'; // 'track' vs 'handling'
    this.currentAngle = 'side'; // 'side', 'three-quarter', 'rear'
    this.baseMSRP = 88295;

    this.initControls();
    this.render();
  }

  initControls() {
    // Swatches
    const swatchBtns = document.querySelectorAll('.swatch-btn');
    swatchBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        swatchBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentColor = btn.getAttribute('data-color');
        this.currentStripeColor = btn.getAttribute('data-stripe');
        this.render();
      });
    });

    // Stripes
    const stripeBtns = document.querySelectorAll('.stripe-option-btn');
    stripeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        stripeBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentStripeMode = btn.getAttribute('data-stripes');
        this.render();
      });
    });

    // Packages
    const pkgCards = document.querySelectorAll('.pkg-card');
    pkgCards.forEach((card) => {
      card.addEventListener('click', () => {
        pkgCards.forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
        this.currentPackage = card.getAttribute('data-pkg');
        this.updatePrice();
        this.render();
      });
    });

    // Angle switchers
    const angleBtns = document.querySelectorAll('.angle-btn');
    angleBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        angleBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentAngle = btn.getAttribute('data-view');
        this.render();
      });
    });

    // Save Spec Build Sheet Button
    const saveBtn = document.getElementById('save-spec-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        alert('OFFICIAL SHELBY BUILD SHEET GENERATED.\nCommission registered with Shelby American Inc.\nSerial chassis slot reserved.');
      });
    }
  }

  updatePrice() {
    const pkgAdd = this.currentPackage === 'track' ? 18500 : 3000;
    const total = this.baseMSRP + pkgAdd;
    const priceEl = document.getElementById('total-price-disp');
    if (priceEl) priceEl.textContent = `$${total.toLocaleString()}`;

    const titleEl = document.getElementById('active-spec-title');
    if (titleEl) {
      const pkgName = this.currentPackage === 'track' ? 'CARBON FIBER TRACK PACK' : 'HANDLING & CRUISE';
      titleEl.textContent = `SHELBY GT500 • ${pkgName}`;
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2 + 20;

    ctx.clearRect(0, 0, w, h);

    // Studio Stage Spotlight & Ground Reflection
    const groundGrad = ctx.createRadialGradient(cx, cy + 80, 20, cx, cy + 80, 380);
    groundGrad.addColorStop(0, 'rgba(0, 82, 204, 0.25)');
    groundGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.4)');
    groundGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = groundGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 80, 380, 45, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(cx, cy);

    // Render perspective according to chosen angle
    if (this.currentAngle === 'side') {
      this.drawSideView(ctx);
    } else if (this.currentAngle === 'three-quarter') {
      this.drawThreeQuarterView(ctx);
    } else {
      this.drawRearView(ctx);
    }

    ctx.restore();
  }

  drawSideView(ctx) {
    // Body silhouette with active chosen color
    ctx.fillStyle = this.currentColor;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(-340, 35);
    ctx.lineTo(-315, 25);
    ctx.lineTo(-240, 10);
    ctx.lineTo(-190, -12);
    ctx.lineTo(-100, -25);
    ctx.lineTo(-40, -42);
    ctx.lineTo(50, -78);
    ctx.lineTo(160, -78);
    ctx.lineTo(260, -28);
    ctx.lineTo(310, 5);
    ctx.lineTo(330, 35);
    ctx.lineTo(315, 45);
    ctx.lineTo(265, 45);
    ctx.arc(215, 45, 40, 0, Math.PI, true);
    ctx.lineTo(-135, 45);
    ctx.arc(-185, 45, 40, 0, Math.PI, true);
    ctx.lineTo(-335, 45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Racing Stripes
    if (this.currentStripeMode !== 'none') {
      let sColor = '#FFFFFF';
      if (this.currentStripeMode === 'dual-black') sColor = '#000000';
      if (this.currentStripeMode === 'dual-red') sColor = '#DC2626';

      ctx.fillStyle = sColor;
      ctx.fillRect(-280, 15, 580, 6);
      ctx.fillRect(-280, 24, 580, 6);
    }

    // High Downforce Carbon Wing (if Track Pack selected)
    if (this.currentPackage === 'track') {
      ctx.fillStyle = '#111827';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.fillRect(270, -32, 65, 8);
      ctx.fillRect(295, -24, 6, 28);
      ctx.fillRect(325, -24, 6, 28);
    } else {
      // Integrated Gurney Flap
      ctx.fillStyle = '#111827';
      ctx.fillRect(305, 2, 25, 6);
    }

    // Wheels (Exposed Carbon Weave vs Titanium)
    const wheelColor = this.currentPackage === 'track' ? '#0A0A0C' : '#334155';
    this.drawWheel(ctx, -185, 45, wheelColor);
    this.drawWheel(ctx, 215, 45, wheelColor);
  }

  drawThreeQuarterView(ctx) {
    // 3/4 Perspective Apex View
    ctx.fillStyle = this.currentColor;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(-280, 30);
    ctx.lineTo(-240, -10);
    ctx.lineTo(-160, -35);
    ctx.lineTo(20, -70);
    ctx.lineTo(120, -65);
    ctx.lineTo(260, 0);
    ctx.lineTo(310, 40);
    ctx.lineTo(240, 48);
    ctx.arc(190, 48, 42, 0, Math.PI, true);
    ctx.lineTo(-120, 48);
    ctx.arc(-170, 48, 42, 0, Math.PI, true);
    ctx.lineTo(-275, 48);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Wide aggressive Cobra Grille & Splitter
    ctx.fillStyle = '#050608';
    ctx.fillRect(-280, 15, 80, 30);
    // Cobra Snake Emblem
    ctx.fillStyle = '#E2E8F0';
    ctx.font = '18px sans-serif';
    ctx.fillText('🐍', -250, 36);

    // Wheels
    this.drawWheel(ctx, -170, 48, '#0F172A');
    this.drawWheel(ctx, 190, 48, '#0F172A');
  }

  drawRearView(ctx) {
    // Rear Diffuser & Quad Exhaust View
    ctx.fillStyle = this.currentColor;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.roundRect(-220, -50, 440, 100, 18);
    ctx.fill();
    ctx.stroke();

    // Quad 5-inch Active Exhaust Tips
    ctx.fillStyle = '#CBD5E1';
    ctx.beginPath();
    ctx.arc(-140, 35, 18, 0, Math.PI * 2);
    ctx.arc(-100, 35, 18, 0, Math.PI * 2);
    ctx.arc(100, 35, 18, 0, Math.PI * 2);
    ctx.arc(140, 35, 18, 0, Math.PI * 2);
    ctx.fill();

    // Quad inner chrome pipes
    ctx.fillStyle = '#090D16';
    ctx.beginPath();
    ctx.arc(-140, 35, 14, 0, Math.PI * 2);
    ctx.arc(-100, 35, 14, 0, Math.PI * 2);
    ctx.arc(100, 35, 14, 0, Math.PI * 2);
    ctx.arc(140, 35, 14, 0, Math.PI * 2);
    ctx.fill();

    // Center Cobra Decklid Badge
    ctx.fillStyle = '#CBD5E1';
    ctx.beginPath();
    ctx.arc(0, -10, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#090D16';
    ctx.fillText('SHELBY', -18, -6);
  }

  drawWheel(ctx, x, y, rimColor) {
    ctx.save();
    ctx.translate(x, y);

    // Tire outer rubber
    ctx.fillStyle = '#050608';
    ctx.beginPath();
    ctx.arc(0, 0, 38, 0, Math.PI * 2);
    ctx.fill();

    // Carbon Wheel Rim
    ctx.fillStyle = rimColor;
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Brembo Red Brake Caliper
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(-16, -14, 10, 18);

    ctx.restore();
  }
}

// ============================================================================
// CARROLL SHELBY CSM REGISTRY & HISTORICAL LINEAGE
// ============================================================================
class HeritageRegistryManager {
  constructor() {
    this.nameInput = document.getElementById('csm-owner-name');
    this.csmInput = document.getElementById('csm-chassis-no');
    this.nameDisplay = document.getElementById('plate-pilot-display');
    this.csmDisplay = document.getElementById('plate-csm-display');

    this.initPlaque();
    this.initLineage();
  }

  initPlaque() {
    if (this.nameInput && this.nameDisplay) {
      this.nameInput.addEventListener('input', (e) => {
        this.nameDisplay.textContent = e.target.value.toUpperCase() || 'OFFICIAL SHELBY PILOT';
      });
    }

    if (this.csmInput && this.csmDisplay) {
      this.csmInput.addEventListener('input', (e) => {
        this.csmDisplay.textContent = e.target.value.toUpperCase() || 'CSM #2026-GT500';
      });
    }
  }

  initLineage() {
    const eraTabs = document.querySelectorAll('.lineage-tab');
    const titleEl = document.getElementById('lineage-title');
    const descEl = document.getElementById('lineage-desc');
    const specsEl = document.getElementById('lineage-specs');

    const lineageData = {
      '1965': {
        title: '1965 SHELBY GT350 COMPETITION',
        desc: 'Carroll Shelby transformed the Ford Mustang from a "secretary\'s car" into an SCCA B-Production national champion. Powered by the 289ci K-code V8 producing 306 HP.',
        specs: '<span>POWER: 306 BHP</span> • <span>WEIGHT: 2,790 LBS</span> • <span>SCCA B-PROD CHAMPION</span>'
      },
      '1967': {
        title: '1967 SHELBY GT500 "ELEANOR"',
        desc: 'The birth of the big-block legend. Equipped with the legendary 428 cubic-inch Police Interceptor V8 topped with dual Holley four-barrel carburetors.',
        specs: '<span>POWER: 355 BHP</span> • <span>TORQUE: 420 LB-FT</span> • <span>428 DUAL-QUAD V8</span>'
      },
      '2020': {
        title: '2020-2022 SHELBY GT500 "PREDATOR"',
        desc: 'The fastest, most aerodynamically advanced street-legal Mustang ever engineered. Featuring the inverted Eaton 2.65L supercharger generating 12 PSI and 7-speed dual clutch.',
        specs: '<span>POWER: 760 BHP</span> • <span>TORQUE: 625 LB-FT</span> • <span>TOP SPEED: 180 MPH</span>'
      },
      '2024': {
        title: '2024+ SHELBY GT500 CODE RED (TWIN TURBO)',
        desc: 'An untamed track monster built by Shelby American. Twin-turbocharged 5.2L V8 running on E85 fuel delivering an astonishing 1,300+ wheel horsepower and 1,000 lb-ft torque.',
        specs: '<span>POWER: 1,300+ BHP</span> • <span>TORQUE: 1,000 LB-FT</span> • <span>CARBON BODY</span>'
      }
    };

    eraTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        eraTabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        const era = tab.getAttribute('data-era');
        const data = lineageData[era];
        if (data && titleEl && descEl && specsEl) {
          titleEl.textContent = data.title;
          descEl.textContent = data.desc;
          specsEl.innerHTML = data.specs;
        }
      });
    });
  }
}

// ============================================================================
// GLOBAL DOM CONTROLS & LIFECYCLE BOOTSTRAP
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  // 1. Audio Toggle
  const audioBtn = document.getElementById('audio-toggle-btn');
  const audioLabel = document.getElementById('audio-label');
  if (audioBtn) {
    audioBtn.addEventListener('click', () => {
      const active = audioEngine.toggleMute();
      if (active) {
        audioBtn.classList.add('active');
        if (audioLabel) audioLabel.textContent = 'SOUND: ACTIVE (760HP)';
      } else {
        audioBtn.classList.remove('active');
        if (audioLabel) audioLabel.textContent = 'SOUND: MUTED';
      }
    });
  }

  // Keyboard shortcut 'M' to mute/unmute
  window.addEventListener('keydown', (e) => {
    if ((e.key === 'm' || e.key === 'M') && document.activeElement.tagName !== 'INPUT') {
      if (audioBtn) audioBtn.click();
    }
  });

  // 2. Initialize Motion Graphic 1: Wind Tunnel
  const windTunnel = new AeroWindTunnel('aero-canvas');

  // Wind tunnel buttons
  const speedBtns = document.querySelectorAll('[data-speed]');
  speedBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      speedBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      windTunnel.setSpeed(parseInt(btn.getAttribute('data-speed'), 10));
    });
  });

  const btnStream = document.getElementById('btn-mode-stream');
  const btnPressure = document.getElementById('btn-mode-pressure');
  const btnVortex = document.getElementById('btn-mode-vortex');
  const modeBtns = [btnStream, btnPressure, btnVortex];

  if (btnStream) {
    btnStream.addEventListener('click', () => {
      modeBtns.forEach((b) => b && b.classList.remove('active'));
      btnStream.classList.add('active');
      windTunnel.setMode('stream');
    });
  }
  if (btnPressure) {
    btnPressure.addEventListener('click', () => {
      modeBtns.forEach((b) => b && b.classList.remove('active'));
      btnPressure.classList.add('active');
      windTunnel.setMode('pressure');
    });
  }
  if (btnVortex) {
    btnVortex.addEventListener('click', () => {
      modeBtns.forEach((b) => b && b.classList.remove('active'));
      btnVortex.classList.add('active');
      windTunnel.setMode('vortex');
    });
  }

  const wingSlider = document.getElementById('wing-angle-slider');
  if (wingSlider) {
    wingSlider.addEventListener('input', (e) => {
      windTunnel.setWingAngle(parseFloat(e.target.value));
    });
  }

  // 3. Initialize Motion Graphic 2: Powertrain Dyno
  const dynoEngine = new PowertrainDynoEngine();

  // 4. Initialize Motion Graphic 3: MagneRide Chassis
  const chassisEngine = new MagneRideChassisEngine();

  // 5. Initialize Studio Configurator
  const studioConfig = new StudioConfigurator();

  // 6. Initialize Heritage Registry
  const heritage = new HeritageRegistryManager();

  console.log('🏁 Shelby Mustang GT500 Experience 100% Initialized.');
});
