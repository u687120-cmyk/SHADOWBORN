/**
 * SHADOWBORN: AWAKENING
 * Real-Time Webcam-Controlled 3D Dark Fantasy Action RPG
 * Complete Satoru Gojo Character Model, Full-Body Animation Controller,
 * Robust Normalized Gesture Recognition State Machine, and Complete Enemy AI Combat Loop.
 */

// ==========================================
// 1. GAME DATA & PROGRESSION STATE
// ==========================================
const GameState = {
    player: {
        maxHp: 100,
        hp: 100,
        maxEnergy: 100,
        energy: 100,
        energyRegen: 14, // per sec
        level: 1,
        xp: 0,
        xpNeeded: 100,
        rank: 'SPECIAL GRADE',
        title: 'Limitless Sorcerer (Satoru Gojo)',
        attackMultiplier: 1.0,
        isGuarding: false,
        isDodging: false,
        isAwakened: false,
        blindfoldRemoved: false,
        dodgeTimer: 0,
        cooldowns: {
            AURA_PUNCH: 0,
            ROUNDHOUSE_KICK: 0,
            BLUE_ORB: 0,
            RED_BLAST: 0,
            HOLLOW_PURPLE: 0,
            DODGE: 0,
            AWAKEN: 0
        }
    },
    enemy: {
        name: 'CURSED VANGUARD DEMON',
        maxHp: 250,
        hp: 250,
        defence: 6,
        isAlive: true,
        staggerTimer: 0,
        state: 'IDLE', // IDLE, APPROACH, STRAFE, TELEGRAPH_SLAM, ATTACKING, STAGGERED, DEFEATED
        attackTimer: 0,
        cooldowns: {
            CLAW: 0,
            GROUND_SLAM: 0,
            PROJECTILE: 0
        }
    },
    gesture: {
        state: 'IDLE', // IDLE, FIST_DETECTED, PUNCH_VALIDATION, ATTACK_TRIGGERED, COOLDOWN, WAIT_FOR_RELEASE
        currentGesture: 'NONE',
        navStatus: 'NEUTRAL',
        confidence: 0,
        cooldownTimer: 0,
        cooldownDuration: 0.45,
        lastPalmScale: null,
        lastWristPos: null,
        punchTriggerCount: 0
    },
    status: 'PLAYING' // PLAYING, VICTORY, DEFEAT, PAUSED
};

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
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.16);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(now); osc.stop(now + 0.16);
    }
    playKick() {
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.22);
        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(now); osc.stop(now + 0.22);
    }
    playBlueOrb() {
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.linearRampToValueAtTime(820, now + 0.35);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(now); osc.stop(now + 0.4);
    }
    playRedBlast() {
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(170, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.45);
        gain.gain.setValueAtTime(0.55, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(now); osc.stop(now + 0.45);
    }
    playHollowPurple() {
        this.init();
        const now = this.ctx.currentTime;
        [60, 130, 260, 520].forEach((f, i) => {
            const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
            osc.type = (i % 2 === 0) ? 'sawtooth' : 'sine';
            osc.frequency.setValueAtTime(f, now);
            osc.frequency.exponentialRampToValueAtTime(f * 2.5, now + 0.4);
            osc.frequency.exponentialRampToValueAtTime(30, now + 1.2);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(now); osc.stop(now + 1.2);
        });
    }
    playGuard() {
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1300, now + 0.25);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(now); osc.stop(now + 0.25);
    }
    playAwakening() {
        this.init();
        const now = this.ctx.currentTime;
        [440, 554.37, 659.25, 880].forEach((f, i) => {
            const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, now + i * 0.06);
            gain.gain.setValueAtTime(0.3, now + i * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(now + i * 0.06); osc.stop(now + 1.6);
        });
    }
    playDemonRoar() {
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.linearRampToValueAtTime(45, now + 0.45);
        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(now); osc.stop(now + 0.5);
    }
    playPlayerDamage() {
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(now); osc.stop(now + 0.25);
    }
    playVictory() {
        this.init();
        const now = this.ctx.currentTime;
        [261.63, 329.63, 392.00, 523.25].forEach((f, i) => {
            const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, now + i * 0.08);
            gain.gain.setValueAtTime(0.3, now + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(now + i * 0.08); osc.stop(now + 1.8);
        });
    }
    playDefeat() {
        this.init();
        const now = this.ctx.currentTime;
        [196.00, 185.00, 174.61, 164.81].forEach((f, i) => {
            const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(f, now + i * 0.15);
            gain.gain.setValueAtTime(0.35, now + i * 0.15);
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
let scene, camera, renderer, clock;
let playerGroup, sorcererBones = {};
let demonGroup, demonBones = {}, demonSlamRing;
let arenaRuneMesh, cameraTarget = new THREE.Vector3(0, 1.5, 0);
let activeProjectiles = [], activeParticles = [];
let shakeDuration = 0, shakeIntensity = 0;

// Locomotion & Animation
const keys = {
    KeyW: false, KeyS: false, KeyA: false, KeyD: false,
    ShiftLeft: false, ShiftRight: false, Space: false
};
let playerAnimState = 'IDLE'; // IDLE, WALK, SPRINT, JUMP, PUNCH, KICK, BLUE, RED, PURPLE, GUARD, DODGE, AWAKEN
let animTimer = 0;
let jumpVelocityY = 0;
let isPlayerGrounded = true;

// Gesture State
let webcamStream = null, webcamVideo = null;
let trackingCanvas = null, trackingCtx = null;
let isWebcamEnabled = false;
let handNormPos = { x: null, y: null };
let gestureDebounceTimer = 0;

function init3DWorld() {
    const container = document.getElementById('game-container');
    const width = window.innerWidth;
    const height = window.innerHeight;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06050e);
    scene.fog = new THREE.FogExp2(0x080614, 0.035);

    camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 2.4, 6.0);

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    renderer.domElement.id = 'game-canvas';

    clock = new THREE.Clock();

    // Atmospheric Lights
    const ambientLight = new THREE.AmbientLight(0x2d2448, 1.3);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xa78bfa, 1.6);
    dirLight.position.set(6, 14, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const demonSinisterLight = new THREE.PointLight(0xef4444, 2.8, 10);
    demonSinisterLight.position.set(0, 2.5, -3.2);
    scene.add(demonSinisterLight);

    // Build Arena & Characters
    createDarkFantasyArena();
    createSatoruGojoCharacter();
    createCursedDemonBoss();

    window.addEventListener('resize', onWindowResize);
}

function createDarkFantasyArena() {
    // Floor
    const floorGeo = new THREE.CircleGeometry(13.5, 64);
    const floorMat = new THREE.MeshStandardMaterial({
        color: 0x0f0d1b,
        roughness: 0.8,
        metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Floor Boundary Border Ring
    const borderGeo = new THREE.RingGeometry(13.3, 13.5, 64);
    const borderMat = new THREE.MeshBasicMaterial({ color: 0x7c3aed, side: THREE.DoubleSide });
    const border = new THREE.Mesh(borderGeo, borderMat);
    border.rotation.x = -Math.PI / 2;
    border.position.y = 0.01;
    scene.add(border);

    // Arcane Rune Floor Circle
    const runeCanvas = document.createElement('canvas');
    runeCanvas.width = 512;
    runeCanvas.height = 512;
    const rCtx = runeCanvas.getContext('2d');
    rCtx.strokeStyle = '#8b5cf6';
    rCtx.lineWidth = 3;
    rCtx.arc(256, 256, 210, 0, Math.PI * 2);
    rCtx.stroke();
    rCtx.beginPath();
    rCtx.arc(256, 256, 175, 0, Math.PI * 2);
    rCtx.stroke();
    for (let i = 0; i < 8; i++) {
        const ang = (i * Math.PI) / 4;
        rCtx.moveTo(256 + Math.cos(ang) * 175, 256 + Math.sin(ang) * 175);
        rCtx.lineTo(256 + Math.cos(ang) * 210, 256 + Math.sin(ang) * 210);
    }
    rCtx.stroke();

    const runeTex = new THREE.CanvasTexture(runeCanvas);
    const runeGeo = new THREE.PlaneGeometry(11, 11);
    const runeMat = new THREE.MeshBasicMaterial({
        map: runeTex,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
    });
    arenaRuneMesh = new THREE.Mesh(runeGeo, runeMat);
    arenaRuneMesh.rotation.x = -Math.PI / 2;
    arenaRuneMesh.position.y = 0.02;
    scene.add(arenaRuneMesh);
}

/**
 * High-Quality Procedural Satoru Gojo Character
 */
function createSatoruGojoCharacter() {
    playerGroup = new THREE.Group();
    playerGroup.position.set(0, 0, 2.5);

    // Root Hip Joint
    const rootHip = new THREE.Group();
    rootHip.position.y = 1.05;
    playerGroup.add(rootHip);
    sorcererBones.rootHip = rootHip;

    // Torso / Tunic
    const torsoGeo = new THREE.CylinderGeometry(0.30, 0.24, 0.85, 12);
    const uniformMat = new THREE.MeshStandardMaterial({
        color: 0x11101d,
        roughness: 0.6,
        metalness: 0.2
    });
    const torso = new THREE.Mesh(torsoGeo, uniformMat);
    torso.position.y = 0.42;
    torso.castShadow = true;
    rootHip.add(torso);
    sorcererBones.torso = torso;

    // High Standing Collar (Signature Gojo high-neck uniform)
    const collarGeo = new THREE.CylinderGeometry(0.20, 0.23, 0.26, 12, 1, true);
    const collarMat = new THREE.MeshStandardMaterial({
        color: 0x131024,
        roughness: 0.5,
        side: THREE.DoubleSide
    });
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.position.y = 0.88;
    torso.add(collar);

    // Silver Belt Buckle
    const buckleGeo = new THREE.BoxGeometry(0.12, 0.08, 0.06);
    const buckleMat = new THREE.MeshStandardMaterial({ color: 0xc4b5fd, metalness: 0.8, roughness: 0.2 });
    const buckle = new THREE.Mesh(buckleGeo, buckleMat);
    buckle.position.set(0, 0.05, 0.25);
    torso.add(buckle);

    // Head Neck Joint & Head Group
    const headGroup = new THREE.Group();
    headGroup.position.y = 0.98;
    torso.add(headGroup);
    sorcererBones.headGroup = headGroup;

    // Sculpted Anime Head & Chin
    const headGeo = new THREE.SphereGeometry(0.21, 16, 16);
    headGeo.scale(0.9, 1.15, 0.95);
    const skinMat = new THREE.MeshStandardMaterial({
        color: 0xfce7d0,
        roughness: 0.5,
        metalness: 0.05
    });
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headGroup.add(headMesh);

    // Tapered Anime Chin
    const chinGeo = new THREE.ConeGeometry(0.12, 0.16, 6);
    chinGeo.rotateX(Math.PI);
    const chin = new THREE.Mesh(chinGeo, skinMat);
    chin.position.set(0, -0.16, 0.04);
    headGroup.add(chin);

    // Black Blindfold Wrap
    const blindfoldGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.12, 16);
    const blindfoldMat = new THREE.MeshStandardMaterial({
        color: 0x0c0a14,
        roughness: 0.8
    });
    const blindfold = new THREE.Mesh(blindfoldGeo, blindfoldMat);
    blindfold.position.set(0, 0.02, 0);
    headGroup.add(blindfold);
    sorcererBones.blindfold = blindfold;

    // Luminous Cyan-Blue Six Eyes
    const eyeGeo = new THREE.SphereGeometry(0.045, 12, 12);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.08, 0.03, 0.18);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.08, 0.03, 0.18);
    headGroup.add(leftEye);
    headGroup.add(rightEye);
    sorcererBones.leftEye = leftEye;
    sorcererBones.rightEye = rightEye;

    // Embedded Point Light for Six Eyes face illumination
    const eyesLight = new THREE.PointLight(0x00f0ff, 0.8, 2.5);
    eyesLight.position.set(0, 0.05, 0.35);
    headGroup.add(eyesLight);
    sorcererBones.eyesLight = eyesLight;

    // Spiky Snow-White Hair (Layered multi-spikes)
    const hairMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.35,
        metalness: 0.1
    });
    const hairGroup = new THREE.Group();
    headGroup.add(hairGroup);

    // Crown & Bang Spikes
    const spikeConfigs = [
        { x: 0, y: 0.26, z: -0.02, rx: 0.2, ry: 0, rz: 0, s: 0.24, h: 0.35 },
        { x: -0.09, y: 0.24, z: 0.05, rx: 0.3, ry: -0.2, rz: 0.3, s: 0.20, h: 0.30 },
        { x: 0.09, y: 0.24, z: 0.05, rx: 0.3, ry: 0.2, rz: -0.3, s: 0.20, h: 0.30 },
        { x: -0.14, y: 0.18, z: -0.05, rx: 0.1, ry: -0.4, rz: 0.5, s: 0.18, h: 0.28 },
        { x: 0.14, y: 0.18, z: -0.05, rx: 0.1, ry: 0.4, rz: -0.5, s: 0.18, h: 0.28 },
        { x: 0, y: 0.20, z: -0.16, rx: -0.4, ry: 0, rz: 0, s: 0.22, h: 0.32 },
        { x: -0.06, y: 0.12, z: 0.18, rx: 0.7, ry: -0.1, rz: 0.15, s: 0.14, h: 0.22 },
        { x: 0.06, y: 0.12, z: 0.18, rx: 0.7, ry: 0.1, rz: -0.15, s: 0.14, h: 0.22 }
    ];

    spikeConfigs.forEach(cfg => {
        const spikeGeo = new THREE.ConeGeometry(cfg.s * 0.4, cfg.h, 5);
        const spike = new THREE.Mesh(spikeGeo, hairMat);
        spike.position.set(cfg.x, cfg.y, cfg.z);
        spike.rotation.set(cfg.rx, cfg.ry, cfg.rz);
        hairGroup.add(spike);
    });

    // Articulated Arms (Left & Right)
    ['left', 'right'].forEach(side => {
        const isLeft = side === 'left';
        const sign = isLeft ? -1 : 1;

        const shoulder = new THREE.Group();
        shoulder.position.set(sign * 0.36, 0.75, 0);
        torso.add(shoulder);

        const upperArmGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.38, 8);
        const upperArm = new THREE.Mesh(upperArmGeo, uniformMat);
        upperArm.position.y = -0.18;
        shoulder.add(upperArm);

        const elbow = new THREE.Group();
        elbow.position.y = -0.36;
        shoulder.add(elbow);

        const forearmGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.36, 8);
        const forearm = new THREE.Mesh(forearmGeo, uniformMat);
        forearm.position.y = -0.17;
        elbow.add(forearm);

        const hand = new THREE.Group();
        hand.position.y = -0.34;
        elbow.add(hand);

        const handGeo = new THREE.BoxGeometry(0.10, 0.12, 0.08);
        const handMesh = new THREE.Mesh(handGeo, skinMat);
        handMesh.position.y = -0.05;
        hand.add(handMesh);

        sorcererBones[`${side}Shoulder`] = shoulder;
        sorcererBones[`${side}Elbow`] = elbow;
        sorcererBones[`${side}Hand`] = hand;
    });

    // Articulated Legs (Left & Right)
    ['left', 'right'].forEach(side => {
        const isLeft = side === 'left';
        const sign = isLeft ? -1 : 1;

        const hip = new THREE.Group();
        hip.position.set(sign * 0.16, 0, 0);
        rootHip.add(hip);

        const thighGeo = new THREE.CylinderGeometry(0.11, 0.09, 0.50, 8);
        const thigh = new THREE.Mesh(thighGeo, uniformMat);
        thigh.position.y = -0.24;
        hip.add(thigh);

        const knee = new THREE.Group();
        knee.position.y = -0.48;
        hip.add(knee);

        const shinGeo = new THREE.CylinderGeometry(0.09, 0.07, 0.52, 8);
        const shin = new THREE.Mesh(shinGeo, uniformMat);
        shin.position.y = -0.24;
        knee.add(shin);

        const bootGeo = new THREE.BoxGeometry(0.12, 0.14, 0.22);
        const bootMat = new THREE.MeshStandardMaterial({ color: 0x090812, roughness: 0.4 });
        const boot = new THREE.Mesh(bootGeo, bootMat);
        boot.position.set(0, -0.48, 0.04);
        knee.add(boot);

        sorcererBones[`${side}Hip`] = hip;
        sorcererBones[`${side}Knee`] = knee;
    });

    // Infinity Guard Refractive Barrier Sphere
    const barrierGeo = new THREE.SphereGeometry(1.6, 24, 24);
    const barrierMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.0,
        roughness: 0.1,
        transmission: 0.8,
        reflectivity: 0.9,
        wireframe: false
    });
    const barrier = new THREE.Mesh(barrierGeo, barrierMat);
    barrier.position.y = 1.0;
    playerGroup.add(barrier);
    sorcererBones.barrier = barrier;

    scene.add(playerGroup);
}

