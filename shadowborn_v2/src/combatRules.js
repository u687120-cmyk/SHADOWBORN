/**
 * SHADOWBORN V2 - Combat Rules & Movement Engine
 * Core combat calculations, movement physics, arena constraints, and gesture classification.
 */

export const COMBAT_CONSTANTS = {
    PLAYER: {
        MAX_HP: 100,
        MAX_ENERGY: 100,
        ENERGY_REGEN_RATE: 12, // per second
        DEFENCE: 4,
        WALK_SPEED: 4.8,
        SPRINT_SPEED: 7.8,
        JUMP_FORCE: 7.5,
        GRAVITY: 18.0
    },
    ENEMY: {
        MAX_HP: 250,
        DEFENCE: 6,
        MOVE_SPEED: 3.2
    },
    ARENA: {
        RADIUS: 13.5
    },
    GESTURES: {
        DEADZONE_X: 0.08,
        DEADZONE_Y: 0.12,
        CENTER_X: 0.5,
        CENTER_Y: 0.5,
        DEBOUNCE_TIME: 0.35,
        SWIPE_VELOCITY_THRESHOLD: 1.5
    },
    ABILITIES: {
        AURA_PUNCH: {
            id: 'AURA_PUNCH',
            name: 'Aura Punch',
            baseDamage: 28,
            energyCost: 10,
            cooldown: 0.45,
            range: 3.0,
            knockback: 1.5
        },
        ROUNDHOUSE_KICK: {
            id: 'ROUNDHOUSE_KICK',
            name: 'Cursed Roundhouse Kick',
            baseDamage: 32,
            energyCost: 12,
            cooldown: 0.6,
            range: 3.2,
            knockback: 2.8
        },
        BLUE_ORB: {
            id: 'BLUE_ORB',
            name: 'Lapse: Blue',
            baseDamage: 40,
            energyCost: 25,
            cooldown: 2.0,
            range: 14.0,
            pullForce: 5.5
        },
        RED_BLAST: {
            id: 'RED_BLAST',
            name: 'Reversal: Red',
            baseDamage: 55,
            energyCost: 35,
            cooldown: 3.2,
            range: 12.0,
            knockback: 7.0
        },
        HOLLOW_PURPLE: {
            id: 'HOLLOW_PURPLE',
            name: 'Secret Art: Hollow Purple',
            baseDamage: 110,
            energyCost: 70,
            cooldown: 7.5,
            range: 18.0,
            piercing: true
        },
        INFINITY_GUARD: {
            id: 'INFINITY_GUARD',
            name: 'Infinity Guard',
            energyCostPerSec: 15,
            damageReduction: 1.0 // 100% incoming damage neutralization when active
        },
        DODGE: {
            id: 'DODGE',
            name: 'Phase Dodge',
            energyCost: 15,
            cooldown: 0.8,
            iframeDuration: 0.35,
            distance: 4.5
        },
        SIX_EYES_AWAKENING: {
            id: 'SIX_EYES_AWAKENING',
            name: 'Six Eyes Awakening',
            energyCost: 0,
            cooldown: 2.0,
            damageMultiplier: 1.3,
            speedMultiplier: 1.2
        }
    },
    ENEMY_ATTACKS: {
        CLAW: {
            id: 'CLAW',
            name: 'Cursed Claw Swipe',
            baseDamage: 18,
            range: 2.6,
            cooldown: 1.8
        },
        GROUND_SLAM: {
            id: 'GROUND_SLAM',
            name: 'Abyssal Ground Slam',
            baseDamage: 34,
            range: 4.2,
            telegraphTime: 0.8,
            cooldown: 5.0
        },
        CURSED_PROJECTILE: {
            id: 'CURSED_PROJECTILE',
            name: 'Bloodflame Orb',
            baseDamage: 22,
            speed: 9.0,
            range: 14.0,
            cooldown: 4.0
        },
        COMBO_STRIKE: {
            id: 'COMBO_STRIKE',
            name: 'Demonic Combo Flurry',
            hits: 3,
            damagePerHit: 12,
            range: 2.8,
            cooldown: 6.0
        }
    }
};

/**
 * Creates a fresh, clean combat state for Player and Enemy.
 */
