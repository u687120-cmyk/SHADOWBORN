import * as THREE from "three";

import {
    EffectComposer
} from "three/addons/postprocessing/EffectComposer.js";

import {
    RenderPass
} from "three/addons/postprocessing/RenderPass.js";

import {
    UnrealBloomPass
} from "three/addons/postprocessing/UnrealBloomPass.js";


/* =====================================================
   SHADOWBORN: AWAKENING
   Standalone playable prototype
===================================================== */


const $ = (id) => document.getElementById(id);

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x03040a);

scene.fog = new THREE.FogExp2(
    0x03040a,
    0.025
);


const camera = new THREE.PerspectiveCamera(
    65,
    window.innerWidth / window.innerHeight,
    0.1,
    200
);


const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance"
});

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 1.75)
);

renderer.shadowMap.enabled = true;

renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.toneMapping = THREE.ACESFilmicToneMapping;

renderer.toneMappingExposure = 1.15;

renderer.outputColorSpace = THREE.SRGBColorSpace;

$("game").prepend(renderer.domElement);


let composer = null;

try {
    composer = new EffectComposer(renderer);

    composer.addPass(new RenderPass(scene, camera));

    composer.addPass(
        new UnrealBloomPass(
            new THREE.Vector2(
                window.innerWidth,
                window.innerHeight
            ),
            0.8,
            0.45,
            0.15
        )
    );
} catch (error) {
    console.warn(
        "Post-processing unavailable. Using normal rendering.",
        error
    );
}


/* =====================================================
   LIGHTING
===================================================== */

scene.add(
    new THREE.HemisphereLight(
        0x94bfff,
        0x070816,
        2.0
    )
);

const moonLight = new THREE.DirectionalLight(
    0xb7d5ff,
    2.5
);

moonLight.position.set(8, 15, 6);

moonLight.castShadow = true;

scene.add(moonLight);


const blueLight = new THREE.PointLight(
    0x159cff,
    16,
    20
);

blueLight.position.set(0, 4, 0);

scene.add(blueLight);


/* =====================================================
   MATERIALS
===================================================== */

function material(
    color,
    options = {}
) {
    return new THREE.MeshStandardMaterial({
        color,
        roughness: 0.5,
        metalness: 0.05,
        ...options
    });
}


const MAT = {

    skin: material(0xe4c5b6),

    hair: material(
        0xf1f7ff,
        {
            roughness: 0.35
        }
    ),

    black: material(
        0x080b16,
        {
            roughness: 0.35
        }
    ),

    cloth: material(
        0x10182b,
        {
            roughness: 0.75
        }
    ),

    blue: new THREE.MeshStandardMaterial({
        color: 0x26cfff,
        emissive: 0x009dff,
        emissiveIntensity: 3,
        roughness: 0.2
    }),

    red: new THREE.MeshStandardMaterial({
        color: 0xff3158,
        emissive: 0xff003d,
        emissiveIntensity: 3,
        roughness: 0.2
    }),

    purple: new THREE.MeshStandardMaterial({
        color: 0xce72ff,
        emissive: 0x8a00ff,
        emissiveIntensity: 4,
        roughness: 0.15
    }),

    whiteGlow: new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x8bdfff,
        emissiveIntensity: 2
    }),

    enemy: material(
        0x36172c,
        {
            roughness: 0.55,
            metalness: 0.1
        }
    )
};


/* =====================================================
   WORLD
===================================================== */

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(180, 180),
    material(
        0x090d1b,
        {
            roughness: 0.9
        }
    )
);

ground.rotation.x = -Math.PI / 2;

ground.position.y = -0.06;

ground.receiveShadow = true;

scene.add(ground);


const grid = new THREE.GridHelper(
    120,
    100,
    0x173e70,
    0x101c35
);

grid.position.y = 0.015;

scene.add(grid);


/* Ruined structures */

function createPillar(x, z, height) {

    const pillar = new THREE.Mesh(
        new THREE.BoxGeometry(
            1.5,
            height,
            1.5
        ),
        material(0x171c2b)
    );

    pillar.position.set(
        x,
        height / 2,
        z
    );

    pillar.castShadow = true;

    pillar.receiveShadow = true;

    scene.add(pillar);
}


