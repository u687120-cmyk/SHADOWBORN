using UnityEngine;
using UnityEngine.UI;
using Shadowborn.Player;
using Shadowborn.Missions;
using Shadowborn.Progression;
using Shadowborn.ComputerVision;

namespace Shadowborn.UI
{
    public class GameUIManager : MonoBehaviour
    {
        public static GameUIManager Instance { get; private set; }

        [Header("HUD Sliders & Text")]
        [SerializeField] private Slider playerHealthBar;
        [SerializeField] private Slider playerEnergyBar;
        [SerializeField] private Slider enemyHealthBar;
        [SerializeField] private Text rankText;
        [SerializeField] private Text levelText;
        [SerializeField] private Text missionTitleText;
        [SerializeField] private Text missionObjectiveText;
        [SerializeField] private Text gestureDebugText;
        [SerializeField] private RawImage webcamPreviewImage;

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
            if (WebcamManager.Instance != null && webcamPreviewImage != null)
            {
                webcamPreviewImage.texture = WebcamManager.Instance.Texture;
            }

            if (GestureRecognitionManager.Instance != null)
            {
                GestureRecognitionManager.Instance.OnGestureStateChanged += HandleGestureStateChanged;
            }
        }

        private void OnDestroy()
        {
            if (GestureRecognitionManager.Instance != null)
            {
                GestureRecognitionManager.Instance.OnGestureStateChanged -= HandleGestureStateChanged;
            }
        }

        public void UpdatePlayerHealth(float current, float max)
        {
            if (playerHealthBar != null)
                playerHealthBar.value = current / Mathf.Max(max, 1f);
        }

        public void UpdateEnemyHealth(float current, float max)
        {
            if (enemyHealthBar != null)
                enemyHealthBar.value = current / Mathf.Max(max, 1f);
        }

        public void UpdateMissionInfo(string title, string objective)
        {
            if (missionTitleText != null) missionTitleText.text = title;
            if (missionObjectiveText != null) missionObjectiveText.text = objective;
        }

        private void HandleGestureStateChanged(RecognizedGesture gesture, GestureState state)
        {
            if (gestureDebugText != null)
            {
                gestureDebugText.text = $"Gesture: {gesture} [{state}]";
            }
        }
    }
}