export function createInitialCombatState() {
    return {
        player: {
            hp: COMBAT_CONSTANTS.PLAYER.MAX_HP,
            maxHp: COMBAT_CONSTANTS.PLAYER.MAX_HP,
            energy: COMBAT_CONSTANTS.PLAYER.MAX_ENERGY,
            maxEnergy: COMBAT_CONSTANTS.PLAYER.MAX_ENERGY,
            position: { x: 0, y: 0, z: 2.5 },
            velocity: { y: 0 },
            isGrounded: true,
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
                SIX_EYES_AWAKENING: 0
            }
        },
        enemy: {
            hp: COMBAT_CONSTANTS.ENEMY.MAX_HP,
            maxHp: COMBAT_CONSTANTS.ENEMY.MAX_HP,
            defence: COMBAT_CONSTANTS.ENEMY.DEFENCE,
            position: { x: 0, y: 0, z: -2.8 },
            state: 'IDLE', // IDLE, APPROACH, STRAFE, PREPARE_SLAM, ATTACKING, STAGGERED, DEFEATED
            staggerTimer: 0,
            currentAttack: null,
            cooldowns: {
                CLAW: 0,
                GROUND_SLAM: 0,
                CURSED_PROJECTILE: 0,
                COMBO_STRIKE: 0
            }
        },
        status: 'PLAYING' // PLAYING, VICTORY, DEFEAT, PAUSED
    };
}

/**
 * Toggle Six Eyes Awakening mode (removes blindfold, boosts stats).
 */
export function toggleSixEyesAwakening(state) {
    if (state.status !== 'PLAYING') return false;
    if (state.player.cooldowns.SIX_EYES_AWAKENING > 0) return false;

    state.player.isAwakened = !state.player.isAwakened;
    state.player.blindfoldRemoved = state.player.isAwakened;
    state.player.cooldowns.SIX_EYES_AWAKENING = COMBAT_CONSTANTS.ABILITIES.SIX_EYES_AWAKENING.cooldown;
    return state.player.isAwakened;
}

/**
 * Movement calculation with sprint, awakening boost, and delta time.
 */
export function calculateMovement(inputVector, isSprinting, isAwakened, delta) {
    if (!inputVector || (inputVector.x === 0 && inputVector.z === 0)) {
        return { dx: 0, dz: 0 };
    }
    const len = Math.hypot(inputVector.x, inputVector.z);
    let speed = isSprinting ? COMBAT_CONSTANTS.PLAYER.SPRINT_SPEED : COMBAT_CONSTANTS.PLAYER.WALK_SPEED;
    if (isAwakened) {
        speed *= COMBAT_CONSTANTS.ABILITIES.SIX_EYES_AWAKENING.speedMultiplier;
    }
    const nx = inputVector.x / len;
    const nz = inputVector.z / len;
    return {
        dx: nx * speed * delta,
        dz: nz * speed * delta
    };
}

/**
 * Jump physics update.
 */
export function processJump(playerState, delta) {
    if (!playerState.isGrounded) {
        playerState.velocity.y -= COMBAT_CONSTANTS.PLAYER.GRAVITY * delta;
        playerState.position.y += playerState.velocity.y * delta;
        if (playerState.position.y <= 0) {
            playerState.position.y = 0;
            playerState.velocity.y = 0;
            playerState.isGrounded = true;
            return 'LANDING';
        }
        return 'AIRBORNE';
    }
    return 'GROUNDED';
}

export function triggerJump(playerState) {
    if (playerState.isGrounded) {
        playerState.isGrounded = false;
        playerState.velocity.y = COMBAT_CONSTANTS.PLAYER.JUMP_FORCE;
        return true;
    }
    return false;
}

/**
 * Clamps coordinates within arena circle boundary.
 */
export function clampToArena(pos, radius = COMBAT_CONSTANTS.ARENA.RADIUS) {
    const dist = Math.hypot(pos.x, pos.z);
    if (dist > radius) {
        const factor = radius / dist;
        return {
            x: pos.x * factor,
            z: pos.z * factor
        };
    }
    return { x: pos.x, z: pos.z };
}

/**
 * Calculates dodge destination displacement with boundary safety.
 */
export function calculateDodgeDisplacement(currentPos, inputDirection, distance = 4.5, radius = COMBAT_CONSTANTS.ARENA.RADIUS) {
    let dirX = 0;
    let dirZ = 1; // Default backward (+Z)

    if (inputDirection && (inputDirection.x !== 0 || inputDirection.z !== 0)) {
        dirX = inputDirection.x || 0;
        dirZ = inputDirection.z || 0;
    }

    const len = Math.hypot(dirX, dirZ);
    if (len > 0) {
        dirX /= len;
        dirZ /= len;
    }
    const target = {
        x: currentPos.x + dirX * distance,
        z: currentPos.z + dirZ * distance
    };
    return clampToArena(target, radius);
}

/**
 * Check if player can execute a specific ability.
 */
