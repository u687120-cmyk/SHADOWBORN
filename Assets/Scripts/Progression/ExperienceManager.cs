using System;
using UnityEngine;

namespace Shadowborn.Progression
{
    public class ExperienceManager : MonoBehaviour
    {
        public static ExperienceManager Instance { get; private set; }

        [Header("Experience & Level")]
        [SerializeField] private int currentLevel = 1;
        [SerializeField] private int currentXP = 0;
        [SerializeField] private int xpToNextLevel = 100;

        public int CurrentLevel => currentLevel;
        public int CurrentXP => currentXP;
        public int XPToNextLevel => xpToNextLevel;

        public event Action<int, int> OnXPUpdated;
        public event Action<int> OnLevelUp;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        public void AddXP(int amount)
        {
            currentXP += amount;
            Debug.Log($"[ExperienceManager] Gained {amount} XP. Total: {currentXP}/{xpToNextLevel}");

            while (currentXP >= xpToNextLevel)
            {
                currentXP -= xpToNextLevel;
                currentLevel++;
                xpToNextLevel = Mathf.RoundToInt(xpToNextLevel * 1.5f);
                Debug.Log($"[ExperienceManager] LEVEL UP! Level: {currentLevel}");
                OnLevelUp?.Invoke(currentLevel);

                if (RankManager.Instance != null && currentLevel % 5 == 0)
                {
                    RankManager.Instance.PromoteToNextRank();
                }
            }

            OnXPUpdated?.Invoke(currentXP, xpToNextLevel);
        }
    }
}
