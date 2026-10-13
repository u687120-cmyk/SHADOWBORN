using System;
using UnityEngine;

namespace Shadowborn.Core
{
    public enum GameState
    {
        MainMenu,
        Calibration,
        Playing,
        Paused,
        GameOver,
        Victory
    }

    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        [Header("Game State")]
        [SerializeField] private GameState currentState = GameState.Playing;
        public GameState CurrentState => currentState;

        public event Action<GameState> OnGameStateChanged;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        private void Start()
        {
            SetState(GameState.Playing);
        }

        public void SetState(GameState newState)
        {
            if (currentState == newState) return;
            currentState = newState;
            Debug.Log($"[GameManager] Game state changed to: {newState}");
            OnGameStateChanged?.Invoke(newState);

            Time.timeScale = (newState == GameState.Paused) ? 0f : 1f;
        }

        public void RestartMission()
        {
            SetState(GameState.Playing);
            UnityEngine.SceneManagement.SceneManager.LoadScene(
                UnityEngine.SceneManagement.SceneManager.GetActiveScene().buildIndex);
        }

        public void QuitGame()
        {
            Application.Quit();
        }
    }
}
