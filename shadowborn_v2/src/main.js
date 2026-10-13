/**
 * SHADOWBORN V2 - Main Game Runtime
 * Complete 3D Anime Sorcerer vs Cursed Demon Combat Engine
 * Three.js, Procedural Rigging & Skeletal Animation, Continuous Gesture Movement,
 * Web Audio Synthesizer, Dynamic Camera Tracking & Arena Boundaries.
 */

import {
    COMBAT_CONSTANTS,
    createInitialCombatState,
    executePlayerAbility,
    setInfinityGuard,
    executeDodge,
    executeEnemyAttack,
    updateCombatTimers,
    calculateMovement,
    clampToArena,
    calculateDodgeDisplacement,
    mapHandPositionToMovement,
    classifyHandLandmarks
} from './combatRules.js';

// ==========================================
// 1. COMBAT STATE & GLOBALS
// ==========================================
let combatState = createInitialCombatState();

let scene, camera, renderer, clock;
let playerGroup, sorcererBones = {};
let demonGroup, demonBones = {}, demonSlamRing;
let arenaRuneMesh, cameraTarget = new THREE.Vector3(0, 1.5, 0);
let activeProjectiles = [], activeEffects = [];
let shakeDuration = 0, shakeIntensity = 0;

// Locomotion & Input
const keys = {
    KeyW: false, KeyS: false, KeyA: false, KeyD: false,
    ShiftLeft: false, ShiftRight: false
};
let playerAnimState = 'IDLE'; // IDLE, WALK, SPRINT, PUNCH, BLUE, RED, PURPLE, GUARD, DODGE, HIT
let animTimer = 0;

// Gesture State
let webcamStream = null;
let webcamVideo = null;
let trackingCanvas = null, trackingCtx = null;
let isWebcamEnabled = false;
let handNormPos = { x: null, y: null };
let gestureDebounceTimer = 0;
let lastDetectedGesture = 'NONE';
let cameraStatusText = 'OFFLINE';

// ==========================================
// 2. PROCEDURAL SOUND SYNTHESIZER
// ==========================================
class SoundFX {
    constructor() { this.ctx = null; }
    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
    }
    playPunch() {
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(now); osc.stop(now + 0.18);
    }
    playBlueOrb() {
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.linearRampToValueAtTime(750, now + 0.3);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(now); osc.stop(now + 0.35);
    }
    playRedBlast() {
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.4);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(now); osc.stop(now + 0.4);
    }
    playHollowPurple() {
        this.init();
        const now = this.ctx.currentTime;
        [60, 120, 240, 480].forEach((f, i) => {
            const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
            osc.type = (i % 2 === 0) ? 'sawtooth' : 'sine';
            osc.frequency.setValueAtTime(f, now);
            osc.frequency.exponentialRampToValueAtTime(f * 2.5, now + 0.3);
            osc.frequency.exponentialRampToValueAtTime(30, now + 1.0);
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(now); osc.stop(now + 1.0);
        });
    }
    playGuard() {
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1250, now + 0.25);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(now); osc.stop(now + 0.25);
    }
    playDodge() {
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(now); osc.stop(now + 0.15);
    }
    playDemonRoar() {
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(85, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.4);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(now); osc.stop(now + 0.45);
    }
    playVictory() {
        this.init();
        const now = this.ctx.currentTime;
        [261.63, 329.63, 392.00, 523.25].forEach((f, i) => {
            const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, now + i * 0.08);
            gain.gain.setValueAtTime(0.25, now + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(now + i * 0.08); osc.stop(now + 1.6);
        });
    }
    playDefeat() {
        this.init();
        const now = this.ctx.currentTime;
        [196.00, 185.00, 174.61, 164.81].forEach((f, i) => {
            const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(f, now + i * 0.15);
            gain.gain.setValueAtTime(0.3, now + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(now + i * 0.15); osc.stop(now + 2.0);
        });
    }
}
const sfx = new SoundFX();

// ==========================================
// 3. 3D SCENE & RIGGED CHARACTER SETUP
// ==========================================
export function initGame() {
    const container = document.getElementById('canvas-container');
    const width = window.innerWidth, height = window.innerHeight;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06050e);
    scene.fog = new THREE.FogExp2(0x080614, 0.032);

    camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 100);
    camera.position.set(0, 3.8, 8.2);

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    renderer.domElement.id = 'game-canvas';

    clock = new THREE.Clock();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x2d1f47, 1.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xa855f7, 1.8);
    dirLight.position.set(6, 14, 8);
    dirLight.castShadow = true;
    scene.add(dirLight);

    build3DArena();
    buildGojoAnimeSorcerer();
    buildCursedDemon();

    setupInputListeners();
    setupWebcamUI();

    window.addEventListener('resize', onWindowResize);
    requestAnimationFrame(gameLoop);
}

