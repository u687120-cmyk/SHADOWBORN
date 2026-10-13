using System;
using UnityEngine;

namespace Shadowborn.Progression
{
    public enum HunterRank
    {
        E,
        D,
        C,
        B,
        A,
        S,
        SS,
        SSS
    }

    public class RankManager : MonoBehaviour
    {
        public static RankManager Instance { get; private set; }

        [Header("Rank Progression")]
        [SerializeField] private HunterRank currentRank = HunterRank.E;
        [SerializeField] private string title = "Awakened Fighter";

        public HunterRank CurrentRank => currentRank;
        public string Title => title;

        public event Action<HunterRank, string> OnRankPromoted;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        public void PromoteToNextRank()
        {
            if (currentRank < HunterRank.SSS)
            {
                currentRank++;
                title = GetTitleForRank(currentRank);
                Debug.Log($"[RankManager] PROMOTED! New Rank: {currentRank} ({title})");
                OnRankPromoted?.Invoke(currentRank, title);
            }
        }

        public string GetTitleForRank(HunterRank rank)
        {
            switch (rank)
            {
                case HunterRank.E: return "Human / Awakened Fighter";
                case HunterRank.D: return "Elite Hunter";
                case HunterRank.C: return "Shadow Knight";
                case HunterRank.B: return "Shadow Assassin";
                case HunterRank.A: return "Shadow Commander";
                case HunterRank.S: return "Shadow General";
                case HunterRank.SS: return "Elite Shadow Warrior";
                case HunterRank.SSS: return "Shadow Monarch";
                default: return "Hunter";
            }
        }
    }
}