/**
 * 3D Cursed Demon Boss
 */
function createCursedDemonBoss() {
    demonGroup = new THREE.Group();
    demonGroup.position.set(0, 0, -2.8);

    const demonMat = new THREE.MeshStandardMaterial({
        color: 0x2d0b13,
        roughness: 0.7,
        metalness: 0.3,
        emissive: 0x450a0a,
        emissiveIntensity: 0.35
    });

    // Muscular Torso
    const torsoGeo = new THREE.CylinderGeometry(0.55, 0.38, 1.4, 10);
    const torso = new THREE.Mesh(torsoGeo, demonMat);
    torso.position.y = 1.5;
    torso.castShadow = true;
    demonGroup.add(torso);
    demonBones.torso = torso;

    // Demon Head & Horns
    const headGeo = new THREE.BoxGeometry(0.48, 0.52, 0.48);
    const head = new THREE.Mesh(headGeo, demonMat);
    head.position.y = 2.45;
    demonGroup.add(head);
    demonBones.head = head;

    // Glowing Crimson Eyes
    const eyeGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.14, 2.5, 0.25);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.14, 2.5, 0.25);
    demonGroup.add(leftEye);
    demonGroup.add(rightEye);

    // Curved Horns
    const hornMat = new THREE.MeshStandardMaterial({ color: 0x110709, roughness: 0.4 });
    const hornGeo = new THREE.ConeGeometry(0.10, 0.65, 6);
    const leftHorn = new THREE.Mesh(hornGeo, hornMat);
    leftHorn.position.set(-0.25, 2.85, 0);
    leftHorn.rotation.set(-0.2, 0, -0.4);
    const rightHorn = new THREE.Mesh(hornGeo, hornMat);
    rightHorn.position.set(0.25, 2.85, 0);
    rightHorn.rotation.set(-0.2, 0, 0.4);
    demonGroup.add(leftHorn);
    demonGroup.add(rightHorn);

    // Long Claws & Arms
    ['left', 'right'].forEach(side => {
        const isLeft = side === 'left';
        const sign = isLeft ? -1 : 1;

        const arm = new THREE.Group();
        arm.position.set(sign * 0.72, 1.9, 0);
        demonGroup.add(arm);

        const armMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.9, 8), demonMat);
        armMesh.position.y = -0.45;
        arm.add(armMesh);

        const clawMesh = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 5), hornMat);
        clawMesh.position.y = -0.95;
        clawMesh.rotation.x = Math.PI;
        arm.add(clawMesh);

        demonBones[`${side}Arm`] = arm;
    });

    // Telegraphed Ground Slam Expanding Danger Ring
    const slamRingGeo = new THREE.RingGeometry(0.2, 4.2, 32);
    const slamRingMat = new THREE.MeshBasicMaterial({
        color: 0xef4444,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.0
    });
    demonSlamRing = new THREE.Mesh(slamRingGeo, slamRingMat);
    demonSlamRing.rotation.x = -Math.PI / 2;
    demonSlamRing.position.y = 0.04;
    scene.add(demonSlamRing);

    scene.add(demonGroup);
}