function build3DArena() {
    // Stone Floor
    const floorGeo = new THREE.CircleGeometry(COMBAT_CONSTANTS.ARENA.RADIUS + 1.5, 48);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x110f1e, roughness: 0.8, metalness: 0.2 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Arena Perimeter Wall
    const wallGeo = new THREE.RingGeometry(COMBAT_CONSTANTS.ARENA.RADIUS, COMBAT_CONSTANTS.ARENA.RADIUS + 0.6, 48);
    const wallMat = new THREE.MeshBasicMaterial({ color: 0x7c3aed, side: THREE.DoubleSide });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.rotation.x = -Math.PI / 2;
    wall.position.y = 0.04;
    scene.add(wall);

    // Arcane floor runes
    const runeCanvas = document.createElement('canvas');
    runeCanvas.width = 1024; runeCanvas.height = 1024;
    const ctx = runeCanvas.getContext('2d');
    ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(512, 512, 450, 0, Math.PI * 2);
    ctx.arc(512, 512, 380, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        ctx.moveTo(512 + Math.cos(a) * 380, 512 + Math.sin(a) * 380);
        ctx.lineTo(512 + Math.cos(a + Math.PI * 0.75) * 380, 512 + Math.sin(a + Math.PI * 0.75) * 380);
    }
    ctx.stroke();

    const runeTex = new THREE.CanvasTexture(runeCanvas);
    const runeGeo = new THREE.PlaneGeometry(24, 24);
    const runeMat = new THREE.MeshBasicMaterial({ map: runeTex, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending });
    arenaRuneMesh = new THREE.Mesh(runeGeo, runeMat);
    arenaRuneMesh.rotation.x = -Math.PI / 2;
    arenaRuneMesh.position.y = 0.02;
    scene.add(arenaRuneMesh);

    // Pillars with glowing crystals
    for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI * 2) / 10;
        const x = Math.cos(angle) * (COMBAT_CONSTANTS.ARENA.RADIUS + 0.8);
        const z = Math.sin(angle) * (COMBAT_CONSTANTS.ARENA.RADIUS + 0.8);

        const pillarGeo = new THREE.CylinderGeometry(0.55, 0.8, 9, 8);
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0x1b172a, roughness: 0.9 });
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(x, 4.5, z);
        scene.add(pillar);

        const cryGeo = new THREE.OctahedronGeometry(0.45);
        const cryMat = new THREE.MeshBasicMaterial({ color: (i % 2 === 0) ? 0x38bdf8 : 0xc084fc });
        const cry = new THREE.Mesh(cryGeo, cryMat);
        cry.position.set(x, 9.4, z);
        scene.add(cry);
    }
}

/**
 * Highly Detailed White-Haired Anime Sorcerer with Articulated Hierarchy
 */