for (let i = 0; i < 20; i++) {

    const angle = Math.random() * Math.PI * 2;

    const distance = 15 + Math.random() * 25;

    const x = Math.cos(angle) * distance;

    const z = Math.sin(angle) * distance;

    createPillar(
        x,
        z,
        2 + Math.random() * 6
    );
}


/* =====================================================
   PROCEDURAL CHARACTER
===================================================== */

function makeMesh(
    geometry,
    mat,
    parent,
    position = [0, 0, 0]
) {

    const mesh = new THREE.Mesh(
        geometry,
        mat
    );

    mesh.position.set(
        position[0],
        position[1],
        position[2]
    );

    mesh.castShadow = true;

    mesh.receiveShadow = true;

    parent.add(mesh);

    return mesh;
}


function createPlayerCharacter() {

    const root = new THREE.Group();

    scene.add(root);

    const body = new THREE.Group();

    root.add(body);


    /* Torso */

    const torso = makeMesh(
        new THREE.CapsuleGeometry(
            0.43,
            0.8,
            5,
            10
        ),
        MAT.cloth,
        body,
        [0, 1.55, 0]
    );


    /* High collar */

    makeMesh(
        new THREE.BoxGeometry(
            0.72,
            0.32,
            0.45
        ),
        MAT.black,
        body,
        [0, 2.02, 0]
    );


    /* Neck */

    makeMesh(
        new THREE.CylinderGeometry(
            0.13,
            0.16,
            0.3,
            12
        ),
        MAT.skin,
        body,
        [0, 2.2, 0]
    );


    /* Head */

    const head = new THREE.Group();

    head.position.set(
        0,
        2.57,
        0
    );

    body.add(head);


    makeMesh(
        new THREE.SphereGeometry(
            0.34,
            24,
            24
        ),
        MAT.skin,
        head,
        [0, 0, 0]
    );


    /* Chin */

    makeMesh(
        new THREE.SphereGeometry(
            0.22,
            16,
            12
        ),
        MAT.skin,
        head,
        [0, -0.16, 0.07]
    );


    /* Blindfold */

    const blindfold = makeMesh(
        new THREE.BoxGeometry(
            0.62,
            0.16,
            0.58
        ),
        MAT.black,
        head,
        [0, 0.035, 0.27]
    );


    /* Eyes */

    const eyeLeft = makeMesh(
        new THREE.SphereGeometry(
            0.055,
            12,
            12
        ),
        MAT.blue,
        head,
        [-0.12, 0.02, 0.31]
    );

    const eyeRight = makeMesh(
        new THREE.SphereGeometry(
            0.055,
            12,
            12
        ),
        MAT.blue,
        head,
        [0.12, 0.02, 0.31]
    );


    /* Hair cap */

    makeMesh(
        new THREE.SphereGeometry(
            0.37,
            20,
            16
        ),
        MAT.hair,
        head,
        [0, 0.22, 0]
    );


    /* Spiky hair */

    const hairTips = [];

    for (let i = 0; i < 13; i++) {

        const angle =
            (i / 13) * Math.PI * 2;

        const radius =
            0.18 + Math.random() * 0.13;

        const spike = makeMesh(
            new THREE.ConeGeometry(
                0.12,
                0.48 + Math.random() * 0.18,
                6
            ),
            MAT.hair,
            head,
            [
                Math.cos(angle) * radius,
                0.35 + Math.random() * 0.05,
                Math.sin(angle) * radius
            ]
        );

        spike.rotation.z =
            Math.cos(angle) * -0.45;

        spike.rotation.x =
            Math.sin(angle) * 0.4;

        hairTips.push(spike);
    }


    /* Arms */

    function createArm(side) {

        const shoulder = new THREE.Group();

        shoulder.position.set(
            side * 0.48,
            1.88,
            0
        );

        body.add(shoulder);


        makeMesh(
            new THREE.CapsuleGeometry(
                0.14,
                0.48,
                4,
                8
            ),
            MAT.cloth,
            shoulder,
            [0, -0.3, 0]
        );


        const elbow = new THREE.Group();

        elbow.position.y = -0.57;

        shoulder.add(elbow);


        makeMesh(
            new THREE.CapsuleGeometry(
                0.115,
                0.42,
                4,
                8
            ),
            MAT.black,
            elbow,
            [0, -0.25, 0]
        );


        makeMesh(
            new THREE.SphereGeometry(
                0.13,
                12,
                12
            ),
            MAT.skin,
            elbow,
            [0, -0.54, 0.02]
        );


        return {
            shoulder,
            elbow
        };
    }


    const leftArm = createArm(-1);

    const rightArm = createArm(1);


    /* Legs */

    function createLeg(side) {

        const hip = new THREE.Group();

        hip.position.set(
            side * 0.21,
            1.05,
            0
        );

        body.add(hip);


        makeMesh(
            new THREE.CapsuleGeometry(
                0.17,
                0.48,
                4,
                8
            ),
            MAT.black,
            hip,
            [0, -0.36, 0]
        );


        makeMesh(
            new THREE.BoxGeometry(
                0.24,
                0.17,
                0.4
            ),
            MAT.black,
            hip,
            [0, -0.7, 0.09]
        );


        return hip;
    }


    const leftLeg = createLeg(-1);

    const rightLeg = createLeg(1);


    /* Energy aura */

    const aura = new THREE.Mesh(
        new THREE.SphereGeometry(
            0.8,
            20,
            16
        ),
        new THREE.MeshBasicMaterial({
            color: 0x31bfff,
            transparent: true,
            opacity: 0.055,
            side: THREE.DoubleSide
        })
    );

    aura.position.y = 1.45;

    body.add(aura);


    return {
        root,
        body,
        head,
        blindfold,
        eyeLeft,
        eyeRight,
        leftArm,
        rightArm,
        leftLeg,
        rightLeg,
        aura,
        hairTips
    };
}


