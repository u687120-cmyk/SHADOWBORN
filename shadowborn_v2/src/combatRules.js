/**
 * SHADOWBORN V2 - Combat Rules Engine
 * Core combat calculations, damage formulas, ability costs, and state validation.
 */

export const COMBAT_CONSTANTS = {
    PLAYER: {
        MAX_HP: 100,
        MAX_ENERGY: 100,
        ENERGY_REGEN_RATE: 12, // per second
        DEFENCE: 4
    },
    ENEMY: {
        MAX_HP: 250,
        DEFENCE: 6,
        MOVE_SPEED: 3.2
    },
    ABILITIES: {
        AURA_PUNCH: {
            id: 'AURA_PUNCH',
            name: 'Aura Punch',
            baseDamage: 28,
            energyCost: 10,
            cooldown: 0.5,
            range: 3.0,
            knockback: 1.5
        },
        BLUE_ORB: {
            id: 'BLUE_ORB',
            name: 'Lapse: Blue Orb',
            baseDamage: 40,
            energyCost: 25,
            cooldown: 2.2,
            range: 12.0,
            pullForce: 4.0
        },
        RED_BLAST: {
            id: 'RED_BLAST',
            name: 'Reversal: Red Blast',
            baseDamage: 55,
            energyCost: 35,
            cooldown: 3.5,
            range: 10.0,
            knockback: 6.0
        },
        HOLLOW_PURPLE: {
            id: 'HOLLOW_PURPLE',
            name: 'Secret Art: Hollow Purple',
            baseDamage: 110,
            energyCost: 70,
            cooldown: 8.0,
            range: 16.0,
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
            cooldown: 1.0,
            iframeDuration: 0.35,
            distance: 4.5
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
            isGuarding: false,
            isDodging: false,
            dodgeTimer: 0,
            cooldowns: {
                AURA_PUNCH: 0,
                BLUE_ORB: 0,
                RED_BLAST: 0,
                HOLLOW_PURPLE: 0,
                DODGE: 0
            }
        },
        enemy: {
            hp: COMBAT_CONSTANTS.ENEMY.MAX_HP,
            maxHp: COMBAT_CONSTANTS.ENEMY.MAX_HP,
            defence: COMBAT_CONSTANTS.ENEMY.DEFENCE,
            state: 'IDLE', // IDLE, APPROACH, PREPARE_SLAM, ATTACKING, STAGGERED, DEFEATED
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

    // Calculate damage: baseDamage - defence (minimum 5)
    const netDamage = Math.max(5, ability.baseDamage - state.enemy.defence);
    state.enemy.hp = Math.max(0, state.enemy.hp - netDamage);

    // Apply stagger
    state.enemy.staggerTimer = 0.4;
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