function buildGojoAnimeSorcerer() {
    playerGroup = new THREE.Group();
    playerGroup.position.set(combatState.player.position.x, 0, combatState.player.position.z);

    const uniformMat = new THREE.MeshStandardMaterial({ color: 0x0c0b14, roughness: 0.5, metalness: 0.3 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffedd5, roughness: 0.3 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.1 });
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x050508, roughness: 0.6 });

    // Pelvis (root of movement)
    const pelvisGeo = new THREE.BoxGeometry(0.5, 0.25, 0.3);
    const pelvis = new THREE.Mesh(pelvisGeo, uniformMat);
    pelvis.position.y = 1.05;
    playerGroup.add(pelvis);
    sorcererBones.pelvis = pelvis;

    // Torso / Chest
    const chestGeo = new THREE.CylinderGeometry(0.38, 0.28, 0.7, 10);
    const chest = new THREE.Mesh(chestGeo, uniformMat);
    chest.position.y = 0.45;
    pelvis.add(chest);
    sorcererBones.chest = chest;

    // High Standing Collar
    const collarGeo = new THREE.CylinderGeometry(0.24, 0.26, 0.32, 10, 1, true);
    const collar = new THREE.Mesh(collarGeo, uniformMat);
    collar.position.y = 0.45;
    chest.add(collar);

    // Head
    const headGeo = new THREE.SphereGeometry(0.22, 16, 16);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 0.48;
    chest.add(head);
    sorcererBones.head = head;

    // Expressive Glowing Blue "Six Eyes"
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const lEye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), eyeMat);
    lEye.position.set(-0.08, 0.02, -0.2);
    const rEye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), eyeMat);
    rEye.position.set(0.08, 0.02, -0.2);
    head.add(lEye); head.add(rEye);

    // Dark Blindfold Wrap
    const blindfoldGeo = new THREE.CylinderGeometry(0.23, 0.23, 0.08, 16);
    const blindfold = new THREE.Mesh(blindfoldGeo, new THREE.MeshBasicMaterial({ color: 0x09090b }));
    blindfold.position.set(0, 0.02, 0);
    head.add(blindfold);

    // Multi-Layer Spiky White Hair Locks
    const hairGroup = new THREE.Group();
    // Forehead bangs
    for (let i = -2; i <= 2; i++) {
        const bang = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.26, 5), hairMat);
        bang.position.set(i * 0.07, 0.1, -0.18);
        bang.rotation.set(-0.5, 0, i * 0.25);
        hairGroup.add(bang);
    }
    // Crown Spikes
    for (let a = 0; a < 8; a++) {
        const ang = (a * Math.PI * 2) / 8;
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.38, 5), hairMat);
        spike.position.set(Math.cos(ang) * 0.14, 0.22, Math.sin(ang) * 0.14);
        spike.rotation.set(Math.sin(ang) * 0.4, 0, -Math.cos(ang) * 0.4);
        hairGroup.add(spike);
    }
    head.add(hairGroup);

    // ARMS & HANDS (Articulated Left & Right)
    // Left Arm
    const shoulderL = new THREE.Group();
    shoulderL.position.set(-0.46, 0.32, 0);
    chest.add(shoulderL);
    sorcererBones.shoulderL = shoulderL;

    const armGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.42, 8);
    const upperArmL = new THREE.Mesh(armGeo, uniformMat);
    upperArmL.position.y = -0.21;
    shoulderL.add(upperArmL);

    const forearmL = new THREE.Group();
    forearmL.position.y = -0.21;
    upperArmL.add(forearmL);
    sorcererBones.forearmL = forearmL;

    const lowerArmL = new THREE.Mesh(armGeo, uniformMat);
    lowerArmL.position.y = -0.21;
    forearmL.add(lowerArmL);

    const handL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), skinMat);
    handL.position.y = -0.24;
    forearmL.add(handL);
    sorcererBones.handL = handL;

    // Right Arm
    const shoulderR = new THREE.Group();
    shoulderR.position.set(0.46, 0.32, 0);
    chest.add(shoulderR);
    sorcererBones.shoulderR = shoulderR;

    const upperArmR = new THREE.Mesh(armGeo, uniformMat);
    upperArmR.position.y = -0.21;
    shoulderR.add(upperArmR);

    const forearmR = new THREE.Group();
    forearmR.position.y = -0.21;
    upperArmR.add(forearmR);
    sorcererBones.forearmR = forearmR;

    const lowerArmR = new THREE.Mesh(armGeo, uniformMat);
    lowerArmR.position.y = -0.21;
    forearmR.add(lowerArmR);

    const handR = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), skinMat);
    handR.position.y = -0.24;
    forearmR.add(handR);
    sorcererBones.handR = handR;

    // LEGS & BOOTS (Articulated Left & Right)
    const legGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.5, 8);
    // Left Leg
    const hipL = new THREE.Group();
    hipL.position.set(-0.18, -0.1, 0);
    pelvis.add(hipL);
    sorcererBones.hipL = hipL;

    const thighL = new THREE.Mesh(legGeo, uniformMat);
    thighL.position.y = -0.25;
    hipL.add(thighL);

    const kneeL = new THREE.Group();
    kneeL.position.y = -0.25;
    thighL.add(kneeL);
    sorcererBones.kneeL = kneeL;

    const calfL = new THREE.Mesh(legGeo, uniformMat);
    calfL.position.y = -0.25;
    kneeL.add(calfL);

    const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.15, 0.28), bootMat);
    bootL.position.set(0, -0.3, -0.05);
    kneeL.add(bootL);

    // Right Leg
    const hipR = new THREE.Group();
    hipR.position.set(0.18, -0.1, 0);
    pelvis.add(hipR);
    sorcererBones.hipR = hipR;

    const thighR = new THREE.Mesh(legGeo, uniformMat);
    thighR.position.y = -0.25;
    hipR.add(thighR);

    const kneeR = new THREE.Group();
    kneeR.position.y = -0.25;
    thighR.add(kneeR);
    sorcererBones.kneeR = kneeR;

    const calfR = new THREE.Mesh(legGeo, uniformMat);
    calfR.position.y = -0.25;
    kneeR.add(calfR);

    const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.15, 0.28), bootMat);
    bootR.position.set(0, -0.3, -0.05);
    kneeR.add(bootR);

    // Infinity Guard Shimmering Barrier Sphere
    const barrierMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.0,
        roughness: 0.1,
        transmission: 0.85,
        blending: THREE.AdditiveBlending
    });
    const barrier = new THREE.Mesh(new THREE.SphereGeometry(1.65, 24, 24), barrierMat);
    barrier.position.y = 1.1;
    playerGroup.add(barrier);
    sorcererBones.barrier = barrier;

    scene.add(playerGroup);
}

function buildCursedDemon() {
    demonGroup = new THREE.Group();
    demonGroup.position.set(combatState.enemy.position.x, 0, combatState.enemy.position.z);

    const demonMat = new THREE.MeshStandardMaterial({ color: 0x220c15, roughness: 0.6, metalness: 0.3 });
    const hornMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.2 });

    // Torso
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.45, 1.8, 10), demonMat);
    torso.position.y = 1.7;
    demonGroup.add(torso);
    demonBones.torso = torso;

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.7, 0.65), demonMat);
    head.position.y = 2.85;
    demonGroup.add(head);

    // Horns
    const lHorn = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.9, 8), hornMat);
    lHorn.position.set(-0.4, 3.4, 0); lHorn.rotation.z = 0.4;
    const rHorn = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.9, 8), hornMat);
    rHorn.position.set(0.4, 3.4, 0); rHorn.rotation.z = -0.4;
    demonGroup.add(lHorn); demonGroup.add(rHorn);

    // Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const lEye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), eyeMat);
    lEye.position.set(-0.18, 2.9, 0.34);
    const rEye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), eyeMat);
    rEye.position.set(0.18, 2.9, 0.34);
    demonGroup.add(lEye); demonGroup.add(rEye);

    // Arms
    const lArm = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 1.4, 8), demonMat);
    lArm.position.set(-0.95, 1.4, 0.2);
    const rArm = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 1.4, 8), demonMat);
    rArm.position.set(0.95, 1.4, 0.2);
    demonGroup.add(lArm); demonGroup.add(rArm);
    demonBones.lArm = lArm;
    demonBones.rArm = rArm;

    // Ground Slam Telegraph Ring
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.0, side: THREE.DoubleSide });
    demonSlamRing = new THREE.Mesh(new THREE.RingGeometry(0.2, COMBAT_CONSTANTS.ENEMY_ATTACKS.GROUND_SLAM.range, 32), ringMat);
    demonSlamRing.rotation.x = -Math.PI / 2;
    demonSlamRing.position.y = 0.05;
    scene.add(demonSlamRing);

    scene.add(demonGroup);
}

