using UnityEngine;
using Shadowborn.Player;

namespace Shadowborn.Enemies
{
    public enum EnemyState
    {
        Idle,
        Patrol,
        DetectPlayer,
        Approach,
        PrepareAttack,
        Attack,
        Recover,
        Staggered,
        Defeated
    }

    public class EnemyAIController : MonoBehaviour
    {
        [Header("AI Parameters")]
        [SerializeField] private float detectionRange = 12f;
        [SerializeField] private float attackRange = 2f;
        [SerializeField] private float moveSpeed = 3.2f;
        [SerializeField] private float attackCooldown = 1.8f;
        [SerializeField] private float attackDamage = 15f;

        [Header("State")]
        [SerializeField] private EnemyState currentState = EnemyState.Idle;

        private Transform playerTransform;
        private EnemyHealth enemyHealth;
        private CharacterController characterController;
        private float lastAttackTime = 0f;
        private float staggerTimer = 0f;

        private void Awake()
        {
            enemyHealth = GetComponent<EnemyHealth>();
            characterController = GetComponent<CharacterController>();
        }

        private void Start()
        {
            GameObject playerObj = GameObject.FindGameObjectWithTag("Player");
            if (playerObj != null)
            {
                playerTransform = playerObj.transform;
            }

            if (enemyHealth != null)
            {
                enemyHealth.OnDamaged += HandleDamageReaction;
                enemyHealth.OnDefeated += HandleDefeated;
            }
        }

        private void OnDestroy()
        {
            if (enemyHealth != null)
            {
                enemyHealth.OnDamaged -= HandleDamageReaction;
                enemyHealth.OnDefeated -= HandleDefeated;
            }
        }

        private void Update()
        {
            if (currentState == EnemyState.Defeated) return;

            if (currentState == EnemyState.Staggered)
            {
                staggerTimer -= Time.deltaTime;
                if (staggerTimer <= 0f)
                {
                    currentState = EnemyState.DetectPlayer;
                }
                return;
            }

            if (playerTransform == null) return;

            float distanceToPlayer = Vector3.Distance(transform.position, playerTransform.position);

            switch (currentState)
            {
                case EnemyState.Idle:
                    if (distanceToPlayer <= detectionRange)
                    {
                        currentState = EnemyState.Approach;
                    }
                    break;

                case EnemyState.Approach:
                    if (distanceToPlayer <= attackRange)
                    {
                        currentState = EnemyState.PrepareAttack;
                    }
                    else if (distanceToPlayer > detectionRange * 1.5f)
                    {
                        currentState = EnemyState.Idle;
                    }
                    else
                    {
                        MoveTowardPlayer();
                    }
                    break;

                case EnemyState.PrepareAttack:
                    FacePlayer();
                    if (Time.time >= lastAttackTime + attackCooldown)
                    {
                        ExecuteAttack();
                    }
                    else if (distanceToPlayer > attackRange * 1.2f)
                    {
                        currentState = EnemyState.Approach;
                    }
                    break;

                case EnemyState.Recover:
                    if (Time.time >= lastAttackTime + 0.6f)
                    {
                        currentState = EnemyState.Approach;
                    }
                    break;
            }
        }

        private void MoveTowardPlayer()
        {
            Vector3 direction = (playerTransform.position - transform.position).normalized;
            direction.y = 0f;

            if (direction != Vector3.zero)
            {
                transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(direction), 8f * Time.deltaTime);
                Vector3 move = direction * moveSpeed * Time.deltaTime;
                if (characterController != null)
                {
                    characterController.Move(move);
                }
                else
                {
                    transform.position += move;
                }
            }
        }

        private void FacePlayer()
        {
            Vector3 direction = (playerTransform.position - transform.position).normalized;
            direction.y = 0f;
            if (direction != Vector3.zero)
            {
                transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(direction), 10f * Time.deltaTime);
            }
        }

        private void ExecuteAttack()
        {
            currentState = EnemyState.Attack;
            lastAttackTime = Time.time;
            Debug.Log($"[EnemyAIController] {gameObject.name} attacks the player!");

            PlayerHealth pHealth = playerTransform.GetComponent<PlayerHealth>();
            if (pHealth != null)
            {
                pHealth.TakeDamage(attackDamage);
            }

            currentState = EnemyState.Recover;
        }

        private void HandleDamageReaction(float damage, Vector3 knockback)
        {
            currentState = EnemyState.Staggered;
            staggerTimer = 0.35f;

            // Apply knockback
            if (characterController != null)
            {
                characterController.Move(knockback * Time.deltaTime);
            }
            else
            {
                transform.position += knockback * 0.1f;
            }
        }

        private void HandleDefeated(EnemyHealth health)
        {
            currentState = EnemyState.Defeated;
        }
    }
}