// ==========================================
// 4. ANIMATION CONTROLLER (FULL BODY)
// ==========================================
function updateSkeletalAnimations(delta, time, isMoving) {
    if (!sorcererBones.rootHip) return;

    if (animTimer > 0) animTimer -= delta;

    // Movement state transitions
    if (animTimer <= 0) {
        if (!isPlayerGrounded) {
            playerAnimState = 'JUMP';
        } else if (isMoving) {
            const isSprinting = keys.ShiftLeft || keys.ShiftRight;
            playerAnimState = isSprinting ? 'SPRINT' : 'WALK';
        } else {
            playerAnimState = GameState.player.isGuarding ? 'GUARD' : 'IDLE';
        }
    }

    const {
        rootHip, torso, headGroup,
        leftShoulder, rightShoulder, leftElbow, rightElbow, leftHand, rightHand,
        leftHip, rightHip, leftKnee, rightKnee
    } = sorcererBones;

    // Base Reset
    leftShoulder.rotation.set(0, 0, 0);
    rightShoulder.rotation.set(0, 0, 0);
    leftElbow.rotation.set(0, 0, 0);
    rightElbow.rotation.set(0, 0, 0);
    leftHip.rotation.set(0, 0, 0);
    rightHip.rotation.set(0, 0, 0);
    leftKnee.rotation.set(0, 0, 0);
    rightKnee.rotation.set(0, 0, 0);
    torso.rotation.set(0, 0, 0);
    headGroup.rotation.set(0, 0, 0);

    // Animation States
    switch (playerAnimState) {
        case 'IDLE':
            rootHip.position.y = 1.05 + Math.sin(time * 2.2) * 0.025;
            leftShoulder.rotation.x = Math.sin(time * 2.2) * 0.06;
            rightShoulder.rotation.x = -Math.sin(time * 2.2) * 0.06;
            leftElbow.rotation.x = -0.25;
            rightElbow.rotation.x = -0.25;
            break;

        case 'WALK':
        case 'SPRINT': {
            const freq = playerAnimState === 'SPRINT' ? 10.5 : 7.0;
            const legAmp = playerAnimState === 'SPRINT' ? 0.75 : 0.50;
            const armAmp = playerAnimState === 'SPRINT' ? 0.85 : 0.45;

            const cycle = time * freq;
            rootHip.position.y = 1.05 + Math.abs(Math.sin(cycle)) * 0.06;
            torso.rotation.x = 0.12;

            leftHip.rotation.x = Math.sin(cycle) * legAmp;
            rightHip.rotation.x = -Math.sin(cycle) * legAmp;
            leftKnee.rotation.x = Math.max(0, -Math.sin(cycle) * legAmp * 1.2);
            rightKnee.rotation.x = Math.max(0, Math.sin(cycle) * legAmp * 1.2);

            leftShoulder.rotation.x = -Math.sin(cycle) * armAmp;
            rightShoulder.rotation.x = Math.sin(cycle) * armAmp;
            leftElbow.rotation.x = -0.3;
            rightElbow.rotation.x = -0.3;
            break;
        }

        case 'JUMP':
            rootHip.position.y = 1.15;
            torso.rotation.x = -0.15;
            leftHip.rotation.x = -0.4;
            rightHip.rotation.x = -0.2;
            leftKnee.rotation.x = 0.8;
            rightKnee.rotation.x = 0.6;
            leftShoulder.rotation.x = 0.6;
            rightShoulder.rotation.x = 0.6;
            break;

        case 'PUNCH': {
            const p = 1.0 - (animTimer / 0.35); // 0 -> 1
            torso.rotation.y = -0.55 * Math.sin(p * Math.PI);
            torso.rotation.x = 0.18 * Math.sin(p * Math.PI);
            rightShoulder.rotation.x = 1.45 * Math.sin(p * Math.PI);
            rightShoulder.rotation.z = -0.2 * Math.sin(p * Math.PI);
            rightElbow.rotation.x = -0.1;
            leftShoulder.rotation.x = 0.5;
            leftElbow.rotation.x = -1.2;
            break;
        }

        case 'KICK': {
            const p = 1.0 - (animTimer / 0.45);
            torso.rotation.y = Math.sin(p * Math.PI) * 1.2;
            rightHip.rotation.x = 1.3 * Math.sin(p * Math.PI);
            rightHip.rotation.z = -0.7 * Math.sin(p * Math.PI);
            rightKnee.rotation.x = 0.2;
            leftShoulder.rotation.z = -0.5;
            rightShoulder.rotation.z = 0.5;
            break;
        }

        case 'BLUE':
            leftShoulder.rotation.x = 1.35;
            leftShoulder.rotation.y = 0.2;
            leftElbow.rotation.x = -0.2;
            torso.rotation.y = 0.25;
            break;

        case 'RED':
            rightShoulder.rotation.x = 1.5;
            rightElbow.rotation.x = -0.1;
            torso.rotation.x = -0.15;
            break;

        case 'PURPLE':
            leftShoulder.rotation.x = 1.2;
            rightShoulder.rotation.x = 1.2;
            leftShoulder.rotation.z = 0.45;
            rightShoulder.rotation.z = -0.45;
            leftElbow.rotation.x = -0.8;
            rightElbow.rotation.x = -0.8;
            torso.rotation.x = 0.1;
            break;

        case 'GUARD':
            leftShoulder.rotation.x = 1.1;
            rightShoulder.rotation.x = 1.1;
            leftShoulder.rotation.z = 0.55;
            rightShoulder.rotation.z = -0.55;
            leftElbow.rotation.x = -1.2;
            rightElbow.rotation.x = -1.2;
            break;

        case 'AWAKEN': {
            const p = 1.0 - (animTimer / 0.8);
            headGroup.rotation.x = -0.35 * Math.sin(p * Math.PI);
            leftShoulder.rotation.x = 1.4 * Math.sin(p * Math.PI);
            leftElbow.rotation.x = -1.5 * Math.sin(p * Math.PI);
            if (sorcererBones.blindfold) {
                sorcererBones.blindfold.position.y = 0.02 - (p * 0.18);
            }
            break;
        }
    }
}