// ==========================================
// 4. COMBAT ACTION TRIGGERS & ABILITIES
// ==========================================
export function triggerPlayerAbility(abilityKey) {
    if (combatState.status !== 'PLAYING') return;

    const dist = playerGroup.position.distanceTo(demonGroup.position);
    const res = executePlayerAbility(combatState, abilityKey, dist);
    if (!res.success) return;

    playerAnimState = abilityKey;
    animTimer = 0.45;

    switch (abilityKey) {
        case 'AURA_PUNCH':
            sfx.playPunch();
            if (res.hit) {
                spawnDamageText(res.damage, demonGroup.position, 'dmg-punch');
                demonGroup.position.z -= res.knockback;
                shakeCamera(0.18, 0.22);
            }
            break;

        case 'BLUE_ORB':
            sfx.playBlueOrb();
            spawnProjectile('BLUE', playerGroup.position, demonGroup.position, () => {
                if (res.hit) {
                    spawnDamageText(res.damage, demonGroup.position, 'dmg-blue');
                    demonGroup.position.z += res.pullForce * 0.4;
                    shakeCamera(0.2, 0.25);
                }
            });
            break;

        case 'RED_BLAST':
            sfx.playRedBlast();
            spawnProjectile('RED', playerGroup.position, demonGroup.position, () => {
                if (res.hit) {
                    spawnDamageText(res.damage, demonGroup.position, 'dmg-red');
                    demonGroup.position.z -= res.knockback * 0.45;
                    shakeCamera(0.25, 0.32);
                }
            });
            break;

        case 'HOLLOW_PURPLE':
            sfx.playHollowPurple();
            spawnProjectile('PURPLE', playerGroup.position, demonGroup.position, () => {
                if (res.hit) {
                    spawnDamageText(res.damage, demonGroup.position, 'dmg-purple');
                    demonGroup.position.z -= 2.4;
                    shakeCamera(0.55, 0.65);
                }
            });
            break;
    }

    updateHUD();
}

export function triggerDodge() {
    if (combatState.status !== 'PLAYING') return;
    const res = executeDodge(combatState);
    if (res.success) {
        sfx.playDodge();
        playerAnimState = 'DODGE';
        animTimer = 0.35;

        // Determine input direction or dodge backward
        let inputDir = { x: 0, z: 1 };
        if (keys.KeyW) inputDir.z = -1;
        if (keys.KeyS) inputDir.z = 1;
        if (keys.KeyA) inputDir.x = -1;
        if (keys.KeyD) inputDir.x = 1;

        const target = calculateDodgeDisplacement(playerGroup.position, inputDir, res.distance);
        playerGroup.position.x = target.x;
        playerGroup.position.z = target.z;

        shakeCamera(0.08, 0.08);
        updateHUD();
    }
}

export function toggleInfinityGuard() {
    if (combatState.status !== 'PLAYING') return;
    const newState = !combatState.player.isGuarding;
    setInfinityGuard(combatState, newState);
    if (newState) sfx.playGuard();
    updateHUD();
}

function spawnProjectile(type, startPos, targetPos, onHit) {
    const geo = new THREE.SphereGeometry(type === 'PURPLE' ? 0.75 : 0.32, 16, 16);
    const color = type === 'BLUE' ? 0x38bdf8 : (type === 'RED' ? 0xef4444 : 0xc084fc);
    const mat = new THREE.MeshBasicMaterial({ color, wireframe: type === 'PURPLE' });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(startPos);
    mesh.position.y += 1.35;
    scene.add(mesh);

    activeProjectiles.push({
        mesh,
        target: targetPos.clone().add(new THREE.Vector3(0, 1.4, 0)),
        speed: type === 'PURPLE' ? 14 : 22,
        onHit
    });
}

// ==========================================
// 5. ENEMY AI & COMBAT CYCLE
// ==========================================
let enemyActionTimer = 0;
let isSlamTelegraphing = false;
let slamTelegraphTimer = 0;

