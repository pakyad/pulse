export type LocationZone = 'MIIT' | 'RAH';

export interface LocationNode {
  token: string;
  label: string;
  zone: LocationZone;
  tier: 'STANDARD' | 'PREMIUM';
  fee: number;
}

export const CAMPUS_NODES: LocationNode[] = [
  //  MIIT TOWER (Standard Tier - RM 3.50) 
  { token: 'MIIT-G-LOBBY', label: 'Ground Floor Lobby', zone: 'MIIT', tier: 'STANDARD', fee: 3.50 },
  { token: 'MIIT-04-HALL', label: 'Level 4 Teater Perdana', zone: 'MIIT', tier: 'STANDARD', fee: 3.50 },
  { token: 'MIIT-08-LAB', label: 'Level 8 Database Labs', zone: 'MIIT', tier: 'STANDARD', fee: 3.50 },
  { token: 'MIIT-12-MAC', label: 'Level 12 UI/UX Mac Labs', zone: 'MIIT', tier: 'STANDARD', fee: 3.50 },
  { token: 'MIIT-14-CAFE', label: 'Level 14 Student Cafe', zone: 'MIIT', tier: 'STANDARD', fee: 3.50 },
  { token: 'MIIT-20-LIBR', label: 'Level 20 Library', zone: 'MIIT', tier: 'STANDARD', fee: 3.50 },

  //  RESIDENSI RAH (Walkable 500m Orbit) 
  { token: 'RAH-G-GUARD', label: 'Main Guardhouse Gate', zone: 'RAH', tier: 'STANDARD', fee: 3.50 },
  { token: 'RAH-G-LOBBY', label: 'Ground Floor Parcel Rack', zone: 'RAH', tier: 'STANDARD', fee: 3.50 },
  { token: 'RAH-L13-SURAU', label: 'Level 13 Communal Lounge', zone: 'RAH', tier: 'STANDARD', fee: 3.50 },
  
  // Premium Door-to-Door
  { token: 'RAH-DOOR-PREMIUM', label: 'Direct to Room Door', zone: 'RAH', tier: 'PREMIUM', fee: 5.00 },
];

// GPS coordinates for each campus delivery node
export const NODE_COORDS: Record<string, { lat: number; lng: number }> = {
  'MIIT-G-LOBBY':    { lat: 3.1594, lng: 101.6998 },
  'MIIT-04-HALL':    { lat: 3.1595, lng: 101.6999 },
  'MIIT-08-LAB':     { lat: 3.1596, lng: 101.6998 },
  'MIIT-12-MAC':     { lat: 3.1595, lng: 101.6997 },
  'MIIT-14-CAFE':    { lat: 3.1594, lng: 101.6996 },
  'MIIT-20-LIBR':    { lat: 3.1593, lng: 101.6998 },
  'RAH-G-GUARD':     { lat: 3.1620, lng: 101.6980 },
  'RAH-G-LOBBY':     { lat: 3.1621, lng: 101.6981 },
  'RAH-L13-SURAU':   { lat: 3.1622, lng: 101.6980 },
  'RAH-DOOR-PREMIUM':{ lat: 3.1623, lng: 101.6979 },
};

export const CAMPUS_CENTER = { lat: 3.1594, lng: 101.6998 };

/**
 * Returns the GPS coordinates for a given drop-off location token.
 * Falls back to campus center if the node is unknown.
 */
export function getDropOffCoords(token: string | null | undefined): { lat: number; lng: number } {
  if (!token) return CAMPUS_CENTER;
  // Dynamic RAH door-to-room (e.g. RAH-DOOR-1204)
  if (token.startsWith('RAH-DOOR-')) return NODE_COORDS['RAH-DOOR-PREMIUM'] || CAMPUS_CENTER;
  return NODE_COORDS[token] || CAMPUS_CENTER;
}

/**
 * Haversine distance between two GPS coordinates in metres.
 * Earth radius = 6,371,000m (same as functions/src/index.ts).
 */
export function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371e3;
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
          Math.cos(phi1) * Math.cos(phi2) *
          Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

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
