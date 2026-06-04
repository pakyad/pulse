export type LocationZone = 'MIIT' | 'RAH';

export interface LocationNode {
  token: string;
  label: string;
  zone: LocationZone;
  tier: 'STANDARD' | 'PREMIUM';
  fee: number;
}

export const CAMPUS_NODES: LocationNode[] = [
  // ── MIIT TOWER (Standard Tier - RM 3.50) ──
  { token: 'MIIT-G-LOBBY', label: 'Ground Floor Lobby', zone: 'MIIT', tier: 'STANDARD', fee: 3.50 },
  { token: 'MIIT-04-HALL', label: 'Level 4 Teater Perdana', zone: 'MIIT', tier: 'STANDARD', fee: 3.50 },
  { token: 'MIIT-08-LAB', label: 'Level 8 Database Labs', zone: 'MIIT', tier: 'STANDARD', fee: 3.50 },
  { token: 'MIIT-12-MAC', label: 'Level 12 UI/UX Mac Labs', zone: 'MIIT', tier: 'STANDARD', fee: 3.50 },
  { token: 'MIIT-14-CAFE', label: 'Level 14 Student Cafe', zone: 'MIIT', tier: 'STANDARD', fee: 3.50 },
  { token: 'MIIT-20-LIBR', label: 'Level 20 Library', zone: 'MIIT', tier: 'STANDARD', fee: 3.50 },

  // ── RESIDENSI RAH (Walkable 500m Orbit) ──
  { token: 'RAH-G-GUARD', label: 'Main Guardhouse Gate', zone: 'RAH', tier: 'STANDARD', fee: 3.50 },
  { token: 'RAH-G-LOBBY', label: 'Ground Floor Parcel Rack', zone: 'RAH', tier: 'STANDARD', fee: 3.50 },
  { token: 'RAH-L13-SURAU', label: 'Level 13 Communal Lounge', zone: 'RAH', tier: 'STANDARD', fee: 3.50 },
  
  // Premium Door-to-Door
  { token: 'RAH-DOOR-PREMIUM', label: 'Direct to Room Door', zone: 'RAH', tier: 'PREMIUM', fee: 5.00 },
];

/**
 * Returns badge styling for a given location zone
 */
export function getLocationBadge(zone: LocationZone) {
  if (zone === 'MIIT') {
    return 'bg-teal-50 border-teal-100 text-teal-700';
  }
  return 'bg-indigo-50 border-indigo-100 text-indigo-700';
}

/**
 * Parses any location string back to its node if it exists, otherwise creates a fallback
 */
export function parseLocationToken(tokenStr: string): LocationNode {
  // If it's a dynamic room (e.g., RAH-DOOR-1204)
  if (tokenStr?.startsWith('RAH-DOOR-')) {
    const room = tokenStr.replace('RAH-DOOR-', '');
    return {
      token: tokenStr,
      label: `Room ${room}`,
      zone: 'RAH',
      tier: 'PREMIUM',
      fee: 5.00
    };
  }
  
  const found = CAMPUS_NODES.find(n => n.token === tokenStr);
  if (found) return found;

  // Fallback for legacy data
  return {
    token: 'UNKNOWN',
    label: tokenStr || 'Unknown Location',
    zone: 'MIIT',
    tier: 'STANDARD',
    fee: 3.50
  };
}