function updateEnemyAI(delta) {
    if (combatState.status !== 'PLAYING') return;
    if (combatState.enemy.hp <= 0) return;

    const dist = demonGroup.position.distanceTo(playerGroup.position);

    // Ground slam telegraphing
    if (isSlamTelegraphing) {
        slamTelegraphTimer -= delta;
        demonSlamRing.position.copy(demonGroup.position);
        demonSlamRing.position.y = 0.05;
        demonSlamRing.material.opacity = 0.85;

        if (slamTelegraphTimer <= 0) {
            isSlamTelegraphing = false;
            demonSlamRing.material.opacity = 0.0;
            sfx.playDemonRoar();
            const res = executeEnemyAttack(combatState, 'GROUND_SLAM', dist);
            shakeCamera(0.42, 0.45);
            handleEnemyAttackResult(res);
        }
        return;
    }

    // Dynamic pursuit / strafe
    if (dist > 3.2) {
        const dir = new THREE.Vector3().subVectors(playerGroup.position, demonGroup.position).normalize();
        demonGroup.position.x += dir.x * COMBAT_CONSTANTS.ENEMY.MOVE_SPEED * delta;
        demonGroup.position.z += dir.z * COMBAT_CONSTANTS.ENEMY.MOVE_SPEED * delta;
    }

    enemyActionTimer -= delta;
    if (enemyActionTimer <= 0) {
        enemyActionTimer = 2.0 + Math.random() * 1.5;

        if (dist <= 2.8) {
            if (Math.random() < 0.4) {
                const res = executeEnemyAttack(combatState, 'COMBO_STRIKE', dist);
                sfx.playPunch();
                handleEnemyAttackResult(res);
            } else {
                const res = executeEnemyAttack(combatState, 'CLAW', dist);
                sfx.playPunch();
                handleEnemyAttackResult(res);
            }
        } else if (dist <= 5.5 && Math.random() < 0.5) {
            isSlamTelegraphing = true;
            slamTelegraphTimer = COMBAT_CONSTANTS.ENEMY_ATTACKS.GROUND_SLAM.telegraphTime;
            document.getElementById('boss-state-tag').innerText = 'TELEGRAPH: GROUND SLAM';
        } else {
            spawnCursedProjectile();
        }
    }
}

function spawnCursedProjectile() {
    const geo = new THREE.SphereGeometry(0.32, 12, 12);
    const mat = new THREE.MeshBasicMaterial({ color: 0xdc2626 });
    const pMesh = new THREE.Mesh(geo, mat);
    pMesh.position.copy(demonGroup.position).add(new THREE.Vector3(0, 1.8, 0));
    scene.add(pMesh);

    activeProjectiles.push({
        mesh: pMesh,
        target: playerGroup.position.clone().add(new THREE.Vector3(0, 1.2, 0)),
        speed: 11,
        onHit: () => {
            const dist = pMesh.position.distanceTo(playerGroup.position);
            const res = executeEnemyAttack(combatState, 'CURSED_PROJECTILE', dist);
            handleEnemyAttackResult(res);
        }
    });
}

function handleEnemyAttackResult(res) {
    if (res.blocked) {
        spawnDamageText('BLOCKED!', playerGroup.position, 'dmg-blocked');
        sfx.playGuard();
    } else if (res.hit) {
        spawnDamageText(`-${res.damage}`, playerGroup.position, 'dmg-player');
        shakeCamera(0.2, 0.25);
    }
    updateHUD();
}

function spawnDamageText(text, worldPos, cssClass) {
    const elem = document.createElement('div');
    elem.className = `combat-dmg ${cssClass}`;
    elem.innerText = typeof text === 'number' ? `-${text}` : text;
    document.body.appendChild(elem);

    const vector = worldPos.clone().project(camera);
    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight;
    elem.style.left = `${x - 25}px`;
    elem.style.top = `${y - 30}px`;

    setTimeout(() => elem.remove(), 850);
}

function shakeCamera(duration, intensity) {
    shakeDuration = duration;
    shakeIntensity = intensity;
}

// ==========================================
// 6. PROCEDURAL SKELETAL ANIMATIONS
// ==========================================
function updateSkeletalAnimations(delta, elapsedTime, isMoving) {
    if (animTimer > 0) animTimer -= delta;

    const b = sorcererBones;
    if (!b.shoulderR) return;

    if (animTimer <= 0) {
        if (isMoving) {
            playerAnimState = (keys.ShiftLeft || keys.ShiftRight) ? 'SPRINT' : 'WALK';
        } else {
            playerAnimState = combatState.player.isGuarding ? 'GUARD' : 'IDLE';
        }
    }

    const freq = (playerAnimState === 'SPRINT') ? 12 : 7;
    const limbSwing = Math.sin(elapsedTime * freq) * (playerAnimState === 'SPRINT' ? 0.75 : 0.45);

    switch (playerAnimState) {
        case 'IDLE':
            b.chest.position.y = 0.45 + Math.sin(elapsedTime * 2.5) * 0.02;
            b.shoulderL.rotation.set(0.1, 0, -0.15);
            b.shoulderR.rotation.set(0.1, 0, 0.15);
            b.hipL.rotation.set(0, 0, 0);
            b.hipR.rotation.set(0, 0, 0);
            break;

        case 'WALK':
        case 'SPRINT':
            b.hipL.rotation.x = limbSwing;
            b.hipR.rotation.x = -limbSwing;
            b.shoulderL.rotation.x = -limbSwing * 0.8;
            b.shoulderR.rotation.x = limbSwing * 0.8;
            b.chest.position.y = 0.45 + Math.abs(Math.sin(elapsedTime * freq)) * 0.05;
            break;

        case 'AURA_PUNCH':
            b.shoulderR.rotation.set(-1.4, -0.3, 0); // Thrust right arm straight forward
            b.shoulderL.rotation.set(0.4, 0.4, -0.3); // Guard left
            break;

        case 'BLUE_ORB':
            b.shoulderL.rotation.set(-1.2, 0.5, 0.2); // Singularity focus
            break;

        case 'RED_BLAST':
            b.shoulderR.rotation.set(-1.3, -0.2, 0); // Blast forward
            break;

        case 'HOLLOW_PURPLE':
            // Two hands converge together in front of chest
            b.shoulderL.rotation.set(-1.1, 0.45, 0);
            b.shoulderR.rotation.set(-1.1, -0.45, 0);
            break;

        case 'GUARD':
            b.shoulderL.rotation.set(-0.6, 0.6, 0);
            b.shoulderR.rotation.set(0.2, -0.2, 0);
            break;
    }
}

