import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
    createInitialCombatState,
    canExecuteAbility,
    executePlayerAbility,
    setInfinityGuard,
    executeDodge,
    executeEnemyAttack,
    updateCombatTimers,
    calculateMovement,
    clampToArena,
    calculateDodgeDisplacement,
    mapHandPositionToMovement,
    classifyHandLandmarks,
    COMBAT_CONSTANTS
} from '../src/combatRules.js';

describe('SHADOWBORN V2 - Combat Rules Engine Tests', () => {

    test('1. Initial combat state initializes properly', () => {
        const state = createInitialCombatState();
        assert.equal(state.player.hp, 100);
        assert.equal(state.player.energy, 100);
        assert.equal(state.enemy.hp, 250);
        assert.equal(state.status, 'PLAYING');
        assert.equal(state.player.isGuarding, false);
        assert.equal(state.player.isDodging, false);
    });

    test('2. Player Aura Punch deals valid damage in range and respects cooldown', () => {
        const state = createInitialCombatState();
        const initialEnemyHp = state.enemy.hp;

        // In range hit (distance = 2.0m, range = 3.0m)
        const result = executePlayerAbility(state, 'AURA_PUNCH', 2.0);
        assert.equal(result.success, true);
        assert.equal(result.hit, true);
        assert.ok(result.damage > 0);
        assert.equal(state.enemy.hp, initialEnemyHp - result.damage);
        assert.ok(state.player.cooldowns.AURA_PUNCH > 0);

        // Immediate second punch should fail due to cooldown
        const cooldownResult = executePlayerAbility(state, 'AURA_PUNCH', 2.0);
        assert.equal(cooldownResult.success, false);
    });

    test('3. Player attack out of range causes zero damage to enemy', () => {
        const state = createInitialCombatState();
        const initialEnemyHp = state.enemy.hp;

        // Distance = 15.0m, Aura Punch range = 3.0m
        const result = executePlayerAbility(state, 'AURA_PUNCH', 15.0);
        assert.equal(result.success, true);
        assert.equal(result.hit, false);
        assert.equal(result.damage, 0);
        assert.equal(state.enemy.hp, initialEnemyHp);
    });

    test('4. Blue Orb, Red Blast, and Hollow Purple execute with energy consumption', () => {
        const state = createInitialCombatState();

        // Blue Orb
        const blueRes = executePlayerAbility(state, 'BLUE_ORB', 5.0);
        assert.equal(blueRes.hit, true);
        assert.ok(blueRes.pullForce > 0);
        assert.equal(state.player.energy, 100 - COMBAT_CONSTANTS.ABILITIES.BLUE_ORB.energyCost);

        // Red Blast
        const redRes = executePlayerAbility(state, 'RED_BLAST', 4.0);
        assert.equal(redRes.hit, true);
        assert.ok(redRes.knockback > 0);

        // Hollow Purple
        const statePurple = createInitialCombatState();
        const purpleRes = executePlayerAbility(statePurple, 'HOLLOW_PURPLE', 8.0);
        assert.equal(purpleRes.hit, true);
        assert.ok(purpleRes.damage >= 100);
        assert.equal(statePurple.player.energy, 100 - COMBAT_CONSTANTS.ABILITIES.HOLLOW_PURPLE.energyCost);
    });

    test('5. Infinity Guard blocks incoming enemy damage', () => {
        const state = createInitialCombatState();
        const initialHp = state.player.hp;

        // Activate Infinity Guard
        setInfinityGuard(state, true);
        assert.equal(state.player.isGuarding, true);

        // Enemy attacks with Claw swipe within range
        const attackRes = executeEnemyAttack(state, 'CLAW', 2.0);
        assert.equal(attackRes.hit, true);
        assert.equal(attackRes.blocked, true);
        assert.equal(attackRes.damage, 0);
        assert.equal(state.player.hp, initialHp, 'Player HP should not decrease while Infinity Guard is active');
    });

    test('6. Phase Dodge i-frames evade incoming attacks completely', () => {
        const state = createInitialCombatState();
        const initialHp = state.player.hp;

        // Perform Dodge
        executeDodge(state);
        assert.equal(state.player.isDodging, true);

        // Enemy performs Ground Slam within range
        const slamRes = executeEnemyAttack(state, 'GROUND_SLAM', 3.0);
        assert.equal(slamRes.hit, false);
        assert.equal(slamRes.damage, 0);
        assert.equal(state.player.hp, initialHp);
    });

    test('7. Unguarded enemy attack damages player on valid hit', () => {
        const state = createInitialCombatState();
        const initialHp = state.player.hp;

        // Valid Claw swipe without guard or dodge
        const attackRes = executeEnemyAttack(state, 'CLAW', 2.0);
        assert.equal(attackRes.hit, true);
        assert.equal(attackRes.blocked, false);
        assert.ok(attackRes.damage > 0);
        assert.equal(state.player.hp, initialHp - attackRes.damage);
    });

    test('8. Out of range enemy attack misses player and deals no damage', () => {
        const state = createInitialCombatState();
        const initialHp = state.player.hp;

        // Claw attack at distance 8.0m (range = 2.6m)
        const attackRes = executeEnemyAttack(state, 'CLAW', 8.0);
        assert.equal(attackRes.hit, false);
        assert.equal(attackRes.damage, 0);
        assert.equal(state.player.hp, initialHp);
    });

    test('9. Cursed Projectiles and Combo Strikes damage player correctly', () => {
        const state = createInitialCombatState();

        // Projectile attack
        const projRes = executeEnemyAttack(state, 'CURSED_PROJECTILE', 10.0);
        assert.equal(projRes.hit, true);
        assert.ok(projRes.damage > 0);

        // Combo strike
        const stateCombo = createInitialCombatState();
        const comboRes = executeEnemyAttack(stateCombo, 'COMBO_STRIKE', 2.2);
        assert.equal(comboRes.hit, true);
        assert.ok(comboRes.damage >= 25);
    });

    test('10. Victory and Defeat trigger accurately', () => {
        const victoryState = createInitialCombatState();
        victoryState.enemy.hp = 10;
        executePlayerAbility(victoryState, 'AURA_PUNCH', 2.0);
        assert.equal(victoryState.enemy.hp, 0);
        assert.equal(victoryState.status, 'VICTORY');

        const defeatState = createInitialCombatState();
        defeatState.player.hp = 10;
        executeEnemyAttack(defeatState, 'GROUND_SLAM', 2.0);
        assert.equal(defeatState.player.hp, 0);
        assert.equal(defeatState.status, 'DEFEAT');
    });

    test('11. Timer update decrements cooldowns and regenerates energy', () => {
        const state = createInitialCombatState();
        state.player.energy = 50;
        state.player.cooldowns.AURA_PUNCH = 0.5;

        updateCombatTimers(state, 0.5);

        assert.equal(state.player.cooldowns.AURA_PUNCH, 0);
        assert.ok(state.player.energy > 50, 'Energy should have regenerated');
    });

    test('12. Movement calculation produces correct velocity and respects sprint', () => {
        const delta = 0.1;
        const walk = calculateMovement({ x: 0, z: -1 }, false, delta);
        assert.ok(walk.dz < 0, 'Should move forward (-Z)');
        assert.equal(walk.dx, 0);

        const sprint = calculateMovement({ x: 0, z: -1 }, true, delta);
        assert.ok(Math.abs(sprint.dz) > Math.abs(walk.dz), 'Sprint should be faster than walk');

        const idle = calculateMovement({ x: 0, z: 0 }, false, delta);
        assert.equal(idle.dx, 0);
        assert.equal(idle.dz, 0);
    });

    test('13. Arena boundary collision clamps position within circle radius', () => {
        const inside = { x: 5, z: 5 };
        const clampedInside = clampToArena(inside, 13.5);
        assert.equal(clampedInside.x, 5);
        assert.equal(clampedInside.z, 5);

        const outside = { x: 20, z: 0 };
        const clampedOutside = clampToArena(outside, 13.5);
        assert.equal(clampedOutside.x, 13.5);
        assert.equal(clampedOutside.z, 0);
    });

    test('14. Dodge displacement calculates target position safely within arena', () => {
        const currentPos = { x: 0, z: 0 };
        const inputDir = { x: 1, z: 0 }; // dodge right
        const target = calculateDodgeDisplacement(currentPos, inputDir, 4.5, 13.5);
        assert.equal(target.x, 4.5);
        assert.equal(target.z, 0);
    });

    test('15. Hand gesture mapping detects continuous directions and deadzones', () => {
        // Neutral center within deadzone -> 0 movement
        const neutral = mapHandPositionToMovement(0.51, 0.51, 0.5, 0.5, 0.08, 0.12);
        assert.equal(neutral.x, 0);
        assert.equal(neutral.z, 0);
        assert.equal(neutral.status, 'NEUTRAL');

        // Moved to right -> moveX = 1
        const right = mapHandPositionToMovement(0.70, 0.50, 0.5, 0.5, 0.08, 0.12);
        assert.equal(right.x, 1);
        assert.equal(right.z, 0);

        // Moved forward (up in video) -> moveZ = -1
        const forward = mapHandPositionToMovement(0.50, 0.30, 0.5, 0.5, 0.08, 0.12);
        assert.equal(forward.x, 0);
        assert.equal(forward.z, -1);

        // Tracking lost (null) -> 0 movement safely
        const lost = mapHandPositionToMovement(null, null);
        assert.equal(lost.x, 0);
        assert.equal(lost.z, 0);
        assert.equal(lost.status, 'NO_HAND');
    });

    test('16. Hand landmark classification correctly identifies gestures', () => {
        // Two hands -> Hollow Purple
        assert.equal(classifyHandLandmarks([], true), 'HOLLOW_PURPLE');

        // Simulated closed fist landmarks (all fingertips near wrist at 0,0,0)
        const fistLandmarks = Array(21).fill(0).map((_, i) => {
            if ([8, 12, 16, 20].includes(i)) return { x: 0.1, y: 0.1, z: 0 }; // curled near wrist
            return { x: 0, y: 0, z: 0 };
        });
        assert.equal(classifyHandLandmarks(fistLandmarks), 'AURA_PUNCH');

        // Simulated pointing (index far from wrist, other fingers curled)
        const pointLandmarks = Array(21).fill(0).map((_, i) => {
            if (i === 8) return { x: 0.8, y: 0.8, z: 0 }; // extended index
            return { x: 0.1, y: 0.1, z: 0 };
        });
        assert.equal(classifyHandLandmarks(pointLandmarks), 'BLUE_ORB');

        // Simulated open palm (all fingertips extended far from wrist)
        const palmLandmarks = Array(21).fill(0).map((_, i) => {
            if ([8, 12, 16, 20].includes(i)) return { x: 0.8, y: 0.8, z: 0 }; // all extended
            return { x: 0.1, y: 0.1, z: 0 };
        });
        assert.equal(classifyHandLandmarks(palmLandmarks), 'INFINITY_GUARD');
    });
});
