/**
 * SHADOWBORN V2 - Main Game Runtime
 * Three.js 3D Dark Fantasy Engine, Sorcerer vs Cursed Demon Combat,
 * Audio Synthesizer & Gesture Pipeline.
 */

import {
    COMBAT_CONSTANTS,
    createInitialCombatState,
    executePlayerAbility,
    setInfinityGuard,
    executeDodge,
    executeEnemyAttack,
    updateCombatTimers
} from './combatRules.js';

// ==========================================
// 1. COMBAT STATE & GLOBALS
// ==========================================
let combatState = createInitialCombatState();

let scene, camera, renderer, clock;
let playerGroup, playerMesh, playerInfinityBarrier, playerWhiteHair;
let demonGroup, demonMesh, demonGroundSlamRing;
let arenaRuneMesh;
let activeProjectiles = [];
let shakeDuration = 0, shakeIntensity = 0;

const keysPressed = {};

// ==========================================
// 2. PROCEDURAL SOUND SYNTHESIZER
// ==========================================
class SoundFX {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playPunch() {
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
    }

    playBlueOrb() {
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.linearRampToValueAtTime(680, now + 0.35);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
    }

    playRedBlast() {
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
    }

    playHollowPurple() {
        this.init();
        const now = this.ctx.currentTime;
        // Deep sub-bass tear + celestial chord
        const freqs = [65, 130, 260, 520];
        freqs.forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = (i % 2 === 0) ? 'sawtooth' : 'sine';
            osc.frequency.setValueAtTime(f, now);
            osc.frequency.exponentialRampToValueAtTime(f * 2.2, now + 0.3);
            osc.frequency.exponentialRampToValueAtTime(35, now + 0.9);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.9);
        });
    }

    playGuard() {
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(850, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.25);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
    }

    playDodge() {
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.15);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
    }

    playDemonRoar() {
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.linearRampToValueAtTime(55, now + 0.35);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
    }

    playVictory() {
        this.init();
        const now = this.ctx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25];
        notes.forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, now + i * 0.08);
            gain.gain.setValueAtTime(0.25, now + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + i * 0.08);
            osc.stop(now + 1.6);
        });
    }

    playDefeat() {
        this.init();
        const now = this.ctx.currentTime;
        const notes = [196.00, 185.00, 174.61, 164.81];
        notes.forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(f, now + i * 0.15);
            gain.gain.setValueAtTime(0.3, now + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + i * 0.15);
            osc.stop(now + 2.0);
        });
    }
}

const sfx = new SoundFX();

// ==========================================
// 3. THREE.JS 3D SCENE & CHARACTERS
// ==========================================
export function initGame() {
    const container = document.getElementById('canvas-container');
    const width = window.innerWidth;
    const height = window.innerHeight;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06050e);
    scene.fog = new THREE.FogExp2(0x080614, 0.035);

    camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 3.2, 6.8);
    camera.lookAt(0, 1.4, -2.0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
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
    dirLight.position.set(5, 12, 8);
    dirLight.castShadow = true;
    scene.add(dirLight);

    buildArena();
    createSorcererPlayer();
    createCursedDemon();

    setupInputListeners();
    initWebcamTracker();

    window.addEventListener('resize', onWindowResize);
    requestAnimationFrame(gameLoop);
}