const player = createPlayerCharacter();

player.root.position.set(
    0,
    0,
    4
);


/* =====================================================
   PLAYER STATE
===================================================== */

const state = {

    started: false,

    gameOver: false,

    victory: false,

    hp: 100,

    maxHp: 100,

    energy: 100,

    maxEnergy: 100,

    infinity: false,

    awakening: false,

    attacking: false,

    attackTime: 0,

    dodgeTime: 0,

    blueCooldown: 0,

    redCooldown: 0,

    purpleCooldown: 0,

    enemyHp: 100,

    maxEnemyHp: 100,

    enemyAttackCooldown: 1.5,

    enemyState: "APPROACH",

    gesture: "NONE"
};


/* =====================================================
   ENEMY
===================================================== */

function createEnemy() {

    const root = new THREE.Group();

    scene.add(root);


    makeMesh(
        new THREE.CapsuleGeometry(
            0.48,
            1.0,
            5,
            10
        ),
        MAT.enemy,
        root,
        [0, 1.2, 0]
    );


    makeMesh(
        new THREE.SphereGeometry(
            0.4,
            16,
            12
        ),
        material(0x29111f),
        root,
        [0, 2.15, 0]
    );


    const eyeMat = new THREE.MeshBasicMaterial({
        color: 0xff3158
    });


    makeMesh(
        new THREE.SphereGeometry(
            0.07,
            10,
            8
        ),
        eyeMat,
        root,
        [-0.13, 2.17, 0.34]
    );


    makeMesh(
        new THREE.SphereGeometry(
            0.07,
            10,
            8
        ),
        eyeMat,
        root,
        [0.13, 2.17, 0.34]
    );


    return root;
}


const enemy = createEnemy();

enemy.position.set(
    0,
    0,
    -8
);


/* =====================================================
   PARTICLES
===================================================== */

const particles = [];

function spawnParticles(
    position,
    color,
    count = 15,
    speed = 3
) {

    for (let i = 0; i < count; i++) {

        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(
                0.04 + Math.random() * 0.08,
                6,
                6
            ),
            new THREE.MeshBasicMaterial({
                color,
                transparent: true,
                opacity: 1
            })
        );


        mesh.position.copy(position);


        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * speed,
            Math.random() * speed,
            (Math.random() - 0.5) * speed
        );


        scene.add(mesh);


        particles.push({
            mesh,
            velocity,
            life: 0.8 + Math.random() * 0.8
        });
    }
}


/* =====================================================
   PROJECTILES
===================================================== */

const projectiles = [];


