# SHADOWBORN V2: AWAKENED SORCERER
> *Real-Time 3D Limitless Sorcerer vs. Cursed Demon Combat Prototype*

`shadowborn_v2` is an advanced 3D supernatural anime fighting game prototype added to the **SHADOWBORN** repository. It features a fast-paced 3D anime boss encounter pitting a white-haired special grade sorcerer (inspired by Satoru Gojo) against a towering cursed demon vanguard in a 3D dark fantasy arena.

---

## ⚡ 1. Satoru Gojo-Inspired Character Model & Animations

The player character features a fully articulated 3D model with procedural skeletal kinematics:
* **Sculpted Anime Face & Eyes:** Tapered jawline, glowing blue *Six Eyes* (`#38bdf8`), and signature dark blindfold wrap.
* **Multi-Layered Spiky White Hair:** Layered forehead bangs and crown spikes (`#f8fafc`).
* **High-Collared Combat Outfit:** Midnight navy/black sorcerer tunic with a tall flared standing collar, shoulders, belt, and dark combat boots.
* **Articulated Limbs & Animation States:**
  - **`IDLE`:** Natural breathing chest rise/fall, soft arm swaying.
  - **`WALK` & `SPRINT`:** Dynamic leg-striding and counter-swinging arms with lean angle scaling.
  - **`AURA PUNCH`:** Step lunge with right arm thrusting forward and left arm guarding ribs.
  - **`BLUE ORB`:** Left-hand singularity focus pose with gravitational pull.
  - **`RED BLAST`:** Right-hand blast projection with explosive repulsive recoil.
  - **`HOLLOW PURPLE`:** Two-hand convergence pose! Both hands converge in front of the chest, creating blue and red spheres that fuse into the giant hollow purple singularity.
  - **`INFINITY GUARD`:** Limitless refractive energy barrier sphere surrounding the sorcerer.
  - **`DODGE`:** Phase dash displacement with rapid body tilt.
  - **`HIT / FLINCH`:** Physical stagger reaction with damage flash.

---

## 🎮 2. Keyboard & Movement Controls

| Action | Primary Key | Alternate / Mouse | Combat Details |
| :--- | :--- | :--- | :--- |
| **Move Forward** | `[W]` | Continuous Hand Up | Moves forward ($-Z$), clamped to arena radius |
| **Move Backward** | `[S]` | Continuous Hand Down | Moves backward ($+Z$), clamped to arena radius |
| **Move Left** | `[A]` | Continuous Hand Left | Strafe left ($-X$) |
| **Move Right** | `[D]` | Continuous Hand Right | Strafe right ($+X$) |
| **Sprint** | `[SHIFT]` (Hold) | — | Increases movement speed from $4.8\text{ m/s}$ to $7.8\text{ m/s}$ |
| **Phase Dodge** | `[SPACE]` | Click Dodge Card | Instant $4.5\text{m}$ displacement with $0.35\text{s}$ i-frame invulnerability |
| **Aura Punch** | `[J]` | `[1]` / Click Card | Fast melee strike ($28$ Base DMG, $10$ Energy, $0.5\text{s}$ CD) |
| **Lapse: Blue Orb** | `[K]` | `[2]` / Click Card | Gravitational projectile that pulls demon ($40$ Base DMG, $25$ Energy, $2.2\text{s}$ CD) |
| **Reversal: Red Blast** | `[L]` | `[3]` / Click Card | Explosive repulsive blast with heavy knockback ($55$ Base DMG, $35$ Energy, $3.5\text{s}$ CD) |
| **Hollow Purple** | `[U]` | `[4]` / Click Card | Colossal singularity sphere ($110$ Base DMG, $70$ Energy, $8.0\text{s}$ CD) |
| **Infinity Guard** | `[I]` or `[C]` | Click Guard Card | Neutral limitless barrier that neutralizes $100\%$ incoming damage ($15\text{ Energy/s}$) |
| **Pause / Resume** | `[ESCAPE]` | — | Pauses/resumes the combat cycle |

---

## 📷 3. Working Webcam Hand Gesture Controls

The webcam interface is fully integrated and toggleable:
* **Enable / Disable Camera Buttons:** Start and stop webcam tracking with a single click.
* **Live Mirrored Preview & Landmark Overlay:** Displays detected 21 hand landmarks in real time.
* **Continuous Gesture Movement:**
  - Moving hand left of neutral center ($\text{normX} < 0.42$) $\rightarrow$ Player moves Left.
  - Moving hand right of neutral center ($\text{normX} > 0.58$) $\rightarrow$ Player moves Right.
  - Moving hand upward ($\text{normY} < 0.40$) $\rightarrow$ Player moves Forward.
  - Moving hand downward ($\text{normY} > 0.65$) $\rightarrow$ Player moves Backward.
  - Deadzone filtering prevents small tremors from causing accidental movement.
  - Tracking loss automatically and safely stops gesture movement.
* **Gesture Combat Mapping:**
  - **Closed Fist:** Aura Punch
  - **Index Pointing:** Blue Orb
  - **Open Palm:** Infinity Guard
  - **Two Hands Detected:** Hollow Purple
  - **Quick Horizontal Swipe:** Red Blast
* **Keyboard Fallback:** Keyboard controls remain active at all times, even if camera permissions are denied or disabled.

---

## 👹 4. Cursed Demon Vanguard (Boss AI)

* **Autonomous Combat AI:** The demon approaches the player, strafes, and dynamically selects abilities.
* **Telegraphed Ground Slam:** Expands a large crimson shockwave ring on the floor for $0.8\text{s}$. If the player remains within $4.2\text{m}$ and is not dodging, it deals $34$ damage!
* **Claw Attacks:** Fast melee swipes dealing $18$ damage.
* **Bloodflame Projectile:** Fires ranged cursed fireballs when the player keeps their distance.
* **Combo Flurry:** 3-hit rapid claw combo in close range.
* **Damage Logic:** Missed attacks deal $0$ damage. Infinity Guard completely blocks incoming attacks. Dodge i-frames evade attacks.

---

## 🧪 5. Automated Unit Test Suite

Run the full test suite from inside `shadowborn_v2/`:
```powershell
npm test
```

### Coverage (16/16 Passing Tests):
1. Initial combat state initialization.
2. Aura Punch damage, range validation, and cooldown enforcement.
3. Out-of-range player attacks dealing 0 damage.
4. Blue Orb, Red Blast, and Hollow Purple energy consumption and knockback/pull forces.
5. Infinity Guard blocking 100% of incoming damage.
6. Phase Dodge i-frames evading attacks completely.
7. Unguarded enemy attacks reducing player HP on valid hits.
8. Missed enemy attacks causing zero damage.
9. Cursed Projectiles and Combo Strikes hit resolution.
10. Victory and Defeat trigger conditions.
11. Timer updates for cooldowns and natural energy regeneration.
12. Movement velocity calculation and sprint multiplier.
13. Arena boundary clamping within circle radius ($13.5\text{m}$).
14. Dodge displacement calculation respecting arena boundaries.
15. Hand gesture continuous direction mapping and deadzone filtering.
16. Hand landmark classification (Fist, Pointing, Open Palm, Two Hands).

---

## 🌐 6. Deployment & Access

* **Live GitHub Pages URL:** `https://u687120-cmyk.github.io/SHADOWBORN/shadowborn_v2/`
* **Localhost URL:** `http://127.0.0.1:8080/shadowborn_v2/index.html`
