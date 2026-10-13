using System;
using UnityEngine;
using Shadowborn.ComputerVision;

namespace Shadowborn.Input
{
    public class InputManager : MonoBehaviour
    {
        public static InputManager Instance { get; private set; }

        [Header("Fallback Testing Controls")]
        [SerializeField] private KeyCode fallbackPunchKey = KeyCode.Space;
        [SerializeField] private KeyCode fallbackLaserKey = KeyCode.Alpha1;
        [SerializeField] private KeyCode fallbackSwordKey = KeyCode.Alpha2;
        [SerializeField] private KeyCode fallbackMagicKey = KeyCode.Alpha3;
        [SerializeField] private KeyCode fallbackSummonKey = KeyCode.Alpha4;

        public event Action OnPunchAction;
        public event Action OnLaserAction;
        public event Action OnSwordAction;
        public event Action OnMagicAction;
        public event Action OnSummonAction;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        private void Start()
        {
            if (GestureRecognitionManager.Instance != null)
            {
                GestureRecognitionManager.Instance.OnGestureTriggered += HandleGestureTriggered;
            }
        }

        private void OnDestroy()
        {
            if (GestureRecognitionManager.Instance != null)
            {
                GestureRecognitionManager.Instance.OnGestureTriggered -= HandleGestureTriggered;
            }
        }

        private void Update()
        {
            // Keyboard & Mouse Fallback Controls (For accessibility and dev testing)
            if (UnityEngine.Input.GetKeyDown(fallbackPunchKey) || UnityEngine.Input.GetMouseButtonDown(0))
            {
                OnPunchAction?.Invoke();
            }
            if (UnityEngine.Input.GetKeyDown(fallbackLaserKey))
            {
                OnLaserAction?.Invoke();
            }
            if (UnityEngine.Input.GetKeyDown(fallbackSwordKey))
            {
                OnSwordAction?.Invoke();
            }
            if (UnityEngine.Input.GetKeyDown(fallbackMagicKey))
            {
                OnMagicAction?.Invoke();
            }
            if (UnityEngine.Input.GetKeyDown(fallbackSummonKey))
            {
                OnSummonAction?.Invoke();
            }
        }

        private void HandleGestureTriggered(RecognizedGesture gesture)
        {
            switch (gesture)
            {
                case RecognizedGesture.ForwardPunch:
                    OnPunchAction?.Invoke();
                    break;
                case RecognizedGesture.IndexPointing:
                    OnLaserAction?.Invoke();
                    break;
                case RecognizedGesture.SwordDraw:
                case RecognizedGesture.SwordSwing:
                    OnSwordAction?.Invoke();
                    break;
                case RecognizedGesture.TwoHandPush:
                    OnMagicAction?.Invoke();
                    break;
                case RecognizedGesture.ShadowSummon:
                    OnSummonAction?.Invoke();
                    break;
            }
        }
    }
}
