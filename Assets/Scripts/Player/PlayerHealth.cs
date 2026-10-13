using System;
using UnityEngine;

namespace Shadowborn.Player
{
    public class PlayerHealth : MonoBehaviour
    {
        [Header("Health Settings")]
        [SerializeField] private float maxHealth = 100f;
        [SerializeField] private float currentHealth;
        [SerializeField] private float maxEnergy = 100f;
        [SerializeField] private float currentEnergy;
        [SerializeField] private float energyRegenRate = 10f;

        public float CurrentHealth => currentHealth;
        public float MaxHealth => maxHealth;
        public float CurrentEnergy => currentEnergy;
        public float MaxEnergy => maxEnergy;

        public event Action<float, float> OnHealthChanged;
        public event Action<float, float> OnEnergyChanged;
        public event Action OnPlayerDefeated;

        private void Awake()
        {
            currentHealth = maxHealth;
            currentEnergy = maxEnergy;
        }

        private void Update()
        {
            if (currentEnergy < maxEnergy)
            {
                currentEnergy = Mathf.Min(maxEnergy, currentEnergy + energyRegenRate * Time.deltaTime);
                OnEnergyChanged?.Invoke(currentEnergy, maxEnergy);
            }
        }

        public void TakeDamage(float amount)
        {
            if (currentHealth <= 0f) return;

            currentHealth = Mathf.Max(0f, currentHealth - amount);
            Debug.Log($"[PlayerHealth] Player took {amount} damage. Current: {currentHealth}/{maxHealth}");
            OnHealthChanged?.Invoke(currentHealth, maxHealth);

            if (currentHealth <= 0f)
            {
                OnPlayerDefeated?.Invoke();
            }
        }

        public bool ConsumeEnergy(float amount)
        {
            if (currentEnergy >= amount)
            {
                currentEnergy -= amount;
                OnEnergyChanged?.Invoke(currentEnergy, maxEnergy);
                return true;
            }
            return false;
        }

        public void Heal(float amount)
        {
            currentHealth = Mathf.Min(maxHealth, currentHealth + amount);
            OnHealthChanged?.Invoke(currentHealth, maxHealth);
        }
    }
}
