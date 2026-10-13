using System;
using UnityEngine;

namespace Shadowborn.ComputerVision
{
    public class WebcamManager : MonoBehaviour
    {
        public static WebcamManager Instance { get; private set; }

        [Header("Webcam Settings")]
        [SerializeField] private int requestedWidth = 640;
        [SerializeField] private int requestedHeight = 480;
        [SerializeField] private int requestedFPS = 30;
        [SerializeField] private bool mirrorPreview = true;

        private WebCamTexture webcamTexture;
        private string activeDeviceName;
        public bool IsRunning => webcamTexture != null && webcamTexture.isPlaying;
        public WebCamTexture Texture => webcamTexture;
        public bool MirrorPreview => mirrorPreview;

        public event Action<bool> OnWebcamStatusChanged;

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
            InitializeWebcam();
        }

        public void InitializeWebcam()
        {
            WebCamDevice[] devices = WebCamTexture.devices;
            if (devices == null || devices.Length == 0)
            {
                Debug.LogWarning("[WebcamManager] No webcam detected on system. Fallback keyboard controls available.");
                OnWebcamStatusChanged?.Invoke(false);
                return;
            }

            activeDeviceName = devices[0].name;
            Debug.Log($"[WebcamManager] Using webcam: {activeDeviceName}");

            webcamTexture = new WebCamTexture(activeDeviceName, requestedWidth, requestedHeight, requestedFPS);
            webcamTexture.Play();
            OnWebcamStatusChanged?.Invoke(true);
        }

        public void StopWebcam()
        {
            if (webcamTexture != null && webcamTexture.isPlaying)
            {
                webcamTexture.Stop();
                OnWebcamStatusChanged?.Invoke(false);
            }
        }

        private void OnDestroy()
        {
            StopWebcam();
        }
    }
}
