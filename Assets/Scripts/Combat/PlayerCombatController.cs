using UnityEngine;
using Shadowborn.Input;
using Shadowborn.Player;

namespace Shadowborn.Combat
{
    public class PlayerCombatController : MonoBehaviour
    {
        [Header("Abilities")]
        [SerializeField] private AuraPunchAbility auraPunchAbility;
        [SerializeField] private PlayerHealth playerHealth;
        [SerializeField] private Animator animator;

        [Header("Combat Stats")]
        [SerializeField] private float attackMultiplier = 1f;

        private void Awake()
        {
            if (auraPunchAbility == null)
                auraPunchAbility = GetComponent<AuraPunchAbility>();
            if (playerHealth == null)
                playerHealth = GetComponent<PlayerHealth>();
            if (animator == null)
                animator = GetComponentInChildren<Animator>();
        }

        private void Start()
        {
            if (InputManager.Instance != null)
            {
                InputManager.Instance.OnPunchAction += HandlePunchInput;
            }
        }

        private void OnDestroy()
        {
            if (InputManager.Instance != null)
            {
                InputManager.Instance.OnPunchAction -= HandlePunchInput;
            }
        }

        public void HandlePunchInput()
        {
            if (auraPunchAbility == null || auraPunchAbility.IsOnCooldown) return;

            // Trigger player character punch animation
            if (animator != null)
            {
                animator.SetTrigger("Punch");
            }

            // Execute the aura punch ability
            auraPunchAbility.ExecutePunch(transform, attackMultiplier);
        }

        public void SetAttackMultiplier(float multiplier)
        {
            attackMultiplier = multiplier;
        }
    }
}