export function canExecuteAbility(state, abilityKey) {
    if (state.status !== 'PLAYING') return false;
    const ability = COMBAT_CONSTANTS.ABILITIES[abilityKey];
    if (!ability) return false;

    // Check cooldown
    if (state.player.cooldowns[abilityKey] > 0) {
        return false;
    }

    // Check energy
    if (ability.energyCost && state.player.energy < ability.energyCost) {
        return false;
    }

    return true;
}

/**
 * Execute player ability, deduct energy and apply cooldown.
 */
export function executePlayerAbility(state, abilityKey, distanceToTarget) {
    if (!canExecuteAbility(state, abilityKey)) {
        return { success: false, reason: 'Cooldown or insufficient energy' };
    }

    const ability = COMBAT_CONSTANTS.ABILITIES[abilityKey];

    // Deduct energy
    if (ability.energyCost) {
        state.player.energy = Math.max(0, state.player.energy - ability.energyCost);
    }

    // Set cooldown
    state.player.cooldowns[abilityKey] = ability.cooldown;

    // Check hit condition
    const inRange = distanceToTarget <= ability.range;
    if (!inRange) {
        return {
            success: true,
            hit: false,
            damage: 0,
            reason: 'Target out of range'
        };
    }

    // Damage multiplier if Six Eyes Awakened
    let damageMult = 1.0;
    if (state.player.isAwakened) {
        damageMult = COMBAT_CONSTANTS.ABILITIES.SIX_EYES_AWAKENING.damageMultiplier;
    }

    // Calculate damage: baseDamage * multiplier - defence (minimum 5)
    const rawDamage = ability.baseDamage * damageMult;
    const netDamage = Math.max(5, Math.round(rawDamage - state.enemy.defence));
    state.enemy.hp = Math.max(0, state.enemy.hp - netDamage);

    // Apply stagger
    state.enemy.staggerTimer = 0.45;
    state.enemy.state = 'STAGGERED';

    if (state.enemy.hp <= 0) {
        state.enemy.state = 'DEFEATED';
        state.status = 'VICTORY';
    }

    return {
        success: true,
        hit: true,
        damage: netDamage,
        knockback: ability.knockback || 0,
        pullForce: ability.pullForce || 0
    };
}

/**
 * Toggle or set Infinity Guard state.
 */
export function setInfinityGuard(state, isActive) {
    if (state.status !== 'PLAYING') {
        state.player.isGuarding = false;
        return false;
    }

    if (isActive && state.player.energy <= 5) {
        state.player.isGuarding = false;
        return false;
    }

    state.player.isGuarding = isActive;
    return isActive;
}

/**
 * Perform a Phase Dodge with invulnerability frames.
 */
export function executeDodge(state) {
    if (!canExecuteAbility(state, 'DODGE')) {
        return { success: false };
    }

    const ability = COMBAT_CONSTANTS.ABILITIES.DODGE;
    state.player.energy = Math.max(0, state.player.energy - ability.energyCost);
    state.player.cooldowns.DODGE = ability.cooldown;
    state.player.isDodging = true;
    state.player.dodgeTimer = ability.iframeDuration;

    return { success: true, distance: ability.distance };
}

/**
 * Execute enemy attack on the player.
 */
export function executeEnemyAttack(state, attackKey, distanceToPlayer) {
    if (state.status !== 'PLAYING') return { hit: false, damage: 0 };
    const attack = COMBAT_CONSTANTS.ENEMY_ATTACKS[attackKey];
    if (!attack) return { hit: false, damage: 0 };

    // Range check
    if (distanceToPlayer > attack.range) {
        return { hit: false, damage: 0, reason: 'Missed - Out of range' };
    }

    // Invulnerability check (Dodge)
    if (state.player.isDodging) {
        return { hit: false, damage: 0, reason: 'Evaded - Phase Dodge i-frame' };
    }

    // Infinity Guard check
    if (state.player.isGuarding) {
        // Guard absorbs the attack, but drains bonus energy
        const guardDrain = 10;
        state.player.energy = Math.max(0, state.player.energy - guardDrain);
        return { hit: true, damage: 0, blocked: true, reason: 'Blocked by Infinity Guard' };
    }

    // Valid hit on player
    let totalDamage = 0;
    if (attack.hits) {
        totalDamage = Math.max(5, (attack.damagePerHit * attack.hits) - COMBAT_CONSTANTS.PLAYER.DEFENCE);
    } else {
        totalDamage = Math.max(5, attack.baseDamage - COMBAT_CONSTANTS.PLAYER.DEFENCE);
    }

    state.player.hp = Math.max(0, state.player.hp - totalDamage);

    if (state.player.hp <= 0) {
        state.status = 'DEFEAT';
    }

    return { hit: true, damage: totalDamage, blocked: false };
}