function buildArena() {
    // Floor
    const floorGeo = new THREE.CircleGeometry(16, 48);
    const floorMat = new THREE.MeshStandardMaterial({
        color: 0x121020,
        roughness: 0.8,
        metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Arcane floor runes
    const runeCanvas = document.createElement('canvas');
    runeCanvas.width = 1024;
    runeCanvas.height = 1024;
    const ctx = runeCanvas.getContext('2d');
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(512, 512, 440, 0, Math.PI * 2);
    ctx.arc(512, 512, 380, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        ctx.moveTo(512 + Math.cos(a) * 380, 512 + Math.sin(a) * 380);
        ctx.lineTo(512 + Math.cos(a + Math.PI * 0.75) * 380, 512 + Math.sin(a + Math.PI * 0.75) * 380);
    }
    ctx.stroke();

    const runeTex = new THREE.CanvasTexture(runeCanvas);
    const runeGeo = new THREE.PlaneGeometry(15, 15);
    const runeMat = new THREE.MeshBasicMaterial({
        map: runeTex,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    arenaRuneMesh = new THREE.Mesh(runeGeo, runeMat);
    arenaRuneMesh.rotation.x = -Math.PI / 2;
    arenaRuneMesh.position.y = 0.02;
    scene.add(arenaRuneMesh);

    // Arena Pillars
    for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI * 2) / 8;
        const x = Math.cos(angle) * 11.5;
        const z = Math.sin(angle) * 11.5;

        const pGeo = new THREE.CylinderGeometry(0.5, 0.75, 8, 8);
        const pMat = new THREE.MeshStandardMaterial({ color: 0x1b172a, roughness: 0.9 });
        const pillar = new THREE.Mesh(pGeo, pMat);
        pillar.position.set(x, 4, z);
        scene.add(pillar);

        const cryGeo = new THREE.OctahedronGeometry(0.4);
        const cryMat = new THREE.MeshBasicMaterial({ color: (i % 2 === 0) ? 0x38bdf8 : 0xc084fc });
        const crystal = new THREE.Mesh(cryGeo, cryMat);
        crystal.position.set(x, 8.4, z);
        scene.add(crystal);
    }
}

function createSorcererPlayer() {
    playerGroup = new THREE.Group();
    playerGroup.position.set(0, 0, 2.2);

    // Dark high-collared anime sorcerer uniform
    const coatGeo = new THREE.CylinderGeometry(0.38, 0.3, 1.2, 10);
    const coatMat = new THREE.MeshStandardMaterial({
        color: 0x0f111a,
        roughness: 0.6,
        metalness: 0.3
    });
    playerMesh = new THREE.Mesh(coatGeo, coatMat);
    playerMesh.position.y = 1.35;
    playerMesh.castShadow = true;
    playerGroup.add(playerMesh);

    // Head
    const headGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.4 });
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 2.1;
    playerGroup.add(head);

    // Spiky White Anime Hair
    const hairGeo = new THREE.ConeGeometry(0.28, 0.45, 7);
    const hairMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.2,
        metalness: 0.1
    });
    playerWhiteHair = new THREE.Mesh(hairGeo, hairMat);
    playerWhiteHair.position.set(0, 2.38, 0.04);
    playerWhiteHair.rotation.x = -0.2;
    playerGroup.add(playerWhiteHair);

    // Dark Blindfold with glowing azure eye glint
    const blindfoldGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.08, 16);
    const blindfoldMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
    const blindfold = new THREE.Mesh(blindfoldGeo, blindfoldMat);
    blindfold.position.set(0, 2.1, 0.02);
    playerGroup.add(blindfold);

    const eyeGlintGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const eyeGlintMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const eyeGlint = new THREE.Mesh(eyeGlintGeo, eyeGlintMat);
    eyeGlint.position.set(0.09, 2.1, -0.22);
    playerGroup.add(eyeGlint);

    // Fists
    const fistGeo = new THREE.SphereGeometry(0.14, 10, 10);
    const fistMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, emissive: 0x7c3aed, emissiveIntensity: 0.4 });
    const rFist = new THREE.Mesh(fistGeo, fistMat);
    rFist.name = 'rightFist';
    rFist.position.set(0.48, 1.3, -0.3);
    playerGroup.add(rFist);

    const lFist = new THREE.Mesh(fistGeo, fistMat);
    lFist.position.set(-0.48, 1.3, -0.3);
    playerGroup.add(lFist);

    // Infinity Guard Translucent Sphere Barrier
    const barrierGeo = new THREE.SphereGeometry(1.6, 24, 24);
    const barrierMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.0,
        roughness: 0.1,
        transmission: 0.8,
        blending: THREE.AdditiveBlending
    });
    playerInfinityBarrier = new THREE.Mesh(barrierGeo, barrierMat);
    playerInfinityBarrier.position.y = 1.3;
    playerGroup.add(playerInfinityBarrier);

    scene.add(playerGroup);
}