// ==========================================
// 5. GOJO COMBAT ABILITIES & ACTIONS
// ==========================================
function triggerPlayerAbility(abilityKey) {
    if (GameState.status !== 'PLAYING') return;
    const p = GameState.player;

    const distance = playerGroup.position.distanceTo(demonGroup.position);

    switch (abilityKey) {
        case 'AURA_PUNCH': {
            if (p.cooldowns.AURA_PUNCH > 0) return;
            if (p.energy < 10) return;
            p.energy -= 10;
            p.cooldowns.AURA_PUNCH = 0.45;
            playerAnimState = 'PUNCH';
            animTimer = 0.35;
            sfx.playPunch();

            // Hit test
            if (distance <= 3.0) {
                executePlayerDamage(28, 'Aura Punch', 1.6);
            }
            break;
        }

        case 'ROUNDHOUSE_KICK': {
            if (p.cooldowns.ROUNDHOUSE_KICK > 0) return;
            if (p.energy < 15) return;
            p.energy -= 15;
            p.cooldowns.ROUNDHOUSE_KICK = 0.65;
            playerAnimState = 'KICK';
            animTimer = 0.45;
            sfx.playKick();

            if (distance <= 3.2) {
                executePlayerDamage(32, 'Roundhouse Kick', 2.8);
            }
            break;
        }

        case 'BLUE_ORB': {
            if (p.cooldowns.BLUE_ORB > 0) return;
            if (p.energy < 25) return;
            p.energy -= 25;
            p.cooldowns.BLUE_ORB = 2.2;
            playerAnimState = 'BLUE';
            animTimer = 0.4;
            sfx.playBlueOrb();

            spawnEnergyProjectile('BLUE', playerGroup.position, demonGroup.position, () => {
                executePlayerDamage(40, 'Lapse: Blue', 0);
                // Gravitational pull toward player
                demonGroup.position.lerp(playerGroup.position, 0.35);
            });
            break;
        }

        case 'RED_BLAST': {
            if (p.cooldowns.RED_BLAST > 0) return;
            if (p.energy < 35) return;
            p.energy -= 35;
            p.cooldowns.RED_BLAST = 3.2;
            playerAnimState = 'RED';
            animTimer = 0.4;
            sfx.playRedBlast();

            spawnEnergyProjectile('RED', playerGroup.position, demonGroup.position, () => {
                executePlayerDamage(55, 'Reversal: Red', 6.5);
            });
            break;
        }

        case 'HOLLOW_PURPLE': {
            if (p.cooldowns.HOLLOW_PURPLE > 0) return;
            if (p.energy < 70) return;
            p.energy -= 70;
            p.cooldowns.HOLLOW_PURPLE = 7.5;
            playerAnimState = 'PURPLE';
            animTimer = 0.75;
            sfx.playHollowPurple();

            spawnEnergyProjectile('PURPLE', playerGroup.position, demonGroup.position, () => {
                executePlayerDamage(110, 'Hollow Purple', 9.0);
                shakeScreen(0.5, 0.45);
            });
            break;
        }
    }
    updateHUD();
}

