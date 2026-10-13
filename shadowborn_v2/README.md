# SHADOWBORN V2: AWAKENED SORCERER
> *Real-Time 3D Limitless Sorcerer vs. Cursed Demon Combat Prototype*

`shadowborn_v2` is an advanced combat prototype added to the **SHADOWBORN** repository. It features a fast-paced 3D anime-inspired boss battle pitting a white-haired special grade sorcerer against a towering cursed demon vanguard.

---

## ⚡ Combat Roster & Abilities

### The White-Haired Sorcerer (Player)
* **Aura Punch (`[Q]` / `[1]`):** High-speed cursed melee strike with knockback ($10$ Energy, $0.5\text{s}$ CD).
* **Lapse: Blue Orb (`[E]` / `[2]`):** Creates an attractive singularity that draws the demon forward and deals damage ($25$ Energy, $2.2\text{s}$ CD).
* **Reversal: Red Blast (`[R]` / `[3]`):** Explosive repulsive blast with immense knockback ($35$ Energy, $3.5\text{s}$ CD).
* **Secret Art: Hollow Purple (`[F]` / `[4]`):** Merges Red and Blue into a devastating high-damage sphere that tears through space ($70$ Energy, $8.0\text{s}$ CD).
* **Infinity Guard (`[C]` / `[G]`):** Limitless barrier surrounding the sorcerer that completely neutralizes incoming attacks while draining energy ($15\text{ Energy/s}$).
* **Phase Dodge (`[SPACE]` / `[SHIFT]`):** Instant dash with invulnerability frames ($0.35\text{s}$) to evade heavy attacks and ground slams.

### The Cursed Demon Vanguard (Boss)
* **Cursed Claw Swipe:** Fast melee slash dealing $18$ damage.
* **Abyssal Ground Slam:** Telegraphs an expanding crimson circle on the ground for $0.8\text{s}$, followed by a shockwave dealing $34$ damage if unevaded.
* **Bloodflame Orb (Cursed Projectile):** Ranged homing fireball fired when player is at distance dealing $22$ damage.
* **Demonic Combo Flurry:** Three-hit rapid claw combo in close quarters dealing $36$ total damage.

---

## 🕹️ Controls

| Action | Keyboard Key | Mouse / UI |
| :--- | :--- | :--- |
| **Locomotion** | `[W]`, `[A]`, `[S]`, `[D]` | Auto-face demon |
| **Aura Punch** | `[Q]` or `[1]` | Click Aura Punch Card |
| **Blue Orb** | `[E]` or `[2]` | Click Blue Card |
| **Red Blast** | `[R]` or `[3]` | Click Red Card |
| **Hollow Purple** | `[F]` or `[4]` | Click Purple Card |
| **Infinity Guard** | `[C]` or `[G]` | Click Guard Card |
| **Phase Dodge** | `[SPACE]` or `[SHIFT]` | Click Dodge Card |

---

## 🧪 Unit Testing

All combat rules, damage calculations, guard absorption, dodge i-frames, and victory/defeat triggers are covered by unit tests.

To run the test suite:
```powershell
cd shadowborn_v2
npm test
```

### Test Suite Coverage:
1. `createInitialCombatState` default parameters.
2. Aura Punch damage, range validation, and cooldown enforcement.
3. Out-of-range player attacks correctly causing $0$ damage.
4. Blue Orb, Red Blast, and Hollow Purple energy consumption and forces.
5. Infinity Guard blocking $100\%$ of incoming damage.
6. Phase Dodge i-frames evading attacks completely.
7. Unguarded enemy attack correctly reducing player HP on valid hits.
8. Missed enemy attacks causing zero damage.
9. Cursed Projectiles and Combo Strikes hit resolution.
10. Victory and Defeat trigger conditions.
11. Timer updates for cooldowns and natural energy regeneration.

---

## 🌐 Live Access on GitHub Pages

This prototype is deployed alongside the existing project under the subpath:
**`https://u687120-cmyk.github.io/SHADOWBORN/shadowborn_v2/`**