function spawnProjectile(
    color,
    damage,
    speed,
    radius,
    pull = false,
    push = false,
    ultimate = false
) {

    if (!state.started || state.gameOver) {
        return;
    }


    const direction = new THREE.Vector3(
        0,
        0,
        -1
    );


    direction.applyQuaternion(
        player.root.quaternion
    );


    const start = player.root.position.clone();

    start.y += 1.6;


    const geometry = new THREE.SphereGeometry(
        radius,
        18,
        14
    );


    const mesh = new THREE.Mesh(
        geometry,
        color
    );


    mesh.position.copy(start);


    const light = new THREE.PointLight(
        color.color,
        ultimate ? 14 : 6,
        9
    );


    mesh.add(light);


    scene.add(mesh);


    projectiles.push({

        mesh,

        direction,

        damage,

        speed,

        life: 2.5,

        pull,

        push,

        ultimate,

        hit: false
    });


    spawnParticles(
        start,
        color.color,
        ultimate ? 35 : 12,
        ultimate ? 7 : 3
    );


    logEvent(
        ultimate
            ? "HOLLOW PURPLE RELEASED"
            : "CURSED TECHNIQUE ACTIVATED",
        "important"
    );
}


/* =====================================================
   ABILITY SYSTEM
===================================================== */

function useAbility(type) {

    if (!state.started || state.gameOver) {
        return;
    }


    if (type === "INFINITY") {

        state.infinity = !state.infinity;

        player.aura.material.opacity =
            state.infinity ? 0.24 : 0.055;

        logEvent(
            state.infinity
                ? "INFINITY ACTIVATED"
                : "INFINITY DEACTIVATED",
            "important"
        );

        return;
    }


    if (type === "BLUE") {

        if (state.blueCooldown > 0) return;

        if (state.energy < 12) {
            logEvent("INSUFFICIENT CURSED ENERGY");
            return;
        }


        state.energy -= 12;

        state.blueCooldown = 1.0;


        spawnProjectile(
            MAT.blue,
            15,
            12,
            0.3,
            true,
            false,
            false
        );

        return;
    }


    if (type === "RED") {

        if (state.redCooldown > 0) return;

        if (state.energy < 22) {
            logEvent("INSUFFICIENT CURSED ENERGY");
            return;
        }


        state.energy -= 22;

        state.redCooldown = 2.0;


        spawnProjectile(
            MAT.red,
            24,
            15,
            0.4,
            false,
            true,
            false
        );

        return;
    }


    if (type === "PURPLE") {

        if (state.purpleCooldown > 0) return;

        if (state.energy < 55) {
            logEvent("INSUFFICIENT CURSED ENERGY");
            return;
        }


        state.energy -= 55;

        state.purpleCooldown = 6.0;


        spawnProjectile(
            MAT.purple,
            65,
            13,
            0.65,
            false,
            false,
            true
        );
    }
}


/* =====================================================
   PUNCH COMBAT
===================================================== */

function punch() {

    if (!state.started || state.gameOver) {
        return;
    }

    if (state.attacking) {
        return;
    }


    state.attacking = true;

    state.attackTime = 0.35;


    player.rightArm.shoulder.rotation.x = -1.2;

    player.rightArm.shoulder.rotation.z = -0.25;


    const distance = player.root.position.distanceTo(
        enemy.position
    );


    if (
        distance < 2.8 &&
        state.enemyHp > 0
    ) {

        damageEnemy(12);


        const knockback = new THREE.Vector3()
            .subVectors(
                enemy.position,
                player.root.position
            )
            .normalize();


        enemy.position.addScaledVector(
            knockback,
            0.8
        );


        spawnParticles(
            enemy.position.clone().add(
                new THREE.Vector3(0, 1.4, 0)
            ),
            0x48cfff,
            15,
            4
        );
    }
}


function damageEnemy(amount) {

    if (state.enemyHp <= 0) return;


    state.enemyHp = Math.max(
        0,
        state.enemyHp - amount
    );


    updateHUD();


    if (state.enemyHp === 0) {

        state.enemyState = "DEFEATED";

        logEvent(
            "CURSED VANGUARD DEFEATED",
            "important"
        );


        spawnParticles(
            enemy.position.clone().add(
                new THREE.Vector3(0, 1, 0)
            ),
            0xb75cff,
            45,
            8
        );


        state.victory = true;

        state.gameOver = true;


        showMessage(
            "MISSION COMPLETE",
            "The cursed enemy has been defeated."
        );
    }
}