function executePlayerDamage(baseDamage, attackName, knockbackForce) {
    const e = GameState.enemy;
    if (!e.isAlive) return;

    let mult = GameState.player.isAwakened ? 1.3 : 1.0;
    const finalDamage = Math.max(6, Math.round(baseDamage * mult - e.defence));
    e.hp = Math.max(0, e.hp - finalDamage);

    // Stagger enemy
    e.staggerTimer = 0.45;
    e.state = 'STAGGERED';

    // Knockback
    if (knockbackForce > 0) {
        const dx = demonGroup.position.x - playerGroup.position.x;
        const dz = demonGroup.position.z - playerGroup.position.z;
        const len = Math.hypot(dx, dz) || 1;
        demonGroup.position.x += (dx / len) * knockbackForce;
        demonGroup.position.z += (dz / len) * knockbackForce;
        clampToArena(demonGroup.position);
    }

    spawnFloatingDamageText(finalDamage, attackName, demonGroup.position);
    shakeScreen(0.2, 0.15);

    if (e.hp <= 0) {
        e.isAlive = false;
        e.state = 'DEFEATED';
        GameState.status = 'VICTORY';
        sfx.playVictory();
        document.getElementById('victory-modal').style.display = 'flex';
    }
}

function toggleInfinityGuard() {
    const p = GameState.player;
    p.isGuarding = !p.isGuarding;
    if (p.isGuarding) {
        sfx.playGuard();
    }
    updateHUD();
}

function handleAwakeningToggle() {
    const p = GameState.player;
    if (p.cooldowns.AWAKEN > 0) return;
    p.isAwakened = !p.isAwakened;
    p.blindfoldRemoved = p.isAwakened;
    p.cooldowns.AWAKEN = 2.0;
    playerAnimState = 'AWAKEN';
    animTimer = 0.8;
    sfx.playAwakening();

    if (sorcererBones.eyesLight) {
        sorcererBones.eyesLight.intensity = p.isAwakened ? 2.8 : 0.8;
    }
    updateHUD();
}

function triggerPhaseDodge() {
    const p = GameState.player;
    if (p.cooldowns.DODGE > 0 || p.energy < 15) return;
    p.energy -= 15;
    p.cooldowns.DODGE = 0.8;
    p.isDodging = true;
    p.dodgeTimer = 0.35;
    playerAnimState = 'DODGE';
    animTimer = 0.35;
    sfx.playKick();

    // Dash 4.5m forward or in movement direction
    let dirX = 0, dirZ = -1;
    if (keys.KeyW) dirZ -= 1;
    if (keys.KeyS) dirZ += 1;
    if (keys.KeyA) dirX -= 1;
    if (keys.KeyD) dirX += 1;
    const len = Math.hypot(dirX, dirZ) || 1;

    playerGroup.position.x += (dirX / len) * 4.5;
    playerGroup.position.z += (dirZ / len) * 4.5;
    clampToArena(playerGroup.position);
    updateHUD();
}

// ==========================================
// 6. ENEMY AI & COMPLETE COMBAT LOOP
// ==========================================
function updateEnemyAI(delta) {
    const e = GameState.enemy;
    if (!e.isAlive || GameState.status !== 'PLAYING') return;

    // Stagger check
    if (e.staggerTimer > 0) {
        e.staggerTimer -= delta;
        demonBones.torso.material.emissive = new THREE.Color(0xffffff);
        demonBones.torso.material.emissiveIntensity = 0.8;
        return;
    } else {
        demonBones.torso.material.emissive = new THREE.Color(0x450a0a);
        demonBones.torso.material.emissiveIntensity = 0.35;
    }

    // Cooldown decrement
    for (const key of Object.keys(e.cooldowns)) {
        if (e.cooldowns[key] > 0) e.cooldowns[key] -= delta;
    }

    const dist = demonGroup.position.distanceTo(playerGroup.position);

    // AI State Machine
    if (dist > 3.4) {
        e.state = 'APPROACH';
        // Approach player
        const dx = playerGroup.position.x - demonGroup.position.x;
        const dz = playerGroup.position.z - demonGroup.position.z;
        const len = Math.hypot(dx, dz) || 1;
        demonGroup.position.x += (dx / len) * 2.8 * delta;
        demonGroup.position.z += (dz / len) * 2.8 * delta;
        clampToArena(demonGroup.position);

        // Turn toward player
        demonGroup.rotation.y = Math.atan2(dx, dz);

        // Ranged Fireball when far and off cooldown
        if (e.cooldowns.PROJECTILE <= 0 && dist > 5.5) {
            e.cooldowns.PROJECTILE = 4.5;
            e.state = 'ATTACKING';
            spawnEnergyProjectile('DEMON_FIREBALL', demonGroup.position, playerGroup.position, () => {
                damagePlayer(22, 'Bloodflame Orb');
            });
        }
    } else {
        // In close melee range
        demonGroup.rotation.y = Math.atan2(playerGroup.position.x - demonGroup.position.x, playerGroup.position.z - demonGroup.position.z);

        // Ground Slam Telegraph or Melee Claw
        if (e.cooldowns.GROUND_SLAM <= 0) {
            e.state = 'TELEGRAPH_SLAM';
            e.cooldowns.GROUND_SLAM = 6.0;
            executeDemonGroundSlam();
        } else if (e.cooldowns.CLAW <= 0) {
            e.state = 'ATTACKING';
            e.cooldowns.CLAW = 2.0;
            executeDemonClawAttack();
        } else {
            e.state = 'STRAFE';
            // Subtle strafe motion
            demonGroup.position.x += Math.sin(clock.getElapsedTime() * 3) * delta * 1.5;
            clampToArena(demonGroup.position);
        }
    }
}

function executeDemonClawAttack() {
    sfx.playDemonRoar();
    // Arm swing animation
    if (demonBones.leftArm) demonBones.leftArm.rotation.x = 1.3;
    setTimeout(() => {
        if (demonBones.leftArm) demonBones.leftArm.rotation.x = 0;
        const dist = demonGroup.position.distanceTo(playerGroup.position);
        if (dist <= 3.2) {
            damagePlayer(18, 'Cursed Claw Swipe');
        }
    }, 300);
}

function executeDemonGroundSlam() {
    sfx.playDemonRoar();
    demonSlamRing.position.copy(demonGroup.position);
    demonSlamRing.position.y = 0.04;
    demonSlamRing.scale.set(0.1, 0.1, 0.1);
    demonSlamRing.material.opacity = 0.75;

    let slamElapsed = 0;
    const slamInterval = setInterval(() => {
        slamElapsed += 0.05;
        const scale = 0.1 + (slamElapsed / 0.8) * 0.9;
        demonSlamRing.scale.set(scale, scale, scale);
        if (slamElapsed >= 0.8) {
            clearInterval(slamInterval);
            demonSlamRing.material.opacity = 0.0;
            // Detonate ground slam
            shakeScreen(0.4, 0.35);
            const dist = demonGroup.position.distanceTo(playerGroup.position);
            if (dist <= 4.2) {
                damagePlayer(34, 'Abyssal Ground Slam');
            }
        }
    }, 50);
}

