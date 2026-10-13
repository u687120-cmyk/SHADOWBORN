using System;
using UnityEngine;

namespace Shadowborn.Enemies
{
    public class EnemyHealth : MonoBehaviour
    {
        [Header("Stats")]
        [SerializeField] private float maxHealth = 100f;
        [SerializeField] private float currentHealth;
        [SerializeField] private float defence = 5f;
        [SerializeField] private int experienceReward = 50;

        public float CurrentHealth => currentHealth;
        public float MaxHealth => maxHealth;
        public float Defence => defence;
        public int ExperienceReward => experienceReward;
        public bool IsAlive => currentHealth > 0f;

        public event Action<float, float> OnHealthChanged;
        public event Action<float, Vector3> OnDamaged;
        public event Action<EnemyHealth> OnDefeated;

        private void Awake()
        {
            currentHealth = maxHealth;
        }

        public void TakeDamage(float damage, Vector3 knockback)
        {
            if (!IsAlive) return;

            currentHealth = Mathf.Max(0f, currentHealth - damage);
            Debug.Log($"[EnemyHealth] {gameObject.name} took {damage} damage! Remaining: {currentHealth}/{maxHealth}");

            OnDamaged?.Invoke(damage, knockback);
            OnHealthChanged?.Invoke(currentHealth, maxHealth);

            if (currentHealth <= 0f)
            {
                Die();
            }
        }

        private void Die()
        {
            Debug.Log($"[EnemyHealth] {gameObject.name} has been defeated!");
            OnDefeated?.Invoke(this);
            Destroy(gameObject, 1.5f);
        }
    }
}