function damagePlayer(amount) {

    if (state.gameOver) return;

    if (state.infinity) {

        logEvent(
            "INFINITY BLOCKED THE ATTACK",
            "important"
        );

        return;
    }


    state.hp = Math.max(
        0,
        state.hp - amount
    );


    updateHUD();


    if (state.hp <= 0) {

        state.gameOver = true;

        state.victory = false;


        showMessage(
            "AWAKENING FAILED",
            "Your cursed energy has been exhausted."
        );
    }
}


/* =====================================================
   MOVEMENT
===================================================== */

const keys = new Set();


window.addEventListener(
    "keydown",
    (event) => {

        keys.add(
            event.key.toLowerCase()
        );


        if (
            event.code === "Space" ||
            event.key.startsWith("Arrow")
        ) {
            event.preventDefault();
        }


        if (event.repeat) return;


        switch (event.key.toLowerCase()) {

            case "1":
                useAbility("BLUE");
                break;

            case "2":
                useAbility("RED");
                break;

            case "3":
                useAbility("PURPLE");
                break;

            case "q":
                useAbility("INFINITY");
                break;

            case "f":
                punch();
                break;

            case "r":
                restartGame();
                break;

            case " ":
                dodge();
                break;
        }
    }
);


window.addEventListener(
    "keyup",
    (event) => {
        keys.delete(
            event.key.toLowerCase()
        );
    }
);


renderer.domElement.addEventListener(
    "click",
    () => {

        if (!state.started || state.gameOver) {
            return;
        }

        punch();
    }
);


function dodge() {

    if (!state.started || state.gameOver) {
        return;
    }


    if (state.dodgeTime > 0) {
        return;
    }


    state.dodgeTime = 0.3;


    const direction = new THREE.Vector3(
        0,
        0,
        -1
    );

    direction.applyQuaternion(
        player.root.quaternion
    );


    player.root.position.addScaledVector(
        direction,
        -1.5
    );


    spawnParticles(
        player.root.position.clone().add(
            new THREE.Vector3(0, 1, 0)
        ),
        0x6fdcff,
        12,
        3
    );
}


function updatePlayer(delta) {

    if (!state.started || state.gameOver) {
        return;
    }


    const direction = new THREE.Vector3();


    if (
        keys.has("w") ||
        keys.has("arrowup")
    ) {
        direction.z -= 1;
    }

    if (
        keys.has("s") ||
        keys.has("arrowdown")
    ) {
        direction.z += 1;
    }

    if (
        keys.has("a") ||
        keys.has("arrowleft")
    ) {
        direction.x -= 1;
    }

    if (
        keys.has("d") ||
        keys.has("arrowright")
    ) {
        direction.x += 1;
    }


    if (direction.lengthSq() > 0) {

        direction.normalize();


        const sprint =
            keys.has("shift") ? 1.8 : 1;


        player.root.position.addScaledVector(
            direction,
            delta * 4 * sprint
        );


        player.root.rotation.y =
            Math.atan2(
                -direction.x,
                -direction.z
            );


        player.leftLeg.rotation.x =
            Math.sin(performance.now() * 0.012) * 0.5;

        player.rightLeg.rotation.x =
            -Math.sin(performance.now() * 0.012) * 0.5;
    } else {

        player.leftLeg.rotation.x *= 0.85;

        player.rightLeg.rotation.x *= 0.85;
    }


    if (state.attacking) {

        state.attackTime -= delta;

        if (state.attackTime <= 0) {

            state.attacking = false;

            player.rightArm.shoulder.rotation.x = 0;

            player.rightArm.shoulder.rotation.z = 0;
        }
    }


    if (state.dodgeTime > 0) {
        state.dodgeTime -= delta;
    }


    player.aura.rotation.y += delta * 0.8;


    player.head.rotation.y =
        Math.sin(performance.now() * 0.001) * 0.03;


    state.blueCooldown = Math.max(
        0,
        state.blueCooldown - delta
    );

    state.redCooldown = Math.max(
        0,
        state.redCooldown - delta
    );

    state.purpleCooldown = Math.max(
        0,
        state.purpleCooldown - delta
    );


    state.energy = Math.min(
        state.maxEnergy,
        state.energy + delta * 3
    );


    updateHUD();
}


/* =====================================================
   ENEMY AI
===================================================== */

