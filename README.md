# SHADOWBORN: AWAKENING
> *"Born Human. Awakened God."*

**SHADOWBORN: AWAKENING** is a real-time webcam-controlled 3D dark fantasy action RPG. The player starts as an ordinary human who discovers the supernatural power of Shadow Awakening after portals open between the mortal world and a cursed demon dimension. Using real physical hand gestures captured by a webcam, the player unleashes supernatural combat abilities, defeats demons, commands a summoned shadow army, and ascends to the title of Shadow Monarch.

---

## ⚡ Instant Play & Quick Start (Phase 1 Playable Prototype)

You can launch and play the real-time 3D game right now on your Windows PC using your integrated or external webcam!

### Option 1: One-Click Windows Launcher
1. Double-click `launch_game.bat` in this folder.
2. The game server will start on `http://127.0.0.1:8080` and automatically open your default browser (Google Chrome / Microsoft Edge).
3. Allow webcam access when prompted.
4. Close your fist and thrust it forward in front of the camera to execute a supernatural **Aura Punch**!

### Option 2: Terminal / Command Line
```powershell
node server.js
```
Then visit `http://127.0.0.1:8080` in Chrome or Edge.

---

## 🎮 Combat Controls

| Action | Primary Input (Webcam Gesture) | Fallback / Dev Testing Input |
| :--- | :--- | :--- |
| **Aura Punch** | **Closed Fist** + **Thrust Forward** into camera | `[SPACEBAR]` or `Left Mouse Click` |
| **Locomotion** | Third-Person Auto Target / Strafe | `[W]`, `[A]`, `[S]`, `[D]` |
| **Respawn / Reset** | UI Button after defeat | Click "Fight Again" button |

---

## 🏗️ Architecture & Unity 3D Project Structure

The project includes both an instant real-time playable 3D engine and a complete modular Unity 3D C# codebase organized into clean domains:

```
SHADOWBORN/
├── Assets/
│   ├── Scenes/
│   │   ├── TrainingArena/
│   │   ├── DemonDungeon/
│   │   └── BossArena/
│   ├── Scripts/
│   │   ├── Core/
│   │   │   └── GameManager.cs           # State machine (Playing, Paused, GameOver, Victory)
│   │   ├── Input/
│   │   │   └── InputManager.cs           # Merges webcam gestures and keyboard fallbacks
│   │   ├── ComputerVision/
│   │   │   ├── WebcamManager.cs          # WebCamTexture capture & device management
│   │   │   └── GestureRecognitionManager.cs # FSM, smoothing, fist & punch classifier
│   │   ├── Player/
│   │   │   ├── PlayerController.cs       # 3D locomotion & animation controller
│   │   │   └── PlayerHealth.cs           # HP, Shadow Energy & resource regeneration
│   │   ├── Combat/
│   │   │   ├── PlayerCombatController.cs # Ability execution coordinator
│   │   │   ├── DamageSystem.cs           # Formula-based damage & defence calculation
│   │   │   └── AuraPunchAbility.cs       # Melee range, purple aura VFX, knockback
│   │   ├── Enemies/
│   │   │   ├── EnemyAIController.cs      # FSM: Idle, Approach, Attack, Stagger, Defeated
│   │   │   └── EnemyHealth.cs            # Health, stagger reactions, death dissolve
│   │   ├── Missions/
│   │   │   └── MissionManager.cs         # Campaign objectives (Mission 1: The Awakening)
│   │   ├── Progression/
│   │   │   ├── ExperienceManager.cs      # XP gain, level up calculations
│   │   │   └── RankManager.cs            # Hunter Ranks (E to SSS / Shadow Monarch)
│   │   ├── UI/
│   │   │   └── GameUIManager.cs          # Health bars, cooldowns, gesture overlay
│   │   └── SaveSystem/
│   │       └── SaveManager.cs            # Local JSON save/load with versioning
├── cv_bridge/
│   └── hand_tracker.py                   # Python MediaPipe & OpenCV UDP streaming bridge
├── index.html                            # 3D WebGL dark fantasy viewport & HUD
├── game.js                               # Three.js 3D dark fantasy engine & gesture tracking
├── audio.js                              # Web Audio API procedural sound synthesizer
├── style.css                             # Dark fantasy HUD styling & responsive UI
├── server.js                             # Zero-dependency local Node.js HTTP server
└── launch_game.bat                       # One-click Windows batch launcher
```

---

## 🔮 Computer Vision & Gesture Pipeline

The gesture-processing pipeline operates as follows:
```
Webcam Video Feed
  └── Frame Capture (640x480 @ 30 FPS)
      └── Hand Landmark Detection (MediaPipe 21 3D Joint Mesh)
          └── Landmark Smoothing & Depth Estimation
              └── Gesture Classification (Closed Fist: fingers curled to palm)
                  └── Velocity Validation (Forward punch translation speed > threshold)
                      └── Gesture State Machine (IDLE -> DETECTED -> VALIDATED -> TRIGGERED -> COOLDOWN)
                          └── Combat Event: Execute Aura Punch
                              ├── Player Character Punch Thrust Animation
                              ├── Purple/Blue Supernatural Aura VFX & Shockwave
                              ├── Distance & Hit Angle Overlap Detection
                              ├── Damage Calculation & Enemy Knockback Stagger
                              └── Floating Combat Damage Numbers & Audio Feedback
```

---

## ⚔️ Combat Damage Balancing

Damage is calculated using the formula:
$$\text{Final Damage} = \max(\text{Minimum Damage},\, \text{Base Damage} \times \text{Attack Multiplier} \times \text{Resistance Modifier} - \text{Effective Defence})$$

- **Aura Punch Base Damage:** $35\text{--}47$
- **Cursed Demon Base Defence:** $6$
- **Demon Max Health:** $120$ HP (requires $3\text{--}4$ well-timed aura punches to defeat)
- **Cooldown:** $0.6$ seconds between punches to prevent accidental rapid re-triggering.

---

## 📋 Progression & Hunter Ranks

1. **Rank E:** Human / Awakened Fighter *(Unlocked at Start)*
2. **Rank D:** Elite Hunter *(Unlocked upon completing Mission 1)*
3. **Rank C:** Shadow Knight
4. **Rank B:** Shadow Assassin
5. **Rank A:** Shadow Commander
6. **Rank S:** Shadow General
7. **Rank SS:** Elite Shadow Warrior
8. **Rank SSS:** Shadow Monarch
