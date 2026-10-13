using UnityEngine;

namespace Shadowborn.Combat
{
    public static class DamageSystem
    {
        public static float CalculateDamage(
            float baseDamage,
            float attackMultiplier,
            float resistanceModifier,
            float targetDefence,
            float minimumDamage = 5f)
        {
            // Final Damage = max(Minimum Damage, Base Damage * Attack Multiplier * Resistance Modifier - Effective Defence)
            float rawDamage = baseDamage * attackMultiplier * resistanceModifier;
            float netDamage = rawDamage - targetDefence;
            return Mathf.Max(minimumDamage, netDamage);
        }
    }
}