function updateEnemy(delta) {

    if (
        !state.started ||
        state.gameOver ||
        state.enemyHp <= 0
    ) {
        return;
    }


    const difference = new THREE.Vector3()
        .subVectors(
            player.root.position,
            enemy.position
        );


    const distance = difference.length();


    if (distance > 2.2) {

        difference.normalize();


        enemy.position.addScaledVector(
            difference,
            delta * 1.5
        );


        enemy.rotation.y = Math.atan2(
            -difference.x,
            -difference.z
        );


        state.enemyState = "APPROACH";
    } else {

        state.enemyState = "ATTACK";

        state.enemyAttackCooldown -= delta;


        if (state.enemyAttackCooldown <= 0) {

            state.enemyAttackCooldown = 1.5;


            damagePlayer(10);


            spawnParticles(
                player.root.position.clone().add(
                    new THREE.Vector3(0, 1.2, 0)
                ),
                0xff3158,
                8,
                3
            );


            logEvent(
                "PLAYER HIT BY CURSED VANGUARD",
                "danger"
            );
        }
    }


    if (state.infinity) {
        blueLight.intensity = 24;
    } else {
        blueLight.intensity = 12;
    }
}


/* =====================================================
   PROJECTILE UPDATES
===================================================== */

function updateProjectiles(delta) {

    for (
        let i = projectiles.length - 1;
        i >= 0;
        i--
    ) {

        const p = projectiles[i];


        p.mesh.position.addScaledVector(
            p.direction,
            p.speed * delta
        );


        p.life -= delta;


        if (
            state.enemyHp > 0 &&
            !p.hit &&
            p.mesh.position.distanceTo(
                enemy.position.clone().add(
                    new THREE.Vector3(0, 1.4, 0)
                )
            ) < 1.2
        ) {

            p.hit = true;


            damageEnemy(
                p.damage
            );


            if (p.pull) {

                const pullDirection = new THREE.Vector3()
                    .subVectors(
                        p.mesh.position,
                        enemy.position
                    )
                    .normalize();


                enemy.position.addScaledVector(
                    pullDirection,
                    1.8
                );
            }


            if (p.push) {

                const pushDirection = new THREE.Vector3()
                    .subVectors(
                        enemy.position,
                        player.root.position
                    )
                    .normalize();


                enemy.position.addScaledVector(
                    pushDirection,
                    3
                );
            }


            spawnParticles(
                p.mesh.position.clone(),
                p.mesh.material.color,
                p.ultimate ? 55 : 20,
                p.ultimate ? 10 : 5
            );


            scene.remove(p.mesh);


            projectiles.splice(i, 1);

            continue;
        }


        if (p.life <= 0) {

            scene.remove(p.mesh);

            projectiles.splice(i, 1);
        }
    }
}


/* =====================================================
   PARTICLE UPDATES
===================================================== */

function updateParticles(delta) {

    for (
        let i = particles.length - 1;
        i >= 0;
        i--
    ) {

        const p = particles[i];


        p.mesh.position.addScaledVector(
            p.velocity,
            delta
        );


        p.velocity.y -= delta * 2;


        p.life -= delta;


        p.mesh.material.opacity = Math.max(
            0,
            p.life
        );


        if (p.life <= 0) {

            scene.remove(p.mesh);

            p.mesh.geometry.dispose();

            p.mesh.material.dispose();

            particles.splice(i, 1);
        }
    }
}


/* =====================================================
   CAMERA
===================================================== */

function updateCamera(delta) {

    const offset = new THREE.Vector3(
        0,
        4.0,
        7.5
    );


    offset.applyQuaternion(
        player.root.quaternion
    );


    const target = player.root.position
        .clone()
        .add(offset);


    camera.position.lerp(
        target,
        Math.min(1, delta * 5)
    );


    camera.lookAt(
        player.root.position.clone().add(
            new THREE.Vector3(0, 1.3, 0)
        )
    );
}


/* =====================================================
   HUD
===================================================== */

function updateHUD() {

    $("hpBar").style.width =
        `${state.hp / state.maxHp * 100}%`;


    $("hpText").textContent =
        `${Math.ceil(state.hp)} / ${state.maxHp}`;


    $("energyBar").style.width =
        `${state.energy / state.maxEnergy * 100}%`;


    $("energyText").textContent =
        `${Math.floor(state.energy)} / ${state.maxEnergy}`;


    $("enemyHpBar").style.width =
        `${state.enemyHp / state.maxEnemyHp * 100}%`;


    $("enemyHpText").textContent =
        `${Math.ceil(state.enemyHp)} / ${state.maxEnemyHp}`;


    $("enemyStatus").textContent =
        state.enemyHp <= 0
            ? "DEFEATED"
            : state.enemyState;
}


