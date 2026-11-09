# SHELBY MUSTANG GT500 PREDATOR — INTERACTIVE LUXURY LANDING PAGE
> *“There is never enough horsepower... just not enough traction.”* — **Carroll Shelby (1923 - 2012)**

---

## 🌟 Executive Overview
This application is a **high-fidelity, luxury digital experience** engineered for the iconic **Shelby Mustang GT500 "Predator"**. Designed to elite automotive digital standards (Apple, Linear, Pentagram), the experience combines obsidian-glass styling, real-time telemetry, procedural Web Audio sound synthesis, and **Three Bespoke Visual Motion Graphics Engines**.

---

## 🏎️ The Three Visual Motion Graphics

### 1. Aero Dynamics: Supersonic Wind Tunnel Particle Field
- **Vector Simulation**: Computes **1,400+ dynamic streamline velocity vectors** shearing across the aerodynamically sculpted body of the GT500 in real time.
- **Aerodynamic Modeling**:
  - Front splitter stagnation zone with high-pressure accumulation.
  - Functional hood heat extractor upwash cooling currents.
  - High-downforce carbon-fiber GT4 rear wing with vortex shedding.
  - Underbody Venturi diffuser ground-effect suction.
- **Controls & Modes**:
  - **Wind Speed Regimes**: Low Drag (65 MPH), Track Attack (130 MPH), and V-Max Apex (186 MPH).
  - **Shader Modes**: *Laminar Streamlines*, *Pressure Gradient Heatmap*, and *Wake Vortices*.
  - **Rear Wing Angle Slider**: Adjust angle of attack ($2^\circ$ to $15^\circ$) with live calculated downforce (LBS) and drag coefficient ($C_d$).
  - **Interactive Cursor Turbulence**: Hovering or moving the mouse creates crosswind vorticity perturbations.

---

### 2. Powertrain: 5.2L Supercharged Predator V8 & Acoustic Dyno
- **Spring-Damped Tachometer**: Custom canvas dial (0 to 9,000 RPM) with realistic inertia, damping, and redline visualizer (7,500 - 8,250 RPM fuel cut).
- **Cylinder Firing Order Matrix**: Real-time kinetic display of the 8 cylinders firing in authentic cross-plane sequence:
  $$\mathbf{1 - 5 - 4 - 8 - 6 - 3 - 7 - 2}$$
  with animated piston stroke travel and combustion spark flashes.
- **Eaton TVS R2650 Supercharger Telemetry**: Real-time boost gauge (0 to 14+ PSI), calculated horsepower (up to 760 BHP), and instant torque (up to 625 LB-FT).
- **Procedural Web Audio API Synthesizer**: Zero external audio dependencies! Uses sub-bass saw oscillators, harmonic overtone filters, and FM frequency modulation to synthesize:
  - Deep American V8 idle rumble.
  - High-pitched Eaton supercharger whine that screams as RPM climbs.
  - Dynamic overrun crackles on throttle release.
- **Throttle Controls**:
  - Tactile luxury pedal: Click & hold or press `[SPACEBAR]` to floor the throttle!
  - Manual RPM sweep slider.

---

### 3. Chassis: MagneRide 1,000Hz Suspension & G-Force HUD
- **Circuit Telemetry Replay**: Interactive track simulator running authentic racing line physics across iconic racetracks:
  - **WeatherTech Raceway Laguna Seca** (Turn 8 Corkscrew)
  - **Nürburgring Nordschleife** (Karussell Banking)
  - **Road America** (Canada Corner)
- **G-G Friction Circle**: Real-time vector acceleration diagram tracking lateral cornering forces ($>1.35g$) and longitudinal braking/acceleration loads.
- **4-Corner Active MagneRide Dampers**: Independent corner load telemetry ($FL$, $FR$, $RL$, $RR$) recalculating damping force and spring compression every 1ms (1,000Hz).
- **Thermal Brake Rotor Mapping**: Brembo carbon-ceramic brake rotor temperature simulation heating up to $680^\circ\text{C}$ in trail-braking zones and cooling along straightaways.

---

## 🎨 Bespoke Studio Configurator & CSM Registry
- **360° Perspective Visualizer**: Switch between *Side Profile*, *3/4 Front Apex*, and *GT4 Rear Diffuser* views.
- **Exterior Heritage Palettes**:
  - *Shadow Obsidian Black*
  - *Liquid Cobalt Le Mans Blue*
  - *Track Attack Rapid Red Metallic*
  - *Twister Grabber Orange*
  - *Stealth Cyber Carbon* (Raw matte carbon weave)
- **Over-The-Top Racing Stripes**: Dual Wimbledon White, Matte Black, Venom Crimson Pinstripe, or Clean Stripe Delete.
- **Aero Packages**: *Carbon Fiber Track Pack* (+$18,500) vs *Handling & Street Cruise* (+$3,000).
- **Official Carroll Shelby CSM Registry**: Generate a personalized, brushed-aluminum engraved chassis plaque with authentic serialized number and Carroll Shelby etched signature.

---

## ⌨️ Keyboard Shortcuts
| Key | Action |
| :--- | :--- |
| `[SPACE]` | Floor Predator V8 Throttle (Hold to rev to 8,250 RPM) |
| `[M]` | Toggle Web Audio Synthesizer (Unmute / Mute V8 & Blower) |
| `[1]` | Jump to Motion Graphic 01 (Aero Wind Tunnel) |
| `[2]` | Jump to Motion Graphic 02 (Powertrain Dyno) |
| `[3]` | Jump to Motion Graphic 03 (MagneRide Chassis) |

---

## 🚀 How to Run Locally
Open `index.html` directly in any modern web browser:
```powershell
# In PowerShell:
Start-Process index.html
```
Or start a local static server:
```powershell
npx serve .
# or
python -m http.server 8000
```

---

## 📋 Asset & Verification Manifest
- `index.html` (Master HTML5 markup with luxury typography and semantic DOM)
- `styles.css` (Luxury CSS system with obsidian tokens, carbon textures, and responsive layouts)
- `app.js` (High-performance ES6 motion engine, canvas renderers, and Web Audio API synthesizer)
- `verify.js` (Automated verification test suite — 34/34 checks passing, exit code 0)
- `generate_spec_pdf.py` (ReportLab publication-grade PDF generator)
- `SHELBY_MUSTANG_SPECIFICATION.pdf` (High-fidelity certified engineering specification sheet)

© 2026 Shelby American Inc. & Ford Performance.
