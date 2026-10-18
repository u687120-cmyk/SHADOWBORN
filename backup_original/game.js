/**
 * SHADOWBORN: AWAKENING
 * Real-Time Webcam-Controlled 3D Dark Fantasy Action RPG
 * Core 3D Game Engine, MediaPipe Hand Gesture Pipeline, Combat AI & Progression
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
        level: 1,
        xp: 0,
        xpNeeded: 100,
        rank: 'E',
        title: 'Awakened Fighter',
        attackMultiplier: 1.0
    },
    enemy: {
        name: 'CURSED VANGUARD DEMON',
        maxHp: 120,
        hp: 120,
        defence: 6,
        isAlive: true,
        staggerTime: 0,
        state: 'IDLE' // IDLE, APPROACH, ATTACK, STAGGER, DEFEATED
    },
    mission: {
        id: 1,
        title: 'THE AWAKENING',
        desc: 'Learn to manipulate supernatural energy. Perform a real forward punch gesture to strike down the demon.',
        objective: 'Defeat the Cursed Vanguard Demon',
        targetKills: 1,
        currentKills: 0,
        isCompleted: false,
        xpReward: 100
    },
    gesture: {
        current: 'NONE',
        state: 'IDLE', // IDLE, DETECTED, VALIDATED, TRIGGERED, COOLDOWN
        cooldownTimer: 0,
        cooldownDuration: 0.6,
        confidence: 0,
        isHandTracked: false,
        punchTriggerCount: 0
    }
};

// ==========================================
// 2. THREE.JS 3D WORLD & GRAPHICS SETUP
// ==========================================
let scene, camera, renderer, clock;
let playerGroup, playerFist, playerAuraParticles;
let demonGroup, demonMesh, demonAuraParticles;
let arenaRuneMesh;
let punchActionActive = false;
let punchProgress = 0;
const floatingNumbers = [];

function init3DWorld() {
    const container = document.getElementById('game-container');
    const width = window.innerWidth;
    const height = window.innerHeight;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05040a);
    scene.fog = new THREE.FogExp2(0x070512, 0.038);

    camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
    // Over-the-shoulder third person combat camera
    camera.position.set(0, 2.8, 6.2);
    camera.lookAt(0, 1.4, -2.5);

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    renderer.domElement.id = 'game-canvas';

    clock = new THREE.Clock();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x221a38, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x8b5cf6, 1.6);
    dirLight.position.set(5, 12, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const demonSinisterLight = new THREE.PointLight(0xef4444, 2.5, 8);
    demonSinisterLight.position.set(0, 2.5, -3.5);
    scene.add(demonSinisterLight);

    // Arena Floor
    createDarkFantasyArena();

    // Spawn Characters
    createPlayerCharacter();
    createDemonEnemy();

    window.addEventListener('resize', onWindowResize);
}

function createDarkFantasyArena() {
    // Floor
    const floorGeo = new THREE.CircleGeometry(16, 48);
    const floorMat = new THREE.MeshStandardMaterial({
        color: 0x110f1c,
        roughness: 0.8,
        metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Glowing Arcane Summoning Runes
    const runeCanvas = document.createElement('canvas');
    runeCanvas.width = 1024;
    runeCanvas.height = 1024;
    const ctx = runeCanvas.getContext('2d');

    // Draw intricate dark fantasy circle
    ctx.strokeStyle = '#9333ea';
    ctx.lineWidth = 6;
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 15;

    ctx.beginPath();
    ctx.arc(512, 512, 420, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(512, 512, 380, 0, Math.PI * 2);
    ctx.stroke();

    // Star polygons
    for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const x1 = 512 + Math.cos(angle) * 380;
        const y1 = 512 + Math.sin(angle) * 380;
        const x2 = 512 + Math.cos(angle + Math.PI * 0.75) * 380;
        const y2 = 512 + Math.sin(angle + Math.PI * 0.75) * 380;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    const runeTexture = new THREE.CanvasTexture(runeCanvas);
    const runeGeo = new THREE.PlaneGeometry(14, 14);
    const runeMat = new THREE.MeshBasicMaterial({
        map: runeTexture,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending
    });
    arenaRuneMesh = new THREE.Mesh(runeGeo, runeMat);
    arenaRuneMesh.rotation.x = -Math.PI / 2;
    arenaRuneMesh.position.y = 0.02;
    scene.add(arenaRuneMesh);

    // Gothic Pillars around the perimeter
    for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI * 2) / 8;
        const px = Math.cos(angle) * 11;
        const pz = Math.sin(angle) * 11;

        const pillarGeo = new THREE.CylinderGeometry(0.5, 0.7, 7, 8);
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0x1f1d2b, roughness: 0.9 });
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(px, 3.5, pz);
        pillar.castShadow = true;
        scene.add(pillar);

        // Flame crystal on top of pillar
        const flameGeo = new THREE.OctahedronGeometry(0.35);
        const flameMat = new THREE.MeshBasicMaterial({ color: (i % 2 === 0) ? 0x8b5cf6 : 0x06b6d4 });
        const flame = new THREE.Mesh(flameGeo, flameMat);
        flame.position.set(px, 7.2, pz);
        scene.add(flame);
    }
}

function createPlayerCharacter() {
    playerGroup = new THREE.Group();
    playerGroup.position.set(0, 0, 1.8);

    // Torso / Shadow hunter dark cloak
    const torsoGeo = new THREE.CylinderGeometry(0.38, 0.28, 1.1, 10);
    const cloakMat = new THREE.MeshStandardMaterial({
        color: 0x181426,
        roughness: 0.7,
        metalness: 0.3
    });
    const torso = new THREE.Mesh(torsoGeo, cloakMat);
    torso.position.y = 1.35;
    torso.castShadow = true;
    playerGroup.add(torso);

    // Head with dark hood & glowing eyes
    const headGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const hoodMat = new THREE.MeshStandardMaterial({ color: 0x0f0b1a });
    const head = new THREE.Mesh(headGeo, hoodMat);
    head.position.y = 2.05;
    playerGroup.add(head);

    // Glowing purple supernatural eyes
    const eyeGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xc084fc });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.08, 2.06, -0.2);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.08, 2.06, -0.2);
    playerGroup.add(leftEye);
    playerGroup.add(rightEye);

    // Shoulders
    const shoulderMat = new THREE.MeshStandardMaterial({ color: 0x312e81, metalness: 0.6 });
    const shoulderGeo = new THREE.BoxGeometry(0.22, 0.18, 0.28);
    const leftShoulder = new THREE.Mesh(shoulderGeo, shoulderMat);
    leftShoulder.position.set(-0.48, 1.75, 0);
    const rightShoulder = new THREE.Mesh(shoulderGeo, shoulderMat);
    rightShoulder.position.set(0.48, 1.75, 0);
    playerGroup.add(leftShoulder);
    playerGroup.add(rightShoulder);

    // Right Fist (The Aura Punch Arm)
    const fistGeo = new THREE.SphereGeometry(0.16, 12, 12);
    const fistMat = new THREE.MeshStandardMaterial({
        color: 0x4c1d95,
        emissive: 0x7c3aed,
        emissiveIntensity: 0.8
    });
    playerFist = new THREE.Mesh(fistGeo, fistMat);
    playerFist.position.set(0.48, 1.35, -0.4);
    playerGroup.add(playerFist);

    // Fist Aura Particles
    const particleCount = 45;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
        particlePos[i] = (Math.random() - 0.5) * 0.45;
        particlePos[i + 1] = (Math.random() - 0.5) * 0.45;
        particlePos[i + 2] = (Math.random() - 0.5) * 0.45;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
        color: 0xa855f7,
        size: 0.08,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    playerAuraParticles = new THREE.Points(particleGeo, particleMat);
    playerFist.add(playerAuraParticles);

    scene.add(playerGroup);
}

function createDemonEnemy() {
    demonGroup = new THREE.Group();
    demonGroup.position.set(0, 0, -2.6);

    // Demon Muscular Torso
    const torsoGeo = new THREE.CylinderGeometry(0.65, 0.4, 1.6, 10);
    const demonSkinMat = new THREE.MeshStandardMaterial({
        color: 0x271018,
        roughness: 0.6,
        metalness: 0.4
    });
    const torso = new THREE.Mesh(torsoGeo, demonSkinMat);
    torso.position.y = 1.6;
    torso.castShadow = true;
    demonGroup.add(torso);

    // Demon Head with Horns
    const headGeo = new THREE.BoxGeometry(0.55, 0.6, 0.6);
    const head = new THREE.Mesh(headGeo, demonSkinMat);
    head.position.y = 2.65;
    demonGroup.add(head);

    // Crimson Glowing Demon Eyes
    const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const lEye = new THREE.Mesh(eyeGeo, eyeMat);
    lEye.position.set(-0.16, 2.7, 0.3);
    const rEye = new THREE.Mesh(eyeGeo, eyeMat);
    rEye.position.set(0.16, 2.7, 0.3);
    demonGroup.add(lEye);
    demonGroup.add(rEye);

    // Horns
    const hornGeo = new THREE.ConeGeometry(0.14, 0.75, 8);
    const hornMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.3 });
    const lHorn = new THREE.Mesh(hornGeo, hornMat);
    lHorn.position.set(-0.35, 3.1, 0);
    lHorn.rotation.z = 0.45;
    const rHorn = new THREE.Mesh(hornGeo, hornMat);
    rHorn.position.set(0.35, 3.1, 0);
    rHorn.rotation.z = -0.45;
    demonGroup.add(lHorn);
    demonGroup.add(rHorn);

    // Spiked Shoulders
    const shoulderGeo = new THREE.ConeGeometry(0.3, 0.7, 6);
    const lShoulder = new THREE.Mesh(shoulderGeo, hornMat);
    lShoulder.position.set(-0.85, 2.1, 0);
    lShoulder.rotation.z = 1.2;
    const rShoulder = new THREE.Mesh(shoulderGeo, hornMat);
    rShoulder.position.set(0.85, 2.1, 0);
    rShoulder.rotation.z = -1.2;
    demonGroup.add(lShoulder);
    demonGroup.add(rShoulder);

    // Demon Claws / Arms
    const armGeo = new THREE.CylinderGeometry(0.18, 0.22, 1.2, 8);
    const lArm = new THREE.Mesh(armGeo, demonSkinMat);
    lArm.position.set(-0.85, 1.35, 0.2);
    const rArm = new THREE.Mesh(armGeo, demonSkinMat);
    rArm.position.set(0.85, 1.35, 0.2);
    demonGroup.add(lArm);
    demonGroup.add(rArm);

    // Dark energy particle aura
    const count = 50;
    const auraGeo = new THREE.BufferGeometry();
    const auraPos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
        auraPos[i] = (Math.random() - 0.5) * 1.6;
        auraPos[i + 1] = Math.random() * 2.8;
        auraPos[i + 2] = (Math.random() - 0.5) * 1.6;
    }
    auraGeo.setAttribute('position', new THREE.BufferAttribute(auraPos, 3));
    const auraMat = new THREE.PointsMaterial({
        color: 0xef4444,
        size: 0.12,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    demonAuraParticles = new THREE.Points(auraGeo, auraMat);
    demonGroup.add(demonAuraParticles);

    demonMesh = torso;
    scene.add(demonGroup);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ==========================================
// 3. COMBAT & AURA PUNCH EXECUTION
// ==========================================
function triggerAuraPunch(source = 'WEBCAM') {
    if (GameState.gesture.cooldownTimer > 0) return;
    if (!GameState.enemy.isAlive) return;

    GameState.gesture.cooldownTimer = GameState.gesture.cooldownDuration;
    GameState.gesture.punchTriggerCount++;
    punchActionActive = true;
    punchProgress = 0;

    // Trigger procedural audio
    if (window.soundEngine) {
        window.soundEngine.playWhoosh();
    }

    // Flash screen feedback
    const flash = document.getElementById('punch-flash');
    if (flash) {
        flash.style.opacity = '1';
        setTimeout(() => { flash.style.opacity = '0'; }, 90);
    }

    // Calculate Hit against Demon
    const playerPos = playerGroup.position;
    const demonPos = demonGroup.position;
    const distance = playerPos.distanceTo(demonPos);

    if (distance <= 5.5) {
        // Base damage formula from Section 19:
        // Final Damage = max(Minimum Damage, Base Damage * Attack Multiplier * Resistance Modifier - Effective Defence)
        const baseDamage = 35 + Math.floor(Math.random() * 12);
        const finalDamage = Math.max(8, Math.round(baseDamage * GameState.player.attackMultiplier - GameState.enemy.defence));

        setTimeout(() => {
            applyDamageToDemon(finalDamage);
        }, 120); // Sync hit with apex of punch extension
    }
}

function applyDamageToDemon(damage) {
    if (!GameState.enemy.isAlive) return;

    GameState.enemy.hp = Math.max(0, GameState.enemy.hp - damage);
    GameState.enemy.staggerTime = 0.45;
    GameState.enemy.state = 'STAGGER';

    // Knockback
    demonGroup.position.z -= 0.65;

    // Audio & Impact effects
    if (window.soundEngine) {
        window.soundEngine.playAuraPunchImpact();
        window.soundEngine.playDemonRoar();
    }

    // Spawn floating damage numbers in 3D screen space
    spawnDamageNumber(damage, demonGroup.position.clone().add(new THREE.Vector3(0, 2.2, 0)));

    // Camera shake
    cameraShake(0.18, 0.25);

    // Update HUD
    updateHUD();

    if (GameState.enemy.hp <= 0) {
        defeatDemon();
    }
}

function defeatDemon() {
    GameState.enemy.isAlive = false;
    GameState.enemy.state = 'DEFEATED';

    // Mission 1 completion
    GameState.mission.currentKills = 1;
    GameState.mission.isCompleted = true;

    // Award XP
    GameState.player.xp += GameState.mission.xpReward;
    if (GameState.player.xp >= GameState.player.xpNeeded) {
        GameState.player.level++;
        GameState.player.xp -= GameState.player.xpNeeded;
        GameState.player.xpNeeded = Math.round(GameState.player.xpNeeded * 1.5);
        GameState.player.rank = 'D';
        GameState.player.title = 'Elite Hunter';
    }

    if (window.soundEngine) {
        window.soundEngine.playVictory();
    }

    saveGameProgress();
    updateHUD();

    // Show Victory Modal
    setTimeout(() => {
        const modal = document.getElementById('victory-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }, 900);
}

function spawnDamageNumber(damage, worldPos) {
    const elem = document.createElement('div');
    elem.className = 'damage-number';
    elem.innerText = `-${damage}`;
    document.body.appendChild(elem);

    // Project 3D coordinate to 2D screen coordinate
    const vector = worldPos.clone().project(camera);
    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight;

    elem.style.left = `${x - 20}px`;
    elem.style.top = `${y - 30}px`;

    setTimeout(() => {
        elem.remove();
    }, 800);
}

let shakeDuration = 0;
let shakeIntensity = 0;
function cameraShake(duration, intensity) {
    shakeDuration = duration;
    shakeIntensity = intensity;
}

// ==========================================
// 4. WEBCAM & COMPUTER VISION PIPELINE
// ==========================================
let webcamVideo, trackingCanvas, trackingCtx;
let lastWristY = null;
let lastFistDepthProxy = null;
let isWebcamRunning = false;

async function initWebcamAndTracking() {
    webcamVideo = document.getElementById('webcam-video');
    trackingCanvas = document.getElementById('tracking-canvas');
    trackingCtx = trackingCanvas.getContext('2d');

    const statusText = document.getElementById('webcam-status-text');

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
        });
        webcamVideo.srcObject = stream;
        await webcamVideo.play();
        isWebcamRunning = true;
        statusText.innerText = "Camera Active: Show fist & punch!";

        trackingCanvas.width = 640;
        trackingCanvas.height = 480;

        // Initialize MediaPipe Hands or Fallback Motion Tracker
        setupGestureRecognition();
    } catch (err) {
        console.warn("[Webcam] Unable to access camera:", err);
        statusText.innerText = "Camera unavailable (Using Spacebar/Click)";
        document.getElementById('status-dot').style.background = '#f59e0b';
    }
}

function setupGestureRecognition() {
    // Check if MediaPipe Hands is loaded globally via CDN
    if (window.Hands) {
        const hands = new window.Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.6,
            minTrackingConfidence: 0.6
        });

        hands.onResults(onMediaPipeResults);

        // Process frames
        async function processFrame() {
            if (isWebcamRunning && webcamVideo.readyState >= 2) {
                await hands.send({ image: webcamVideo });
            }
            requestAnimationFrame(processFrame);
        }
        processFrame();
    } else {
        // High-performance canvas motion/contour optical gesture tracker fallback
        setupOpticalMotionFallback();
    }
}

function onMediaPipeResults(results) {
    trackingCtx.clearRect(0, 0, trackingCanvas.width, trackingCanvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        GameState.gesture.isHandTracked = true;
        const landmarks = results.multiHandLandmarks[0];

        // Draw hand skeleton on tracking canvas
        drawHandLandmarks(landmarks, trackingCtx);

        // Classify Gesture: Closed Fist vs Forward Punch
        const wrist = landmarks[0];
        const indexTip = landmarks[8];
        const middleTip = landmarks[12];
        const ringTip = landmarks[16];
        const pinkyTip = landmarks[20];

        const dist = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y, (p1.z || 0) - (p2.z || 0));

        const isIndexCurled = dist(indexTip, wrist) < 0.28;
        const isMiddleCurled = dist(middleTip, wrist) < 0.28;
        const isRingCurled = dist(ringTip, wrist) < 0.28;
        const isPinkyCurled = dist(pinkyTip, wrist) < 0.28;

        const isFist = isIndexCurled && isMiddleCurled && isRingCurled && isPinkyCurled;

        // Forward Punch: Rapid decrease in landmark z or rapid forward translation
        let forwardSpeed = 0;
        if (lastFistDepthProxy !== null && isFist) {
            forwardSpeed = (lastFistDepthProxy - (landmarks[9].z || 0)) * 60;
        }
        lastFistDepthProxy = landmarks[9].z || 0;

        if (isFist) {
            if (forwardSpeed > 1.4 || Math.abs(landmarks[0].y - (lastWristY || landmarks[0].y)) > 0.08) {
                GameState.gesture.current = 'FORWARD_PUNCH';
                triggerAuraPunch('WEBCAM_MEDIAPIPE');
            } else {
                GameState.gesture.current = 'CLOSED_FIST';
            }
        } else {
            GameState.gesture.current = 'OPEN_HAND';
        }
        lastWristY = landmarks[0].y;
    } else {
        GameState.gesture.isHandTracked = false;
        GameState.gesture.current = 'SEARCHING';
    }

    updateGestureHUD();
}

function drawHandLandmarks(landmarks, ctx) {
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 3;
    ctx.fillStyle = '#38bdf8';

    // Draw joints
    for (let i = 0; i < landmarks.length; i++) {
        const x = landmarks[i].x * trackingCanvas.width;
        const y = landmarks[i].y * trackingCanvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Fallback frame-difference optical flow gesture detector
let prevFrameData = null;
function setupOpticalMotionFallback() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 160;
    tempCanvas.height = 120;
    const tempCtx = tempCanvas.getContext('2d');

    function checkMotion() {
        if (isWebcamRunning && webcamVideo.readyState >= 2) {
            tempCtx.drawImage(webcamVideo, 0, 0, 160, 120);
            const frame = tempCtx.getImageData(0, 0, 160, 120);
            const data = frame.data;

            if (prevFrameData) {
                let motionCount = 0;
                let motionX = 0;
                let motionY = 0;

                for (let i = 0; i < data.length; i += 4) {
                    const diff = Math.abs(data[i] - prevFrameData[i]) +
                                 Math.abs(data[i+1] - prevFrameData[i+1]) +
                                 Math.abs(data[i+2] - prevFrameData[i+2]);
                    if (diff > 90) {
                        motionCount++;
                        const pixelIndex = i / 4;
                        motionX += pixelIndex % 160;
                        motionY += Math.floor(pixelIndex / 160);
                    }
                }

                // If sudden fast forward motion cluster in center/front of screen
                if (motionCount > 1200) {
                    GameState.gesture.current = 'FORWARD_PUNCH';
                    triggerAuraPunch('WEBCAM_MOTION_OPTICAL');
                } else if (motionCount > 300) {
                    GameState.gesture.current = 'HAND_MOVING';
                } else {
                    GameState.gesture.current = 'IDLE';
                }
            }
            prevFrameData = data;
            updateGestureHUD();
        }
        requestAnimationFrame(checkMotion);
    }
    requestAnimationFrame(checkMotion);
}

function updateGestureHUD() {
    const label = document.getElementById('gesture-label');
    if (label) {
        label.innerText = GameState.gesture.current;
        label.style.color = (GameState.gesture.current === 'FORWARD_PUNCH') ? '#ef4444' : '#a78bfa';
    }
}

// ==========================================
// 5. HUD, PROGRESSION & SAVE SYSTEM
// ==========================================
function updateHUD() {
    // Player HP & Energy
    document.getElementById('player-hp-bar').style.width = `${(GameState.player.hp / GameState.player.maxHp) * 100}%`;
    document.getElementById('player-hp-text').innerText = `${Math.round(GameState.player.hp)} / ${GameState.player.maxHp}`;
    document.getElementById('player-energy-bar').style.width = `${(GameState.player.energy / GameState.player.maxEnergy) * 100}%`;
    document.getElementById('player-energy-text').innerText = `${Math.round(GameState.player.energy)} / ${GameState.player.maxEnergy}`;

    // Rank & XP
    document.getElementById('player-rank-title').innerText = `${GameState.player.title}`;
    document.getElementById('player-rank-badge').innerText = `RANK ${GameState.player.rank}`;
    document.getElementById('player-xp-bar').style.width = `${(GameState.player.xp / GameState.player.xpNeeded) * 100}%`;
    document.getElementById('player-level-text').innerText = `LV. ${GameState.player.level} (${GameState.player.xp}/${GameState.player.xpNeeded} XP)`;

    // Demon Boss Bar
    const bossHud = document.getElementById('boss-hud');
    const bossHpBar = document.getElementById('boss-hp-bar');
    const bossHpText = document.getElementById('boss-hp-text');

    if (GameState.enemy.isAlive) {
        bossHud.style.opacity = '1';
        bossHpBar.style.width = `${(GameState.enemy.hp / GameState.enemy.maxHp) * 100}%`;
        bossHpText.innerText = `${Math.round(GameState.enemy.hp)} / ${GameState.enemy.maxHp}`;
    } else {
        bossHpBar.style.width = '0%';
        bossHpText.innerText = '0 / 120 (DEFEATED)';
    }

    // Mission Tracker
    document.getElementById('mission-kills-text').innerText = `${GameState.mission.currentKills} / ${GameState.mission.targetKills} Demon`;
    if (GameState.mission.isCompleted) {
        document.getElementById('mission-checkbox').innerHTML = '&#10003;';
        document.getElementById('mission-checkbox').style.background = '#10b981';
    }
}

function saveGameProgress() {
    try {
        const saveData = {
            level: GameState.player.level,
            xp: GameState.player.xp,
            rank: GameState.player.rank,
            title: GameState.player.title,
            missionCompleted: GameState.mission.isCompleted
        };
        localStorage.setItem('shadowborn_save_data', JSON.stringify(saveData));
    } catch (e) {
        console.warn("Storage save error", e);
    }
}

function loadGameProgress() {
    try {
        const raw = localStorage.getItem('shadowborn_save_data');
        if (raw) {
            const data = JSON.parse(raw);
            GameState.player.level = data.level || 1;
            GameState.player.xp = data.xp || 0;
            GameState.player.rank = data.rank || 'E';
            GameState.player.title = data.title || 'Awakened Fighter';
        }
    } catch (e) {
        console.warn("Storage load error", e);
    }
}

function respawnDemon() {
    GameState.enemy.hp = GameState.enemy.maxHp;
    GameState.enemy.isAlive = true;
    GameState.enemy.state = 'IDLE';
    demonGroup.position.set(0, 0, -2.6);
    demonGroup.scale.set(1, 1, 1);

    document.getElementById('victory-modal').style.display = 'none';
    updateHUD();
}

// ==========================================
// 6. MAIN GAME LOOP & ANIMATION
// ==========================================
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    // Cooldown decrement
    if (GameState.gesture.cooldownTimer > 0) {
        GameState.gesture.cooldownTimer -= delta;
    }

    // Rotate Arcane Floor Runes gently
    if (arenaRuneMesh) {
        arenaRuneMesh.rotation.z += 0.0018;
    }

    // Animate Player Aura Particles & Fist
    if (playerAuraParticles) {
        playerAuraParticles.rotation.y += 0.05;
    }

    // Aura Punch Animation Interpolation
    if (punchActionActive) {
        punchProgress += delta * 7.5; // punch speed
        if (punchProgress <= 1.0) {
            // Forward thrust
            playerFist.position.z = -0.4 - Math.sin(punchProgress * Math.PI) * 1.35;
            playerFist.position.x = 0.48 - Math.sin(punchProgress * Math.PI) * 0.2;
            playerGroup.position.z = 1.8 - Math.sin(punchProgress * Math.PI) * 0.35;
        } else {
            // Retract
            punchActionActive = false;
            playerFist.position.set(0.48, 1.35, -0.4);
            playerGroup.position.z = 1.8;
        }
    } else {
        // Player Idle breathing
        playerGroup.position.y = Math.sin(elapsedTime * 2.2) * 0.035;
    }

    // Demon AI & Combat State Update
    if (GameState.enemy.isAlive) {
        if (GameState.enemy.staggerTime > 0) {
            GameState.enemy.staggerTime -= delta;
            // Flashing hit reaction
            demonMesh.material.emissive = new THREE.Color(0xffffff);
            demonMesh.material.emissiveIntensity = 0.7;
        } else {
            demonMesh.material.emissive = new THREE.Color(0x380505);
            demonMesh.material.emissiveIntensity = 0.2;

            // Demon approach if far away
            const distance = demonGroup.position.distanceTo(playerGroup.position);
            if (distance > 3.2) {
                demonGroup.position.z += delta * 0.65;
            }

            // Demon hovering menacingly
            demonGroup.position.y = Math.sin(elapsedTime * 3.0) * 0.07;
        }
    } else {
        // Defeat death dissolve: shrink into ground shadow
        if (demonGroup.scale.x > 0.01) {
            demonGroup.scale.multiplyScalar(0.94);
            demonGroup.position.y -= delta * 0.8;
        }
    }

    // Camera Shake decay
    if (shakeDuration > 0) {
        shakeDuration -= delta;
        camera.position.x = (Math.random() - 0.5) * shakeIntensity;
        camera.position.y = 2.8 + (Math.random() - 0.5) * shakeIntensity;
    } else {
        camera.position.x = 0;
        camera.position.y = 2.8;
    }

    renderer.render(scene, camera);
}

// ==========================================
// 7. INITIALIZATION & INPUT LISTENERS
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    loadGameProgress();
    init3DWorld();
    updateHUD();
    initWebcamAndTracking();

    // Fallback Controls (Spacebar & Mouse Click)
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            triggerAuraPunch('KEYBOARD_SPACE');
        }
    });

    window.addEventListener('mousedown', (e) => {
        // Only trigger if not clicking on UI buttons
        if (e.target.tagName !== 'BUTTON') {
            triggerAuraPunch('MOUSE_CLICK');
        }
    });

    const respawnBtn = document.getElementById('btn-respawn');
    if (respawnBtn) {
        respawnBtn.addEventListener('click', respawnDemon);
    }

    animate();
});