function logEvent(
    message,
    type = ""
) {

    const entry = document.createElement("div");

    entry.className = `log-entry ${type}`;

    entry.textContent =
        `> ${message}`;


    $("event-log").prepend(entry);


    while (
        $("event-log").children.length > 6
    ) {
        $("event-log").lastElementChild.remove();
    }
}


function showMessage(
    title,
    message
) {

    $("center-message").style.display = "block";

    $("messageTitle").textContent = title;

    $("messageText").textContent = message;

    $("startButton").textContent = "PLAY AGAIN";
}


/* =====================================================
   GAME START / RESTART
===================================================== */

function startGame() {

    state.started = true;

    state.gameOver = false;

    state.victory = false;


    $("center-message").style.display = "none";


    logEvent(
        "AWAKENING PROTOCOL INITIALIZED",
        "important"
    );


    renderer.domElement.requestPointerLock?.();
}


function restartGame() {

    state.hp = state.maxHp;

    state.energy = state.maxEnergy;

    state.enemyHp = state.maxEnemyHp;


    state.infinity = false;

    state.attacking = false;

    state.attackTime = 0;

    state.dodgeTime = 0;


    state.blueCooldown = 0;

    state.redCooldown = 0;

    state.purpleCooldown = 0;


    state.enemyAttackCooldown = 1.5;

    state.enemyState = "APPROACH";


    state.started = false;

    state.gameOver = false;

    state.victory = false;


    player.root.position.set(
        0,
        0,
        4
    );


    player.root.rotation.set(
        0,
        0,
        0
    );


    enemy.position.set(
        0,
        0,
        -8
    );


    player.aura.material.opacity = 0.055;


    for (const p of projectiles) {
        scene.remove(p.mesh);
    }

    projectiles.length = 0;


    for (const p of particles) {
        scene.remove(p.mesh);
    }

    particles.length = 0;


    updateHUD();


    showMessage(
        "AWAKENING",
        "Your cursed energy awaits."
    );


    $("startButton").textContent =
        "ENTER THE DOMAIN";
}


/* =====================================================
   WEBCAM HAND TRACKING
===================================================== */

let hands = null;

let webcamCamera = null;

let lastGestureTime = 0;

let previousWrist = null;

let fistFrames = 0;

let cameraStarting = false;


function landmarkDistance(a, b) {

    return Math.hypot(
        a.x - b.x,
        a.y - b.y,
        a.z - b.z
    );
}


function classifyGesture(landmarks) {

    const wrist = landmarks[0];


    const fingerTips = [
        landmarks[8],
        landmarks[12],
        landmarks[16],
        landmarks[20]
    ];


    const fingerPips = [
        landmarks[6],
        landmarks[10],
        landmarks[14],
        landmarks[18]
    ];


    let curled = 0;


    for (let i = 0; i < 4; i++) {

        const tipDistance = landmarkDistance(
            fingerTips[i],
            wrist
        );


        const pipDistance = landmarkDistance(
            fingerPips[i],
            wrist
        );


        if (
            tipDistance < pipDistance * 1.15
        ) {
            curled++;
        }
    }


    if (curled >= 4) {
        return "FIST";
    }


    const indexExtended =
        landmarkDistance(
            landmarks[8],
            wrist
        ) >
        landmarkDistance(
            landmarks[6],
            wrist
        ) * 1.15;


    const middleExtended =
        landmarkDistance(
            landmarks[12],
            wrist
        ) >
        landmarkDistance(
            landmarks[10],
            wrist
        ) * 1.15;


    if (
        indexExtended &&
        !middleExtended &&
        curled >= 2
    ) {
        return "POINT";
    }


    if (curled === 0) {
        return "OPEN_PALM";
    }


    return "OTHER";
}