// ==========================================
// 7. WEBCAM CONTROLLER & GESTURE PIPELINE
// ==========================================
function setupWebcamUI() {
    webcamVideo = document.getElementById('webcam-video');
    trackingCanvas = document.getElementById('tracking-canvas');
    if (trackingCanvas) trackingCtx = trackingCanvas.getContext('2d');

    document.getElementById('btn-enable-camera')?.addEventListener('click', enableCamera);
    document.getElementById('btn-disable-camera')?.addEventListener('click', disableCamera);
}

async function enableCamera() {
    try {
        cameraStatusText = 'REQUESTING...';
        updateWebcamHUD();

        webcamStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 320, height: 240, facingMode: 'user' }
        });
        webcamVideo.srcObject = webcamStream;
        await webcamVideo.play();

        isWebcamEnabled = true;
        cameraStatusText = 'TRACKING ACTIVE';
        document.getElementById('status-dot').style.background = '#10b981';
        updateWebcamHUD();

        initMediaPipeOrOptical();
    } catch (err) {
        console.warn('Webcam permission denied or unavailable:', err);
        cameraStatusText = 'CAMERA DENIED (Keyboard Active)';
        document.getElementById('status-dot').style.background = '#ef4444';
        updateWebcamHUD();
    }
}

function disableCamera() {
    if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
        webcamStream = null;
    }
    isWebcamEnabled = false;
    handNormPos = { x: null, y: null };
    cameraStatusText = 'DISABLED (Keyboard Active)';
    document.getElementById('status-dot').style.background = '#f59e0b';
    if (trackingCtx) trackingCtx.clearRect(0, 0, trackingCanvas.width, trackingCanvas.height);
    updateWebcamHUD();
}

function initMediaPipeOrOptical() {
    if (window.Hands) {
        const hands = new window.Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });
        hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.6 });
        hands.onResults(onMediaPipeResults);

        async function processFrame() {
            if (isWebcamEnabled && webcamVideo.readyState >= 2) {
                await hands.send({ image: webcamVideo });
            }
            if (isWebcamEnabled) requestAnimationFrame(processFrame);
        }
        processFrame();
    } else {
        // Fallback optical centroid tracking
        setupOpticalCentroidFallback();
    }
}

function onMediaPipeResults(results) {
    if (!isWebcamEnabled || !trackingCtx) return;
    trackingCtx.clearRect(0, 0, trackingCanvas.width, trackingCanvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const hand = results.multiHandLandmarks[0];
        const wrist = hand[0];
        handNormPos = { x: wrist.x, y: wrist.y };

        // Draw landmarks
        trackingCtx.fillStyle = '#38bdf8';
        for (const lm of hand) {
            trackingCtx.beginPath();
            trackingCtx.arc(lm.x * trackingCanvas.width, lm.y * trackingCanvas.height, 3, 0, Math.PI * 2);
            trackingCtx.fill();
        }

        const isTwoHands = results.multiHandLandmarks.length >= 2;
        const gesture = classifyHandLandmarks(hand, isTwoHands);
        lastDetectedGesture = gesture;

        // Combat Trigger Debouncing
        if (gesture !== 'NONE' && gestureDebounceTimer <= 0) {
            if (gesture === 'AURA_PUNCH') triggerPlayerAbility('AURA_PUNCH');
            if (gesture === 'BLUE_ORB') triggerPlayerAbility('BLUE_ORB');
            if (gesture === 'INFINITY_GUARD') toggleInfinityGuard();
            if (gesture === 'HOLLOW_PURPLE') triggerPlayerAbility('HOLLOW_PURPLE');
            gestureDebounceTimer = COMBAT_CONSTANTS.GESTURES.DEBOUNCE_TIME;
        }
    } else {
        handNormPos = { x: null, y: null };
        lastDetectedGesture = 'NO_HAND';
    }

    updateWebcamHUD();
}

