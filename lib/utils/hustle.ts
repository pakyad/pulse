/**
 * CODEP PULSE | Hustle Status Tier Engine
 * Defines the campus hierarchy based on performance scores.
 */

export const getStatusTier = (score: number) => {
    if (score >= 1000) {
      return { 
        label: 'ELITE RUNNER', 
        color: 'text-orange', 
        bgColor: 'bg-orange/10',
        borderColor: 'border-orange/20',
        badge: 'Elite',
        glow: 'shadow-[0_0_15px_rgba(255,133,27,0.3)]'
      };
    }
    if (score >= 500) {
      return { 
        label: 'GOLD HUSTLER', 
        color: 'text-navy', 
        bgColor: 'bg-navy/5',
        borderColor: 'border-navy/10',
        badge: 'Gold',
        glow: '' 
      };
    }
    if (score >= 100) {
      return { 
        label: 'PRO RUNNER', 
        color: 'text-navy/60', 
        bgColor: 'bg-navy/5',
        borderColor: 'border-navy/5',
        badge: 'Silver',
        glow: ''
      };
    }
    return { 
      label: 'NOVICE', 
      color: 'text-navy/40', 
      bgColor: 'bg-navy/5',
      borderColor: 'border-navy/5',
      badge: 'Bronze',
      glow: ''
    };
  };
  
export type HustleTier = ReturnType<typeof getStatusTier>;