/**
 * Step combat timers (cooldowns, energy regen, i-frames).
 */
export function updateCombatTimers(state, delta) {
    if (state.status !== 'PLAYING') return;

    // Player cooldowns
    for (const key of Object.keys(state.player.cooldowns)) {
        if (state.player.cooldowns[key] > 0) {
            state.player.cooldowns[key] = Math.max(0, state.player.cooldowns[key] - delta);
        }
    }

    // Enemy cooldowns
    for (const key of Object.keys(state.enemy.cooldowns)) {
        if (state.enemy.cooldowns[key] > 0) {
            state.enemy.cooldowns[key] = Math.max(0, state.enemy.cooldowns[key] - delta);
        }
    }

    // Dodge i-frame timer
    if (state.player.isDodging) {
        state.player.dodgeTimer -= delta;
        if (state.player.dodgeTimer <= 0) {
            state.player.isDodging = false;
        }
    }

    // Enemy stagger timer
    if (state.enemy.staggerTimer > 0) {
        state.enemy.staggerTimer -= delta;
        if (state.enemy.staggerTimer <= 0 && state.enemy.hp > 0) {
            state.enemy.state = 'IDLE';
        }
    }

    // Energy management
    if (state.player.isGuarding) {
        const drain = COMBAT_CONSTANTS.ABILITIES.INFINITY_GUARD.energyCostPerSec * delta;
        state.player.energy = Math.max(0, state.player.energy - drain);
        if (state.player.energy <= 0) {
            state.player.isGuarding = false; // Guard breaks when out of energy
        }
    } else {
        // Natural energy regeneration
        const regen = COMBAT_CONSTANTS.PLAYER.ENERGY_REGEN_RATE * delta;
        state.player.energy = Math.min(state.player.maxEnergy, state.player.energy + regen);
    }
}

/**
 * Maps normalized hand position (0 to 1) to continuous movement input vector with deadzone.
 */
export function mapHandPositionToMovement(normX, normY, centerX = 0.5, centerY = 0.5, deadzoneX = 0.08, deadzoneY = 0.12) {
    if (normX === null || normY === null) {
        return { x: 0, z: 0, status: 'NO_HAND' };
    }

    const diffX = normX - centerX;
    const diffY = normY - centerY;

    let moveX = 0;
    let moveZ = 0;

    // Camera is mirrored, so moving hand to user's left means normX < centerX
    if (Math.abs(diffX) > deadzoneX) {
        moveX = diffX > 0 ? 1 : -1;
    }

    // Hand upward in camera view (normY < centerY) maps to moving forward (-Z)
    if (Math.abs(diffY) > deadzoneY) {
        moveZ = diffY < 0 ? -1 : 1;
    }

    let status = 'NEUTRAL';
    if (moveX !== 0 || moveZ !== 0) {
        const xStr = moveX < 0 ? 'LEFT' : (moveX > 0 ? 'RIGHT' : '');
        const zStr = moveZ < 0 ? 'FORWARD' : (moveZ > 0 ? 'BACKWARD' : '');
        status = `MOVING ${xStr} ${zStr}`.trim();
    }

    return { x: moveX, z: moveZ, status };
}

/**
 * Classifies 21 hand landmarks into combat gestures.
 */
export function classifyHandLandmarks(landmarks, twoHandsVisible = false, handVelocity = 0) {
    // TWO-HAND GESTURE: Hollow Purple
    if (twoHandsVisible) {
        return 'HOLLOW_PURPLE';
    }

    // Quick hand swipe / high velocity -> Red Blast
    if (handVelocity > COMBAT_CONSTANTS.GESTURES.SWIPE_VELOCITY_THRESHOLD) {
        return 'RED_BLAST';
    }

    if (!landmarks || landmarks.length < 21) {
        return 'NONE';
    }

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

    // CLOSED FIST: Aura Punch
    if (isIndexCurled && isMiddleCurled && isRingCurled && isPinkyCurled) {
        return 'AURA_PUNCH';
    }

    // INDEX FINGER POINTING: Aim Blue Orb
    if (!isIndexCurled && isMiddleCurled && isRingCurled && isPinkyCurled) {
        return 'BLUE_ORB';
    }

    // OPEN PALM: Infinity Guard
    if (!isIndexCurled && !isMiddleCurled && !isRingCurled && !isPinkyCurled) {
        return 'INFINITY_GUARD';
    }

    return 'NONE';
}