function createCursedDemon() {
    demonGroup = new THREE.Group();
    demonGroup.position.set(0, 0, -2.8);

    // Demon Torso
    const torsoGeo = new THREE.CylinderGeometry(0.7, 0.45, 1.8, 10);
    const demonMat = new THREE.MeshStandardMaterial({
        color: 0x220c15,
        roughness: 0.6,
        metalness: 0.3
    });
    demonMesh = new THREE.Mesh(torsoGeo, demonMat);
    demonMesh.position.y = 1.7;
    demonMesh.castShadow = true;
    demonGroup.add(demonMesh);

    // Demon Head
    const headGeo = new THREE.BoxGeometry(0.65, 0.7, 0.65);
    const head = new THREE.Mesh(headGeo, demonMat);
    head.position.y = 2.85;
    demonGroup.add(head);

    // Glowing Crimson Eyes
    const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const lEye = new THREE.Mesh(eyeGeo, eyeMat);
    lEye.position.set(-0.18, 2.9, 0.34);
    const rEye = new THREE.Mesh(eyeGeo, eyeMat);
    rEye.position.set(0.18, 2.9, 0.34);
    demonGroup.add(lEye);
    demonGroup.add(rEye);

    // Horns
    const hornGeo = new THREE.ConeGeometry(0.16, 0.9, 8);
    const hornMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.2 });
    const lHorn = new THREE.Mesh(hornGeo, hornMat);
    lHorn.position.set(-0.4, 3.4, 0);
    lHorn.rotation.z = 0.4;
    const rHorn = new THREE.Mesh(hornGeo, hornMat);
    rHorn.position.set(0.4, 3.4, 0);
    rHorn.rotation.z = -0.4;
    demonGroup.add(lHorn);
    demonGroup.add(rHorn);

    // Claw Arms
    const armGeo = new THREE.CylinderGeometry(0.2, 0.24, 1.4, 8);
    const lArm = new THREE.Mesh(armGeo, demonMat);
    lArm.position.set(-0.95, 1.4, 0.2);
    lArm.name = 'demonLeftArm';
    const rArm = new THREE.Mesh(armGeo, demonMat);
    rArm.position.set(0.95, 1.4, 0.2);
    rArm.name = 'demonRightArm';
    demonGroup.add(lArm);
    demonGroup.add(rArm);

    // Ground Slam Telegraph Ring (Floor projection)
    const ringGeo = new THREE.RingGeometry(0.2, 4.2, 32);
    const ringMat = new THREE.MeshBasicMaterial({
        color: 0xef4444,
        transparent: true,
        opacity: 0.0,
        side: THREE.DoubleSide
    });
    demonGroundSlamRing = new THREE.Mesh(ringGeo, ringMat);
    demonGroundSlamRing.rotation.x = -Math.PI / 2;
    demonGroundSlamRing.position.y = 0.05;
    scene.add(demonGroundSlamRing);

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

    // Visual & Audio effects per ability
    switch (abilityKey) {
        case 'AURA_PUNCH':
            sfx.playPunch();
            punchAnim();
            if (res.hit) {
                spawnDamageText(res.damage, demonGroup.position, 'dmg-punch');
                demonGroup.position.z -= res.knockback;
                shakeCamera(0.15, 0.18);
            }
            break;

        case 'BLUE_ORB':
            sfx.playBlueOrb();
            spawnProjectile('BLUE', playerGroup.position, demonGroup.position, () => {
                if (res.hit) {
                    spawnDamageText(res.damage, demonGroup.position, 'dmg-blue');
                    // Pull demon forward
                    demonGroup.position.z += res.pullForce * 0.4;
                    shakeCamera(0.2, 0.22);
                }
            });
            break;

        case 'RED_BLAST':
            sfx.playRedBlast();
            spawnProjectile('RED', playerGroup.position, demonGroup.position, () => {
                if (res.hit) {
                    spawnDamageText(res.damage, demonGroup.position, 'dmg-red');
                    demonGroup.position.z -= res.knockback * 0.45;
                    shakeCamera(0.25, 0.3);
                }
            });
            break;

        case 'HOLLOW_PURPLE':
            sfx.playHollowPurple();
            spawnProjectile('PURPLE', playerGroup.position, demonGroup.position, () => {
                if (res.hit) {
                    spawnDamageText(res.damage, demonGroup.position, 'dmg-purple');
                    demonGroup.position.z -= 2.2;
                    shakeCamera(0.5, 0.6);
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
        // Dash player backward or sideways
        playerGroup.position.z += 1.2;
        shakeCamera(0.08, 0.08);
        updateHUD();
    }
}

export function toggleInfinityGuard() {
    if (combatState.status !== 'PLAYING') return;
    const newState = !combatState.player.isGuarding;
    setInfinityGuard(combatState, newState);
    if (newState) {
        sfx.playGuard();
    }
    updateHUD();
}

function punchAnim() {
    const fist = playerGroup.getObjectByName('rightFist');
    if (!fist) return;
    let t = 0;
    const interval = setInterval(() => {
        t += 0.2;
        fist.position.z = -0.3 - Math.sin(t * Math.PI) * 1.2;
        if (t >= 1) {
            clearInterval(interval);
            fist.position.z = -0.3;
        }
    }, 16);
}

function spawnProjectile(type, startPos, targetPos, onHit) {
    const geo = new THREE.SphereGeometry(type === 'PURPLE' ? 0.6 : 0.28, 16, 16);
    const color = type === 'BLUE' ? 0x38bdf8 : (type === 'RED' ? 0xef4444 : 0xc084fc);
    const mat = new THREE.MeshBasicMaterial({ color, wireframe: type === 'PURPLE' });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(startPos);
    mesh.position.y += 1.3;
    scene.add(mesh);

    activeProjectiles.push({
        mesh,
        target: targetPos.clone().add(new THREE.Vector3(0, 1.4, 0)),
        speed: type === 'PURPLE' ? 14 : 20,
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

    // Handle Ground Slam Telegraph
    if (isSlamTelegraphing) {
        slamTelegraphTimer -= delta;
        demonGroundSlamRing.position.copy(demonGroup.position);
        demonGroundSlamRing.position.y = 0.05;
        demonGroundSlamRing.material.opacity = 0.8;

        if (slamTelegraphTimer <= 0) {
            isSlamTelegraphing = false;
            demonGroundSlamRing.material.opacity = 0.0;
            // Execute Ground Slam
            sfx.playDemonRoar();
            const res = executeEnemyAttack(combatState, 'GROUND_SLAM', dist);
            shakeCamera(0.4, 0.45);
            handleEnemyAttackResult(res);
        }
        return;
    }

    // Approach player if too far
    if (dist > 3.0) {
        demonGroup.position.z += delta * COMBAT_CONSTANTS.ENEMY.MOVE_SPEED * 0.7;
    }

    enemyActionTimer -= delta;
    if (enemyActionTimer <= 0) {
        enemyActionTimer = 2.0 + Math.random() * 1.5;

        // Choose attack based on distance
        if (dist <= 2.8) {
            // Close range: Claw or Combo
            if (Math.random() < 0.4) {
                // Combo
                const res = executeEnemyAttack(combatState, 'COMBO_STRIKE', dist);
                sfx.playPunch();
                handleEnemyAttackResult(res);
            } else {
                // Claw
                const res = executeEnemyAttack(combatState, 'CLAW', dist);
                sfx.playPunch();
                handleEnemyAttackResult(res);
            }
        } else if (dist <= 5.0 && Math.random() < 0.5) {
            // Ground Slam with Telegraph
            isSlamTelegraphing = true;
            slamTelegraphTimer = COMBAT_CONSTANTS.ENEMY_ATTACKS.GROUND_SLAM.telegraphTime;
            document.getElementById('boss-state-tag').innerText = 'TELEGRAPH: GROUND SLAM';
        } else {
            // Long range: Cursed Projectile
            spawnCursedProjectile();
        }
    }
}

function spawnCursedProjectile() {
    const geo = new THREE.SphereGeometry(0.3, 12, 12);
    const mat = new THREE.MeshBasicMaterial({ color: 0xdc2626 });
    const pMesh = new THREE.Mesh(geo, mat);
    pMesh.position.copy(demonGroup.position).add(new THREE.Vector3(0, 1.8, 0));
    scene.add(pMesh);

    activeProjectiles.push({
        mesh: pMesh,
        target: playerGroup.position.clone().add(new THREE.Vector3(0, 1.2, 0)),
        speed: 10,
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
// 6. HUD & STATE SYNCHRONIZATION
// ==========================================
function updateHUD() {
    // Player HP & Energy
    const p = combatState.player;
    document.getElementById('player-hp-fill').style.width = `${(p.hp / p.maxHp) * 100}%`;
    document.getElementById('player-hp-label').innerText = `${Math.round(p.hp)} / ${p.maxHp}`;
    document.getElementById('player-energy-fill').style.width = `${(p.energy / p.maxEnergy) * 100}%`;
    document.getElementById('player-energy-label').innerText = `${Math.round(p.energy)} / ${p.maxEnergy}`;

    // Infinity Guard Banner & Barrier Visual
    const guardBanner = document.getElementById('guard-active-banner');
    if (p.isGuarding) {
        guardBanner.style.display = 'block';
        playerInfinityBarrier.material.opacity = 0.35;
    } else {
        guardBanner.style.display = 'none';
        playerInfinityBarrier.material.opacity = 0.0;
    }

    // Enemy HP
    const e = combatState.enemy;
    document.getElementById('boss-hp-fill').style.width = `${(e.hp / e.maxHp) * 100}%`;
    document.getElementById('boss-hp-label').innerText = `${Math.round(e.hp)} / ${e.maxHp}`;
    document.getElementById('boss-state-tag').innerText = e.state;

    // Cooldown cards
    updateCooldownCard('card-punch', p.cooldowns.AURA_PUNCH);
    updateCooldownCard('card-blue', p.cooldowns.BLUE_ORB);
    updateCooldownCard('card-red', p.cooldowns.RED_BLAST);
    updateCooldownCard('card-purple', p.cooldowns.HOLLOW_PURPLE);
    updateCooldownCard('card-dodge', p.cooldowns.DODGE);

    // Victory / Defeat modals
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
    playerGroup.position.set(0, 0, 2.2);

    document.getElementById('victory-modal').style.display = 'none';
    document.getElementById('defeat-modal').style.display = 'none';
    updateHUD();
}

// ==========================================
// 7. INPUT & WEBCAM EVENT LISTENERS
// ==========================================
function setupInputListeners() {
    window.addEventListener('keydown', (e) => {
        keysPressed[e.code] = true;

        if (e.code === 'KeyQ' || e.code === 'Digit1') triggerPlayerAbility('AURA_PUNCH');
        if (e.code === 'KeyE' || e.code === 'Digit2') triggerPlayerAbility('BLUE_ORB');
        if (e.code === 'KeyR' || e.code === 'Digit3') triggerPlayerAbility('RED_BLAST');
        if (e.code === 'KeyF' || e.code === 'Digit4') triggerPlayerAbility('HOLLOW_PURPLE');
        if (e.code === 'KeyC' || e.code === 'KeyG') toggleInfinityGuard();
        if (e.code === 'Space' || e.code === 'ShiftLeft') triggerDodge();
    });

    window.addEventListener('keyup', (e) => {
        keysPressed[e.code] = false;
    });

    // Button click listeners
    document.getElementById('card-punch')?.addEventListener('click', () => triggerPlayerAbility('AURA_PUNCH'));
    document.getElementById('card-blue')?.addEventListener('click', () => triggerPlayerAbility('BLUE_ORB'));
    document.getElementById('card-red')?.addEventListener('click', () => triggerPlayerAbility('RED_BLAST'));
    document.getElementById('card-purple')?.addEventListener('click', () => triggerPlayerAbility('HOLLOW_PURPLE'));
    document.getElementById('card-guard')?.addEventListener('click', () => toggleInfinityGuard());
    document.getElementById('card-dodge')?.addEventListener('click', () => triggerDodge());

    document.getElementById('btn-restart-victory')?.addEventListener('click', resetGame);
    document.getElementById('btn-restart-defeat')?.addEventListener('click', resetGame);
}

function initWebcamTracker() {
    const video = document.getElementById('webcam-video');
    const canvas = document.getElementById('tracking-canvas');
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = 320;
    canvas.height = 240;

    navigator.mediaDevices?.getUserMedia({ video: true })
        .then((stream) => {
            video.srcObject = stream;
            document.getElementById('status-dot').style.background = '#10b981';
            document.getElementById('webcam-status-label').innerText = 'TRACKING ACTIVE';
        })
        .catch(() => {
            document.getElementById('status-dot').style.background = '#f59e0b';
            document.getElementById('webcam-status-label').innerText = 'KEYBOARD ACTIVE';
        });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ==========================================
// 8. MAIN ANIMATION & RENDER LOOP
// ==========================================
function gameLoop() {
    requestAnimationFrame(gameLoop);

    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    updateCombatTimers(combatState, delta);
    updateEnemyAI(delta);

    // Player WASD Locomotion
    if (keysPressed['KeyW']) playerGroup.position.z -= delta * 3.5;
    if (keysPressed['KeyS']) playerGroup.position.z += delta * 3.5;
    if (keysPressed['KeyA']) playerGroup.position.x -= delta * 3.5;
    if (keysPressed['KeyD']) playerGroup.position.x += delta * 3.5;

    // Projectile Movement
    for (let i = activeProjectiles.length - 1; i >= 0; i--) {
        const p = activeProjectiles[i];
        p.mesh.position.lerp(p.target, p.speed * delta);
        if (p.mesh.position.distanceTo(p.target) < 0.5) {
            p.onHit();
            scene.remove(p.mesh);
            activeProjectiles.splice(i, 1);
        }
    }

    // Floor runes rotate
    if (arenaRuneMesh) arenaRuneMesh.rotation.z += 0.002;

    // Demon hover
    if (combatState.enemy.hp > 0) {
        demonGroup.position.y = Math.sin(elapsedTime * 2.8) * 0.06;
    } else {
        if (demonGroup.scale.x > 0.01) {
            demonGroup.scale.multiplyScalar(0.95);
        }
    }

    // Camera Shake
    if (shakeDuration > 0) {
        shakeDuration -= delta;
        camera.position.x = (Math.random() - 0.5) * shakeIntensity;
        camera.position.y = 3.2 + (Math.random() - 0.5) * shakeIntensity;
    } else {
        camera.position.x = 0;
        camera.position.y = 3.2;
    }

    updateHUD();
    renderer.render(scene, camera);
}