function setupOpticalCentroidFallback() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 80; tempCanvas.height = 60;
    const tempCtx = tempCanvas.getContext('2d');
    let prevData = null;

    function step() {
        if (isWebcamEnabled && webcamVideo.readyState >= 2) {
            tempCtx.drawImage(webcamVideo, 0, 0, 80, 60);
            const frame = tempCtx.getImageData(0, 0, 80, 60);
            const d = frame.data;
            if (prevData) {
                let count = 0, sumX = 0, sumY = 0;
                for (let i = 0; i < d.length; i += 4) {
                    const diff = Math.abs(d[i] - prevData[i]) + Math.abs(d[i+1] - prevData[i+1]) + Math.abs(d[i+2] - prevData[i+2]);
                    if (diff > 80) {
                        count++;
                        const px = (i / 4) % 80;
                        const py = Math.floor((i / 4) / 80);
                        sumX += px; sumY += py;
                    }
                }
                if (count > 250) {
                    handNormPos = { x: (sumX / count) / 80, y: (sumY / count) / 60 };
                    lastDetectedGesture = count > 1200 ? 'AURA_PUNCH' : 'HAND_TRACKED';
                    if (lastDetectedGesture === 'AURA_PUNCH' && gestureDebounceTimer <= 0) {
                        triggerPlayerAbility('AURA_PUNCH');
                        gestureDebounceTimer = COMBAT_CONSTANTS.GESTURES.DEBOUNCE_TIME;
                    }
                } else {
                    handNormPos = { x: null, y: null };
                    lastDetectedGesture = 'NO_HAND';
                }
            }
            prevData = d;
            updateWebcamHUD();
        }
        if (isWebcamEnabled) requestAnimationFrame(step);
    }
    step();
}

function updateWebcamHUD() {
    const statusLabel = document.getElementById('webcam-status-label');
    const gestureLabel = document.getElementById('webcam-gesture-label');
    const moveLabel = document.getElementById('webcam-move-label');

    if (statusLabel) statusLabel.innerText = cameraStatusText;
    if (gestureLabel) gestureLabel.innerText = `GESTURE: ${lastDetectedGesture}`;

    if (moveLabel) {
        const moveData = mapHandPositionToMovement(handNormPos.x, handNormPos.y);
        moveLabel.innerText = `NAV: ${moveData.status}`;
    }
}

// ==========================================
// 8. HUD & UI MANAGEMENT
// ==========================================
function updateHUD() {
    const p = combatState.player;
    document.getElementById('player-hp-fill').style.width = `${(p.hp / p.maxHp) * 100}%`;
    document.getElementById('player-hp-label').innerText = `${Math.round(p.hp)} / ${p.maxHp}`;
    document.getElementById('player-energy-fill').style.width = `${(p.energy / p.maxEnergy) * 100}%`;
    document.getElementById('player-energy-label').innerText = `${Math.round(p.energy)} / ${p.maxEnergy}`;

    const guardBanner = document.getElementById('guard-active-banner');
    if (p.isGuarding) {
        guardBanner.style.display = 'block';
        if (sorcererBones.barrier) sorcererBones.barrier.material.opacity = 0.35;
    } else {
        guardBanner.style.display = 'none';
        if (sorcererBones.barrier) sorcererBones.barrier.material.opacity = 0.0;
    }

    const e = combatState.enemy;
    document.getElementById('boss-hp-fill').style.width = `${(e.hp / e.maxHp) * 100}%`;
    document.getElementById('boss-hp-label').innerText = `${Math.round(e.hp)} / ${e.maxHp}`;
    document.getElementById('boss-state-tag').innerText = e.state;

    updateCooldownCard('card-punch', p.cooldowns.AURA_PUNCH);
    updateCooldownCard('card-blue', p.cooldowns.BLUE_ORB);
    updateCooldownCard('card-red', p.cooldowns.RED_BLAST);
    updateCooldownCard('card-purple', p.cooldowns.HOLLOW_PURPLE);
    updateCooldownCard('card-dodge', p.cooldowns.DODGE);

    if (combatState.status === 'VICTORY') {
        document.getElementById('victory-modal').style.display = 'flex';
        sfx.playVictory();
    } else if (combatState.status === 'DEFEAT') {
        document.getElementById('defeat-modal').style.display = 'flex';
        sfx.playDefeat();
    }
}

function updateCooldownCard(cardId, cdValue) {
    const card = document.getElementById(cardId);
    if (!card) return;
    const overlay = card.querySelector('.cooldown-overlay');
    if (cdValue > 0) {
        card.classList.add('on-cooldown');
        if (overlay) overlay.innerText = `${cdValue.toFixed(1)}s`;
    } else {
        card.classList.remove('on-cooldown');
        if (overlay) overlay.innerText = '';
    }
}

export function resetGame() {
    combatState = createInitialCombatState();
    demonGroup.position.set(0, 0, -2.8);
    demonGroup.scale.set(1, 1, 1);
    playerGroup.position.set(0, 0, 2.5);

    document.getElementById('victory-modal').style.display = 'none';
    document.getElementById('defeat-modal').style.display = 'none';
    updateHUD();
}

