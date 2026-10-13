using UnityEngine;

namespace Shadowborn.Player
{
    public class PlayerController : MonoBehaviour
    {
        [Header("Movement")]
        [SerializeField] private float moveSpeed = 6f;
        [SerializeField] private float rotationSpeed = 10f;
        [SerializeField] private CharacterController characterController;
        [SerializeField] private Animator animator;

        private Vector3 moveDirection;

        private void Awake()
        {
            if (characterController == null)
                characterController = GetComponent<CharacterController>();
            if (animator == null)
                animator = GetComponentInChildren<Animator>();
        }

        private void Update()
        {
            HandleMovement();
        }

        private void HandleMovement()
        {
            float horizontal = UnityEngine.Input.GetAxis("Horizontal");
            float vertical = UnityEngine.Input.GetAxis("Vertical");

            Vector3 input = new Vector3(horizontal, 0f, vertical).normalized;

            if (input.magnitude >= 0.1f)
            {
                float targetAngle = Mathf.Atan2(input.x, input.z) * Mathf.Rad2Deg;
                transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.Euler(0f, targetAngle, 0f), rotationSpeed * Time.deltaTime);

                Vector3 move = input * moveSpeed * Time.deltaTime;
                if (characterController != null)
                {
                    characterController.Move(move);
                }
                else
                {
                    transform.position += move;
                }

                if (animator != null)
                {
                    animator.SetFloat("Speed", input.magnitude);
                }
            }
            else
            {
                if (animator != null)
                {
                    animator.SetFloat("Speed", 0f);
                }
            }
        }
    }
}
