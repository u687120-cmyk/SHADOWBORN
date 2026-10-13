using System;
using UnityEngine;

namespace Shadowborn.ComputerVision
{
    public enum RecognizedGesture
    {
        None,
        ClosedFist,
        ForwardPunch,
        IndexPointing,
        TwoHandCharge,
        TwoHandPush,
        SwordDraw,
        SwordSwing,
        ShadowSummon,
        ShieldDefense
    }

    public enum GestureState
    {
        Idle,
        Detected,
        Validated,
        Triggered,
        Cooldown,
        WaitingForRelease
    }

    [System.Serializable]
    public struct HandLandmark
    {
        public float x;
        public float y;
        public float z;
    }

    public class GestureRecognitionManager : MonoBehaviour
    {
        public static GestureRecognitionManager Instance { get; private set; }

        [Header("State Machine")]
        [SerializeField] private GestureState currentState = GestureState.Idle;
        [SerializeField] private RecognizedGesture activeGesture = RecognizedGesture.None;
        public GestureState CurrentState => currentState;
        public RecognizedGesture ActiveGesture => activeGesture;

        [Header("Tuning Parameters")]
        [SerializeField] private float punchSpeedThreshold = 1.8f;
        [SerializeField] private float punchCooldown = 0.6f;
        [SerializeField] private float confidenceThreshold = 0.65f;
        [SerializeField] private float holdDurationForValidation = 0.08f;

        private float cooldownTimer = 0f;
        private float gestureHoldTimer = 0f;
        private Vector3 previousWristPosition;
        private float estimatedVelocity = 0f;

        public float TrackingConfidence { get; private set; } = 0.85f;
        public bool IsHandTracked { get; private set; } = true;

        public event Action<RecognizedGesture> OnGestureTriggered;
        public event Action<RecognizedGesture, GestureState> OnGestureStateChanged;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        private void Update()
        {
            UpdateCooldown();
        }

        private void UpdateCooldown()
        {
            if (currentState == GestureState.Cooldown)
            {
                cooldownTimer -= Time.deltaTime;
                if (cooldownTimer <= 0f)
                {
                    TransitionToState(GestureState.WaitingForRelease);
                }
            }
        }

        public void ProcessHandLandmarks(HandLandmark[] landmarks, bool isRightHand)
        {
            if (landmarks == null || landmarks.Length < 21)
            {
                IsHandTracked = false;
                return;
            }

            IsHandTracked = true;
            Vector3 wrist = new Vector3(landmarks[0].x, landmarks[0].y, landmarks[0].z);
            Vector3 indexTip = new Vector3(landmarks[8].x, landmarks[8].y, landmarks[8].z);
            Vector3 middleTip = new Vector3(landmarks[12].x, landmarks[12].y, landmarks[12].z);
            Vector3 ringTip = new Vector3(landmarks[16].x, landmarks[16].y, landmarks[16].z);
            Vector3 pinkyTip = new Vector3(landmarks[20].x, landmarks[20].y, landmarks[20].z);

            // Calculate estimated velocity in camera space
            if (previousWristPosition != Vector3.zero)
            {
                estimatedVelocity = (wrist - previousWristPosition).magnitude / Mathf.Max(Time.deltaTime, 0.001f);
            }
            previousWristPosition = wrist;

            // Check if fingers are curled (Fist)
            bool isIndexCurled = Vector3.Distance(indexTip, wrist) < 0.28f;
            bool isMiddleCurled = Vector3.Distance(middleTip, wrist) < 0.28f;
            bool isRingCurled = Vector3.Distance(ringTip, wrist) < 0.28f;
            bool isPinkyCurled = Vector3.Distance(pinkyTip, wrist) < 0.28f;

            bool isFist = isIndexCurled && isMiddleCurled && isRingCurled && isPinkyCurled;
            bool isForwardMotion = estimatedVelocity > punchSpeedThreshold;

            RecognizedGesture detected = RecognizedGesture.None;
            if (isFist && isForwardMotion)
            {
                detected = RecognizedGesture.ForwardPunch;
            }
            else if (isFist)
            {
                detected = RecognizedGesture.ClosedFist;
            }
            else if (!isIndexCurled && isMiddleCurled && isRingCurled && isPinkyCurled)
            {
                detected = RecognizedGesture.IndexPointing;
            }

            EvaluateGestureState(detected);
        }

        public void SimulateGestureInput(RecognizedGesture gesture)
        {
            activeGesture = gesture;
            TriggerAbility(gesture);
        }

        private void EvaluateGestureState(RecognizedGesture detected)
        {
            switch (currentState)
            {
                case GestureState.Idle:
                    if (detected != RecognizedGesture.None)
                    {
                        activeGesture = detected;
                        gestureHoldTimer = 0f;
                        TransitionToState(GestureState.Detected);
                    }
                    break;

                case GestureState.Detected:
                    if (detected == activeGesture)
                    {
                        gestureHoldTimer += Time.deltaTime;
                        if (gestureHoldTimer >= holdDurationForValidation)
                        {
                            TransitionToState(GestureState.Validated);
                        }
                    }
                    else
                    {
                        TransitionToState(GestureState.Idle);
                    }
                    break;

                case GestureState.Validated:
                    TriggerAbility(activeGesture);
                    break;

                case GestureState.WaitingForRelease:
                    if (detected == RecognizedGesture.None || detected != activeGesture)
                    {
                        TransitionToState(GestureState.Idle);
                    }
                    break;
            }
        }

        private void TriggerAbility(RecognizedGesture gesture)
        {
            TransitionToState(GestureState.Triggered);
            OnGestureTriggered?.Invoke(gesture);
            Debug.Log($"[GestureRecognitionManager] Gesture Triggered: {gesture}");

            cooldownTimer = punchCooldown;
            TransitionToState(GestureState.Cooldown);
        }

        private void TransitionToState(GestureState newState)
        {
            currentState = newState;
            OnGestureStateChanged?.Invoke(activeGesture, currentState);
        }
    }
}
