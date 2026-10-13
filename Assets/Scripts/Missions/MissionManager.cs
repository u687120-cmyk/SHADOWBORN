using System;
using System.Collections.Generic;
using UnityEngine;
using Shadowborn.Enemies;

namespace Shadowborn.Missions
{
    [System.Serializable]
    public class MissionData
    {
        public int id;
        public string title;
        public string description;
        public string objective;
        public int targetKills;
        public int currentKills;
        public int xpReward;
        public bool isCompleted;
    }

    public class MissionManager : MonoBehaviour
    {
        public static MissionManager Instance { get; private set; }

        [Header("Active Campaign")]
        [SerializeField] private List<MissionData> missions = new List<MissionData>();
        [SerializeField] private int activeMissionIndex = 0;

        public MissionData ActiveMission => (activeMissionIndex >= 0 && activeMissionIndex < missions.Count) ? missions[activeMissionIndex] : null;

        public event Action<MissionData> OnMissionUpdated;
        public event Action<MissionData> OnMissionCompleted;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            InitializeDefaultMissions();
        }

        private void InitializeDefaultMissions()
        {
            missions.Clear();
            missions.Add(new MissionData {
                id = 1,
                title = "THE AWAKENING",
                description = "Learn basic movement and perform your first aura punch with your real hand gesture.",
                objective = "Defeat the first demon with Aura Punch",
                targetKills = 1,
                currentKills = 0,
                xpReward = 100,
                isCompleted = false
            });
            missions.Add(new MissionData {
                id = 2,
                title = "ENERGY MANIFESTATION",
                description = "Unlock the finger laser and strike enemies from a distance.",
                objective = "Defeat 2 ranged demons using energy beam",
                targetKills = 2,
                currentKills = 0,
                xpReward = 200,
                isCompleted = false
            });
            missions.Add(new MissionData {
                id = 3,
                title = "THE SUMMONED BLADE",
                description = "Draw the blade of shadow and strike down the elite vanguard.",
                objective = "Defeat an elite demon using sword combat",
                targetKills = 1,
                currentKills = 0,
                xpReward = 300,
                isCompleted = false
            });
        }

        public void RegisterEnemyDefeat(EnemyHealth enemy)
        {
            var mission = ActiveMission;
            if (mission != null && !mission.isCompleted)
            {
                mission.currentKills++;
                Debug.Log($"[MissionManager] Mission '{mission.title}' progress: {mission.currentKills}/{mission.targetKills}");
                OnMissionUpdated?.Invoke(mission);

                if (mission.currentKills >= mission.targetKills)
                {
                    CompleteMission(mission);
                }
            }
        }

        private void CompleteMission(MissionData mission)
        {
            mission.isCompleted = true;
            Debug.Log($"[MissionManager] Mission Completed: {mission.title}! Awarding {mission.xpReward} XP.");
            OnMissionCompleted?.Invoke(mission);

            if (activeMissionIndex + 1 < missions.Count)
            {
                activeMissionIndex++;
                OnMissionUpdated?.Invoke(ActiveMission);
            }
        }
    }
}
