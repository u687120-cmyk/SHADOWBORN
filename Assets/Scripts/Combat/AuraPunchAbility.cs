using System;
using UnityEngine;
using Shadowborn.Enemies;

namespace Shadowborn.Combat
{
    public class AuraPunchAbility : MonoBehaviour
    {
        [Header("Aura Punch Parameters")]
        [SerializeField] private float baseDamage = 35f;
        [SerializeField] private float attackRange = 3.5f;
        [SerializeField] private float attackAngle = 70f;
        [SerializeField] private float attackCooldown = 0.5f;
        [SerializeField] private float energyCost = 5f;
        [SerializeField] private float knockbackForce = 5f;

        [Header("Effects & Transforms")]
        [SerializeField] private Transform fistOrigin;
        [SerializeField] private ParticleSystem auraVFX;
        [SerializeField] private ParticleSystem impactShockwavePrefab;
        [SerializeField] private LayerMask enemyLayers;

        private float lastAttackTime = -99f;
        public bool IsOnCooldown => Time.time < lastAttackTime + attackCooldown;

        public event Action OnPunchExecuted;
        public event Action<EnemyHealth, float> OnEnemyHit;

        public bool ExecutePunch(Transform playerTransform, float playerAttackMultiplier = 1f)
        {
            if (IsOnCooldown) return false;

            lastAttackTime = Time.time;
            OnPunchExecuted?.Invoke();

            // Trigger aura particle effect
            if (auraVFX != null)
            {
                auraVFX.Play();
            }

            Vector3 attackOrigin = fistOrigin != null ? fistOrigin.position : playerTransform.position + playerTransform.forward * 0.5f + Vector3.up * 1.2f;

            // Overlap sphere to find enemies in range
            Collider[] hitColliders = Physics.OverlapSphere(attackOrigin, attackRange, enemyLayers);
            bool hitAnyEnemy = false;

            foreach (var col in hitColliders)
            {
                Vector3 directionToTarget = (col.transform.position - playerTransform.position).normalized;
                float angle = Vector3.Angle(playerTransform.forward, directionToTarget);

                if (angle <= attackAngle)
                {
                    EnemyHealth enemyHealth = col.GetComponent<EnemyHealth>();
                    if (enemyHealth != null && enemyHealth.IsAlive)
                    {
                        float calculatedDamage = DamageSystem.CalculateDamage(
                            baseDamage,
                            playerAttackMultiplier,
                            1f,
                            enemyHealth.Defence
                        );

                        enemyHealth.TakeDamage(calculatedDamage, playerTransform.forward * knockbackForce);
                        OnEnemyHit?.Invoke(enemyHealth, calculatedDamage);
                        hitAnyEnemy = true;

                        // Spawn impact shockwave at enemy contact point
                        if (impactShockwavePrefab != null)
                        {
                            Instantiate(impactShockwavePrefab, col.transform.position + Vector3.up * 1f, Quaternion.identity);
                        }
                    }
                }
            }

            return true;
        }
    }
}