/**
 * Handles incoming enemy attack damage on player
 */
function damagePlayer(amount, attackName) {
    if (GameState.status !== 'PLAYING') return;
    const p = GameState.player;

    // Dodge i-frames check
    if (p.isDodging) {
        spawnFloatingDamageText('EVADED', attackName, playerGroup.position, 'dmg-blocked');
        return;
    }

    // Infinity Guard check
    if (p.isGuarding) {
        p.energy = Math.max(0, p.energy - 12);
        spawnFloatingDamageText('BLOCKED (100%)', 'Infinity Guard', playerGroup.position, 'dmg-blocked');
        sfx.playGuard();
        updateHUD();
        return;
    }

    // Real damage applied to player
    p.hp = Math.max(0, p.hp - amount);
    sfx.playPlayerDamage();
    spawnFloatingDamageText(`-${amount}`, attackName, playerGroup.position, 'dmg-player');
    shakeScreen(0.3, 0.25);

    // Screen red flash
    const flash = document.getElementById('punch-flash');
    if (flash) {
        flash.style.background = 'rgba(239, 68, 68, 0.4)';
        flash.style.opacity = '1';
        setTimeout(() => { flash.style.opacity = '0'; }, 180);
    }

    updateHUD();

    // Defeat check
    if (p.hp <= 0) {
        GameState.status = 'DEFEAT';
        sfx.playDefeat();
        document.getElementById('defeat-modal').style.display = 'flex';
    }
}

// ==========================================
// 7. WEBCAM & GESTURE RECOGNITION PIPELINE
// ==========================================
function initWebcamAndTracking() {
    webcamVideo = document.getElementById('webcam-video');
    trackingCanvas = document.getElementById('tracking-canvas');
    if (trackingCanvas) trackingCtx = trackingCanvas.getContext('2d');

    document.getElementById('btn-enable-camera')?.addEventListener('click', enableCamera);
    document.getElementById('btn-disable-camera')?.addEventListener('click', disableCamera);

    // Automatically attempt initial camera start
    enableCamera();
}

async function enableCamera() {
    if (isWebcamEnabled) return;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' }
        });
        webcamStream = stream;
        webcamVideo.srcObject = stream;
        await webcamVideo.play();
        isWebcamEnabled = true;

        setupMediaPipeHands();
        document.getElementById('status-dot').style.background = '#10b981';
        document.getElementById('webcam-status-label').innerText = 'CAMERA TRACKING';
    } catch (err) {
        console.warn('Camera permission denied or camera unavailable:', err);
        document.getElementById('status-dot').style.background = '#ef4444';
        document.getElementById('webcam-status-label').innerText = 'CAM OFFLINE (KEYBOARD READY)';
    }
}

function disableCamera() {
    if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
        webcamStream = null;
    }
    isWebcamEnabled = false;
    document.getElementById('status-dot').style.background = '#f59e0b';
    document.getElementById('webcam-status-label').innerText = 'CAM DISABLED';
    if (trackingCtx) trackingCtx.clearRect(0, 0, trackingCanvas.width, trackingCanvas.height);
}

function setupMediaPipeHands() {
    if (typeof Hands === 'undefined') return;

    const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.65,
        minTrackingConfidence: 0.65
    });

    hands.onResults(onHandResults);

    const cameraUtils = new Camera(webcamVideo, {
        onFrame: async () => {
            if (isWebcamEnabled && webcamVideo.readyState >= 2) {
                await hands.send({ image: webcamVideo });
            }
        },
        width: 320,
        height: 240
    });
    cameraUtils.start();
}

/**
 * Robust Scale-Invariant Gesture Recognition State Machine
 */
function onHandResults(results) {
    if (!isWebcamEnabled || !trackingCtx) return;

    trackingCtx.clearRect(0, 0, trackingCanvas.width, trackingCanvas.height);

    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
        GameState.gesture.state = 'IDLE';
        GameState.gesture.currentGesture = 'NONE';
        GameState.gesture.navStatus = 'NEUTRAL';
        handNormPos = { x: null, y: null };
        updateGestureHUD();
        return;
    }

    const landmarks = results.multiHandLandmarks[0];
    const twoHands = results.multiHandLandmarks.length >= 2;

    // Draw Skeleton on Tracking Canvas
    drawHandLandmarks(landmarks);

    // 1. Scale Invariant Normalization: Palm reference scale
    const wrist = landmarks[0];
    const indexMcp = landmarks[5];
    const palmScale = Math.hypot(indexMcp.x - wrist.x, indexMcp.y - wrist.y) || 0.15;

    // Track normalized wrist coordinate for movement navigation
    handNormPos.x = wrist.x;
    handNormPos.y = wrist.y;

    // Measure forward Z velocity via palm scale rate of expansion
    let forwardVelocity = 0;
    if (GameState.gesture.lastPalmScale !== null) {
        forwardVelocity = (palmScale - GameState.gesture.lastPalmScale) / 0.033; // delta per frame
    }
    GameState.gesture.lastPalmScale = palmScale;

    // Measure lateral velocity
    let horizontalVelocity = 0;
    if (GameState.gesture.lastWristPos) {
        horizontalVelocity = Math.abs(wrist.x - GameState.gesture.lastWristPos.x) / 0.033;
    }
    GameState.gesture.lastWristPos = { x: wrist.x, y: wrist.y };

    // 2. Normalized Finger Curl Calculations (distance to wrist divided by palm scale)
    const isCurled = (tipIdx) => (Math.hypot(landmarks[tipIdx].x - wrist.x, landmarks[tipIdx].y - wrist.y) / palmScale) < 1.35;
    const isExtended = (tipIdx) => (Math.hypot(landmarks[tipIdx].x - wrist.x, landmarks[tipIdx].y - wrist.y) / palmScale) > 1.85;

    const indexCurled = isCurled(8);
    const middleCurled = isCurled(12);
    const ringCurled = isCurled(16);
    const pinkyCurled = isCurled(20);

    const isFist = indexCurled && middleCurled && ringCurled && pinkyCurled;
    const isOpenPalm = isExtended(8) && isExtended(12) && isExtended(16) && isExtended(20);
    const isPointing = isExtended(8) && middleCurled && ringCurled && pinkyCurled;

    // 3. Gesture Recognition State Machine
    if (gestureDebounceTimer > 0) {
        GameState.gesture.state = 'COOLDOWN';
    } else if (twoHands) {
        GameState.gesture.currentGesture = 'HOLLOW_PURPLE';
        triggerPlayerAbility('HOLLOW_PURPLE');
        gestureDebounceTimer = 1.0;
    } else if (isOpenPalm) {
        GameState.gesture.currentGesture = 'INFINITY_GUARD';
        if (!GameState.player.isGuarding) toggleInfinityGuard();
    } else if (isPointing) {
        GameState.gesture.currentGesture = 'BLUE_ORB';
        triggerPlayerAbility('BLUE_ORB');
        gestureDebounceTimer = 0.6;
    } else if (horizontalVelocity > 2.5) {
        GameState.gesture.currentGesture = 'RED_BLAST';
        triggerPlayerAbility('RED_BLAST');
        gestureDebounceTimer = 0.6;
    } else if (isFist) {
        if (GameState.gesture.state === 'IDLE' || GameState.gesture.state === 'FIST_DETECTED') {
            GameState.gesture.state = 'PUNCH_VALIDATION';
            // Validate forward thrust or sudden scale expansion
            if (forwardVelocity > 0.45 || GameState.gesture.punchTriggerCount === 0) {
                GameState.gesture.state = 'ATTACK_TRIGGERED';
                GameState.gesture.currentGesture = 'AURA_PUNCH';
                triggerPlayerAbility('AURA_PUNCH');
                GameState.gesture.punchTriggerCount++;
                gestureDebounceTimer = 0.45;
                GameState.gesture.state = 'WAIT_FOR_RELEASE';
            }
        }
    } else {
        // Hand released
        if (GameState.player.isGuarding && !isOpenPalm) {
            GameState.player.isGuarding = false;
        }
        GameState.gesture.state = 'IDLE';
        GameState.gesture.currentGesture = 'NONE';
    }

    updateGestureHUD();
}

