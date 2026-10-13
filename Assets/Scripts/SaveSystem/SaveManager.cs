using System;
using System.IO;
using UnityEngine;
using Shadowborn.Progression;

namespace Shadowborn.SaveSystem
{
    [Serializable]
    public class SaveData
    {
        public int saveVersion = 1;
        public int playerLevel = 1;
        public int currentXP = 0;
        public int rankIndex = 0;
        public string rankTitle = "Human";
        public int completedMissionsCount = 0;
        public float masterVolume = 1f;
        public float gestureSensitivity = 1f;
    }

    public class SaveManager : MonoBehaviour
    {
        public static SaveManager Instance { get; private set; }

        private string saveFilePath;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            saveFilePath = Path.Combine(Application.persistentDataPath, "shadowborn_save.json");
        }

        public void SaveGame()
        {
            try
            {
                SaveData data = new SaveData();
                if (ExperienceManager.Instance != null)
                {
                    data.playerLevel = ExperienceManager.Instance.CurrentLevel;
                    data.currentXP = ExperienceManager.Instance.CurrentXP;
                }
                if (RankManager.Instance != null)
                {
                    data.rankIndex = (int)RankManager.Instance.CurrentRank;
                    data.rankTitle = RankManager.Instance.Title;
                }

                string json = JsonUtility.ToJson(data, true);
                File.WriteAllText(saveFilePath, json);
                Debug.Log($"[SaveManager] Game saved successfully to: {saveFilePath}");
            }
            catch (Exception ex)
            {
                Debug.LogError($"[SaveManager] Failed to save game: {ex.Message}");
            }
        }

        public SaveData LoadGame()
        {
            try
            {
                if (File.Exists(saveFilePath))
                {
                    string json = File.ReadAllText(saveFilePath);
                    SaveData data = JsonUtility.FromJson<SaveData>(json);
                    Debug.Log("[SaveManager] Game loaded successfully.");
                    return data;
                }
            }
            catch (Exception ex)
            {
                Debug.LogError($"[SaveManager] Failed to load save file: {ex.Message}");
            }
            return new SaveData();
        }
    }
}