// ==========================================
// 9. INPUT LISTENERS (KEYBOARD & MOUSE)
// ==========================================
function setupInputListeners() {
    window.addEventListener('keydown', (e) => {
        if (e.code in keys) keys[e.code] = true;

        if (e.code === 'KeyJ' || e.code === 'Digit1') triggerPlayerAbility('AURA_PUNCH');
        if (e.code === 'KeyK' || e.code === 'Digit2') triggerPlayerAbility('BLUE_ORB');
        if (e.code === 'KeyL' || e.code === 'Digit3') triggerPlayerAbility('RED_BLAST');
        if (e.code === 'KeyU' || e.code === 'Digit4') triggerPlayerAbility('HOLLOW_PURPLE');
        if (e.code === 'KeyI' || e.code === 'KeyC') toggleInfinityGuard();
        if (e.code === 'Space') triggerDodge();

        if (e.code === 'Escape') {
            combatState.status = (combatState.status === 'PLAYING') ? 'PAUSED' : 'PLAYING';
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.code in keys) keys[e.code] = false;
    });

    document.getElementById('card-punch')?.addEventListener('click', () => triggerPlayerAbility('AURA_PUNCH'));
    document.getElementById('card-blue')?.addEventListener('click', () => triggerPlayerAbility('BLUE_ORB'));
    document.getElementById('card-red')?.addEventListener('click', () => triggerPlayerAbility('RED_BLAST'));
    document.getElementById('card-purple')?.addEventListener('click', () => triggerPlayerAbility('HOLLOW_PURPLE'));
    document.getElementById('card-guard')?.addEventListener('click', () => toggleInfinityGuard());
    document.getElementById('card-dodge')?.addEventListener('click', () => triggerDodge());

    document.getElementById('btn-restart-victory')?.addEventListener('click', resetGame);
    document.getElementById('btn-restart-defeat')?.addEventListener('click', resetGame);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ==========================================
// 10. MAIN ANIMATION & GAME LOOP
// ==========================================
function gameLoop() {
    requestAnimationFrame(gameLoop);

    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    if (gestureDebounceTimer > 0) gestureDebounceTimer -= delta;

    updateCombatTimers(combatState, delta);
    updateEnemyAI(delta);

    // Combine Keyboard Input & Hand Gesture Continuous Movement
    let inputX = 0, inputZ = 0;
    if (keys.KeyW) inputZ -= 1;
    if (keys.KeyS) inputZ += 1;
    if (keys.KeyA) inputX -= 1;
    if (keys.KeyD) inputX += 1;

    // Gesture Continuous Movement Input
    if (isWebcamEnabled && handNormPos.x !== null) {
        const gestureMove = mapHandPositionToMovement(handNormPos.x, handNormPos.y);
        if (gestureMove.x !== 0) inputX = gestureMove.x;
        if (gestureMove.z !== 0) inputZ = gestureMove.z;
    }

    const isSprinting = keys.ShiftLeft || keys.ShiftRight;
    const move = calculateMovement({ x: inputX, z: inputZ }, isSprinting, delta);

    playerGroup.position.x += move.dx;
    playerGroup.position.z += move.dz;

    // Arena Boundary Clamp
    const clamped = clampToArena(playerGroup.position);
    playerGroup.position.x = clamped.x;
    playerGroup.position.z = clamped.z;

    // Smooth Character Rotation towards movement or enemy
    if (inputX !== 0 || inputZ !== 0) {
        const targetRot = Math.atan2(inputX, inputZ);
        playerGroup.rotation.y = THREE.MathUtils.lerp(playerGroup.rotation.y, targetRot, delta * 10);
    } else {
        // Face enemy when idle
        const dx = demonGroup.position.x - playerGroup.position.x;
        const dz = demonGroup.position.z - playerGroup.position.z;
        const faceEnemyRot = Math.atan2(dx, dz) + Math.PI;
        playerGroup.rotation.y = THREE.MathUtils.lerp(playerGroup.rotation.y, faceEnemyRot, delta * 6);
    }

    const isMoving = (move.dx !== 0 || move.dz !== 0);
    updateSkeletalAnimations(delta, elapsedTime, isMoving);

    // Dynamic Camera Tracking (keeps both fighters centered)
    cameraTarget.x = THREE.MathUtils.lerp(cameraTarget.x, (playerGroup.position.x + demonGroup.position.x) * 0.5, delta * 4);
    cameraTarget.z = THREE.MathUtils.lerp(cameraTarget.z, (playerGroup.position.z + demonGroup.position.z) * 0.5, delta * 4);

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, playerGroup.position.x * 0.4, delta * 4);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, playerGroup.position.z + 5.5, delta * 4);
    camera.lookAt(cameraTarget.x, 1.4, cameraTarget.z);

    // Camera Shake
    if (shakeDuration > 0) {
        shakeDuration -= delta;
        camera.position.x += (Math.random() - 0.5) * shakeIntensity;
        camera.position.y += (Math.random() - 0.5) * shakeIntensity;
    }

    // Active Projectiles Update
    for (let i = activeProjectiles.length - 1; i >= 0; i--) {
        const p = activeProjectiles[i];
        p.mesh.position.lerp(p.target, p.speed * delta);
        if (p.mesh.position.distanceTo(p.target) < 0.6) {
            p.onHit();
            scene.remove(p.mesh);
            activeProjectiles.splice(i, 1);
        }
    }

    // Arena Rune Rotation
    if (arenaRuneMesh) arenaRuneMesh.rotation.z += 0.0018;

    updateHUD();
    renderer.render(scene, camera);
}