function onHandResults(results) {

    const handsFound =
        results.multiHandLandmarks || [];


    if (handsFound.length === 0) {

        fistFrames = 0;

        previousWrist = null;

        state.gesture = "NONE";


        $("gestureText").textContent =
            "No hand detected";


        return;
    }


    const landmarks = handsFound[0];


    const gesture = classifyGesture(
        landmarks
    );


    const wrist = landmarks[0];


    let forwardMovement = false;


    if (previousWrist) {

        const dx =
            wrist.x - previousWrist.x;

        const dy =
            wrist.y - previousWrist.y;


        const movement = Math.hypot(
            dx,
            dy
        );


        forwardMovement =
            movement > 0.065;
    }


    previousWrist = {
        x: wrist.x,
        y: wrist.y
    };


    state.gesture = gesture;


    $("gestureText").textContent =
        `Detected: ${gesture}`;


    if (gesture === "FIST") {

        fistFrames++;


        if (
            forwardMovement &&
            fistFrames >= 2 &&
            performance.now() - lastGestureTime > 850
        ) {

            punch();

            lastGestureTime =
                performance.now();
        }
    } else {

        fistFrames = 0;
    }


    if (gesture === "OPEN_PALM") {

        if (
            performance.now() - lastGestureTime > 1500
        ) {

            if (!state.infinity) {
                useAbility("INFINITY");
            }

            lastGestureTime =
                performance.now();
        }
    }
}


async function enableWebcam() {

    if (cameraStarting) {
        return;
    }


    cameraStarting = true;


    try {

        $("cameraStatus").textContent =
            "CONNECTING";


        $("gestureText").textContent =
            "Initializing webcam...";


        if (!navigator.mediaDevices?.getUserMedia) {

            throw new Error(
                "Webcam requires HTTPS or localhost."
            );
        }


        if (
            typeof window.Hands !== "function" ||
            typeof window.Camera !== "function"
        ) {

            throw new Error(
                "MediaPipe libraries did not load."
            );
        }


        hands = new window.Hands({
            locateFile: (file) =>
                `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });


        hands.setOptions({

            maxNumHands: 2,

            modelComplexity: 1,

            minDetectionConfidence: 0.7,

            minTrackingConfidence: 0.65
        });


        hands.onResults(
            onHandResults
        );


        const video = $("webcam");


        webcamCamera = new window.Camera(
            video,
            {

                onFrame: async () => {

                    if (hands) {

                        await hands.send({
                            image: video
                        });
                    }
                },

                width: 640,

                height: 480
            }
        );


        await webcamCamera.start();


        $("cameraStatus").textContent =
            "ONLINE";


        $("cameraStatus").style.color =
            "#40ffbd";


        $("cameraButton").textContent =
            "WEBCAM ENABLED";


        $("gestureText").textContent =
            "Show your hand to the camera";


        logEvent(
            "WEBCAM TRACKING INITIALIZED",
            "important"
        );


    } catch (error) {

        console.error(
            "Webcam initialization failed:",
            error
        );


        $("cameraStatus").textContent =
            "ERROR";


        $("gestureText").textContent =
            error.message;


        logEvent(
            "WEBCAM INITIALIZATION FAILED",
            "danger"
        );


    } finally {

        cameraStarting = false;
    }
}


/* =====================================================
   EVENTS
===================================================== */

$("startButton").addEventListener(
    "click",
    () => {

        if (state.gameOver) {

            restartGame();

            startGame();

        } else {

            startGame();
        }
    }
);


$("cameraButton").addEventListener(
    "click",
    enableWebcam
);


/* =====================================================
   RESIZE
===================================================== */

window.addEventListener(
    "resize",
    () => {

        camera.aspect =
            window.innerWidth /
            window.innerHeight;


        camera.updateProjectionMatrix();


        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );


        if (composer) {

            composer.setSize(
                window.innerWidth,
                window.innerHeight
            );
        }
    }
);


/* =====================================================
   MAIN GAME LOOP
===================================================== */

const clock = new THREE.Clock();


function animate() {

    requestAnimationFrame(
        animate
    );


    const delta = Math.min(
        clock.getDelta(),
        0.05
    );


    updatePlayer(delta);

    updateEnemy(delta);

    updateProjectiles(delta);

    updateParticles(delta);

    updateCamera(delta);


    if (composer) {

        composer.render();

    } else {

        renderer.render(
            scene,
            camera
        );
    }
}


/* =====================================================
   INITIALIZE
===================================================== */

updateHUD();


showMessage(
    "AWAKENING",
    "Enter the domain. Defeat the Cursed Vanguard."
);


logEvent(
    "SHADOWBORN SYSTEM INITIALIZED",
    "important"
);


animate();
