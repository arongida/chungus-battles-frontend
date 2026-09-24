// Public profile of the character behind a ghost (mirror of the backend's social/badges.ts
// OwnerProfile) — synced as JSON strings on FightState.enemyOwnerJson / DraftState.nextEnemyOwnerJson
// and recorded into replays as initialState.enemyOwner.

export type OwnerStatus = 'fighting' | 'fallen' | 'champion';

export interface OwnerProfile {
  originalPlayerId: number;
  status: OwnerStatus;
  wins: number;
  losses: number;
  round: number;
  runsEnded: number;
  badges: { id: string; label: string }[];
}

export function parseOwnerProfile(json: string | null | undefined): OwnerProfile | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as OwnerProfile;
  } catch {
    return null;
  }
}

/** "Still fighting · 7 wins" / "Fell in round 9" / "Champion · 12 wins". */
export function ownerStatusLine(p: OwnerProfile): string {
  switch (p.status) {
    case 'champion': return `Champion · ${p.wins} wins`;
    case 'fallen': return `Fell in round ${p.round} · ${p.wins} wins`;
    default: return `Still fighting · ${p.wins} ${p.wins === 1 ? 'win' : 'wins'}`;
  }
}