function drawHandLandmarks(landmarks) {
    trackingCtx.strokeStyle = '#38bdf8';
    trackingCtx.fillStyle = '#00f0ff';
    trackingCtx.lineWidth = 2;

    landmarks.forEach(pt => {
        const x = pt.x * trackingCanvas.width;
        const y = pt.y * trackingCanvas.height;
        trackingCtx.beginPath();
        trackingCtx.arc(x, y, 3, 0, Math.PI * 2);
        trackingCtx.fill();
    });
}

function updateGestureHUD() {
    const gLabel = document.getElementById('webcam-gesture-label');
    const mLabel = document.getElementById('webcam-move-label');
    if (gLabel) gLabel.innerText = `GESTURE: ${GameState.gesture.currentGesture}`;
    if (mLabel) mLabel.innerText = `STATE: ${GameState.gesture.state}`;
}

// ==========================================
// 8. PROJECTILE & VFX SYSTEMS
// ==========================================
function spawnEnergyProjectile(type, startPos, targetPos, onHitCallback) {
    let geo, mat, color;
    if (type === 'BLUE') {
        geo = new THREE.SphereGeometry(0.3, 16, 16);
        mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        color = 0x38bdf8;
    } else if (type === 'RED') {
        geo = new THREE.SphereGeometry(0.35, 16, 16);
        mat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        color = 0xef4444;
    } else if (type === 'PURPLE') {
        geo = new THREE.SphereGeometry(0.7, 24, 24);
        mat = new THREE.MeshBasicMaterial({ color: 0xc084fc });
        color = 0xc084fc;
    } else if (type === 'DEMON_FIREBALL') {
        geo = new THREE.SphereGeometry(0.28, 12, 12);
        mat = new THREE.MeshBasicMaterial({ color: 0xdc2626 });
        color = 0xdc2626;
    }

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(startPos);
    mesh.position.y += 1.3;
    scene.add(mesh);

    const light = new THREE.PointLight(color, 2.0, 6);
    mesh.add(light);

    activeProjectiles.push({
        mesh,
        target: targetPos.clone().setY(1.3),
        speed: type === 'PURPLE' ? 14 : 18,
        onHit: onHitCallback
    });
}

function spawnFloatingDamageText(amount, label, worldPos, cssClass = '') {
    const textEl = document.createElement('div');
    textEl.className = `combat-dmg ${cssClass}`;
    textEl.innerHTML = `${amount}<br><span style="font-size:10px;color:#cbd5e1;">${label}</span>`;
    document.body.appendChild(textEl);

    // Project world pos to screen
    const screenPos = worldPos.clone().setY(worldPos.y + 1.8).project(camera);
    const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-(screenPos.y * 0.5) + 0.5) * window.innerHeight;

    textEl.style.left = `${x}px`;
    textEl.style.top = `${y}px`;

    setTimeout(() => { textEl.remove(); }, 850);
}

function shakeScreen(duration, intensity) {
    shakeDuration = duration;
    shakeIntensity = intensity;
}

function clampToArena(pos, radius = 13.5) {
    const dist = Math.hypot(pos.x, pos.z);
    if (dist > radius) {
        const factor = radius / dist;
        pos.x *= factor;
        pos.z *= factor;
    }
}

// ==========================================
// 9. HUD & UI MANAGEMENT
// ==========================================
function updateHUD() {
    const p = GameState.player;
    const e = GameState.enemy;

    // Player HP & Energy
    const pHpFill = document.getElementById('player-hp-bar') || document.getElementById('player-hp-fill');
    const pHpText = document.getElementById('player-hp-text') || document.getElementById('player-hp-label');
    if (pHpFill) pHpFill.style.width = `${(p.hp / p.maxHp) * 100}%`;
    if (pHpText) pHpText.innerText = `${Math.round(p.hp)} / ${p.maxHp}`;

    const pEnergyFill = document.getElementById('player-energy-bar') || document.getElementById('player-energy-fill');
    const pEnergyText = document.getElementById('player-energy-text') || document.getElementById('player-energy-label');
    if (pEnergyFill) pEnergyFill.style.width = `${(p.energy / p.maxEnergy) * 100}%`;
    if (pEnergyText) pEnergyText.innerText = `${Math.round(p.energy)} / ${p.maxEnergy}`;

    // Boss HP
    const bHpFill = document.getElementById('boss-hp-bar') || document.getElementById('boss-hp-fill');
    const bHpText = document.getElementById('boss-hp-text') || document.getElementById('boss-hp-label');
    if (bHpFill) bHpFill.style.width = `${(e.hp / e.maxHp) * 100}%`;
    if (bHpText) bHpText.innerText = `${Math.round(e.hp)} / ${e.maxHp}`;

    const bossStateTag = document.getElementById('boss-state-tag');
    if (bossStateTag) bossStateTag.innerText = e.state;

    // Infinity Guard Banner & Barrier
    const guardBanner = document.getElementById('guard-active-banner');
    if (guardBanner) guardBanner.style.display = p.isGuarding ? 'block' : 'none';
    if (sorcererBones.barrier) {
        sorcererBones.barrier.material.opacity = p.isGuarding ? 0.35 : 0.0;
    }

    // Awaken Button
    const awakenBtn = document.getElementById('btn-awaken');
    if (awakenBtn) {
        if (p.isAwakened) {
            awakenBtn.innerText = 'SIX EYES: AWAKENED';
            awakenBtn.style.background = 'linear-gradient(90deg, #00f0ff, #3b82f6)';
            awakenBtn.style.color = '#000';
        } else {
            awakenBtn.innerText = '[T] AWAKEN SIX EYES';
            awakenBtn.style.background = 'rgba(12, 10, 24, 0.85)';
            awakenBtn.style.color = '#38bdf8';
        }
    }

    // Cooldown Card Visuals
    updateCooldownCard('card-punch', p.cooldowns.AURA_PUNCH);
    updateCooldownCard('card-kick', p.cooldowns.ROUNDHOUSE_KICK);
    updateCooldownCard('card-blue', p.cooldowns.BLUE_ORB);
    updateCooldownCard('card-red', p.cooldowns.RED_BLAST);
    updateCooldownCard('card-purple', p.cooldowns.HOLLOW_PURPLE);
    updateCooldownCard('card-dodge', p.cooldowns.DODGE);
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

function resetGame() {
    GameState.player.hp = GameState.player.maxHp;
    GameState.player.energy = GameState.player.maxEnergy;
    GameState.player.isGuarding = false;
    GameState.player.isAwakened = false;

    GameState.enemy.hp = GameState.enemy.maxHp;
    GameState.enemy.isAlive = true;
    GameState.enemy.state = 'IDLE';

    demonGroup.position.set(0, 0, -2.8);
    demonGroup.scale.set(1, 1, 1);
    playerGroup.position.set(0, 0, 2.5);

    if (sorcererBones.blindfold) {
        sorcererBones.blindfold.position.set(0, 0.02, 0);
    }
    if (sorcererBones.eyesLight) {
        sorcererBones.eyesLight.intensity = 0.8;
    }

    GameState.status = 'PLAYING';
    document.getElementById('victory-modal').style.display = 'none';
    document.getElementById('defeat-modal').style.display = 'none';
    updateHUD();
}

// ==========================================
// 10. INPUT LISTENERS & MAIN GAME LOOP
// ==========================================
function setupInputListeners() {
    window.addEventListener('keydown', (e) => {
        if (e.code in keys) keys[e.code] = true;

        if (e.code === 'KeyJ' || e.code === 'Digit1') triggerPlayerAbility('AURA_PUNCH');
        if (e.code === 'KeyH') triggerPlayerAbility('ROUNDHOUSE_KICK');
        if (e.code === 'KeyK' || e.code === 'Digit2') triggerPlayerAbility('BLUE_ORB');
        if (e.code === 'KeyL' || e.code === 'Digit3') triggerPlayerAbility('RED_BLAST');
        if (e.code === 'KeyU' || e.code === 'Digit4') triggerPlayerAbility('HOLLOW_PURPLE');
        if (e.code === 'KeyI' || e.code === 'KeyC') toggleInfinityGuard();
        if (e.code === 'KeyT') handleAwakeningToggle();

        // Jump & Dodge
        if (e.code === 'Space') {
            if (keys.ShiftLeft || keys.ShiftRight || keys.KeyW || keys.KeyS || keys.KeyA || keys.KeyD) {
                triggerPhaseDodge();
            } else if (isPlayerGrounded) {
                isPlayerGrounded = false;
                jumpVelocityY = 7.5;
            }
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.code in keys) keys[e.code] = false;
    });

    // Button Clicks
    document.getElementById('card-punch')?.addEventListener('click', () => triggerPlayerAbility('AURA_PUNCH'));
    document.getElementById('card-kick')?.addEventListener('click', () => triggerPlayerAbility('ROUNDHOUSE_KICK'));
    document.getElementById('card-blue')?.addEventListener('click', () => triggerPlayerAbility('BLUE_ORB'));
    document.getElementById('card-red')?.addEventListener('click', () => triggerPlayerAbility('RED_BLAST'));
    document.getElementById('card-purple')?.addEventListener('click', () => triggerPlayerAbility('HOLLOW_PURPLE'));
    document.getElementById('card-guard')?.addEventListener('click', toggleInfinityGuard);
    document.getElementById('card-dodge')?.addEventListener('click', triggerPhaseDodge);
    document.getElementById('btn-awaken')?.addEventListener('click', handleAwakeningToggle);

    document.getElementById('btn-restart-victory')?.addEventListener('click', resetGame);
    document.getElementById('btn-restart-defeat')?.addEventListener('click', resetGame);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    if (gestureDebounceTimer > 0) gestureDebounceTimer -= delta;

    // Cooldown updates
    const p = GameState.player;
    for (const k of Object.keys(p.cooldowns)) {
        if (p.cooldowns[k] > 0) p.cooldowns[k] = Math.max(0, p.cooldowns[k] - delta);
    }

    // Energy management
    if (p.isGuarding) {
        p.energy = Math.max(0, p.energy - 14 * delta);
        if (p.energy <= 0) p.isGuarding = false;
    } else {
        p.energy = Math.min(p.maxEnergy, p.energy + p.energyRegen * delta);
    }

    // Dodge timer
    if (p.isDodging) {
        p.dodgeTimer -= delta;
        if (p.dodgeTimer <= 0) p.isDodging = false;
    }

    // Jump physics
    if (!isPlayerGrounded) {
        jumpVelocityY -= 18.0 * delta;
        playerGroup.position.y += jumpVelocityY * delta;
        if (playerGroup.position.y <= 0) {
            playerGroup.position.y = 0;
            jumpVelocityY = 0;
            isPlayerGrounded = true;
        }
    }

    // Enemy AI Step
    updateEnemyAI(delta);

    // Movement Calculation
    let inputX = 0, inputZ = 0;
    if (keys.KeyW) inputZ -= 1;
    if (keys.KeyS) inputZ += 1;
    if (keys.KeyA) inputX -= 1;
    if (keys.KeyD) inputX += 1;

    // Continuous hand navigation
    if (isWebcamEnabled && handNormPos.x !== null) {
        if (handNormPos.x < 0.42) inputX = -1;
        if (handNormPos.x > 0.58) inputX = 1;
        if (handNormPos.y < 0.40) inputZ = -1;
        if (handNormPos.y > 0.65) inputZ = 1;
    }

    const isMoving = (inputX !== 0 || inputZ !== 0);
    if (isMoving) {
        const len = Math.hypot(inputX, inputZ);
        const speed = (keys.ShiftLeft || keys.ShiftRight) ? 7.8 : 4.8;
        const speedMult = p.isAwakened ? 1.25 : 1.0;
        playerGroup.position.x += (inputX / len) * speed * speedMult * delta;
        playerGroup.position.z += (inputZ / len) * speed * speedMult * delta;
        clampToArena(playerGroup.position);

        // Face movement direction
        const targetRot = Math.atan2(inputX, inputZ);
        playerGroup.rotation.y = THREE.MathUtils.lerp(playerGroup.rotation.y, targetRot, delta * 10);
    } else {
        // Face enemy
        const dx = demonGroup.position.x - playerGroup.position.x;
        const dz = demonGroup.position.z - playerGroup.position.z;
        const faceEnemyRot = Math.atan2(dx, dz) + Math.PI;
        playerGroup.rotation.y = THREE.MathUtils.lerp(playerGroup.rotation.y, faceEnemyRot, delta * 6);
    }

    // Skeletal animations
    updateSkeletalAnimations(delta, elapsedTime, isMoving);

    // Dynamic Camera Tracking
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

    // Active Projectiles
    for (let i = activeProjectiles.length - 1; i >= 0; i--) {
        const proj = activeProjectiles[i];
        proj.mesh.position.lerp(proj.target, proj.speed * delta);
        if (proj.mesh.position.distanceTo(proj.target) < 0.6) {
            proj.onHit();
            scene.remove(proj.mesh);
            activeProjectiles.splice(i, 1);
        }
    }

    // Floor Rune Rotation
    if (arenaRuneMesh) arenaRuneMesh.rotation.z += 0.0018;

    updateHUD();
    renderer.render(scene, camera);
}

// ==========================================
// 11. INITIALIZATION ON PAGE LOAD
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    init3DWorld();
    updateHUD();
    setupInputListeners();
    initWebcamAndTracking();
    animate();
});
