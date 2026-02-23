export function triggerWeaponAttack(playerId: number, slot: string) {
  const el = document.getElementById(`equipped-slot-${slot}-${playerId}`);
  if (el) {
    el.classList.add('animate-weapon-attack');
    setTimeout(() => el.classList.remove('animate-weapon-attack'), 400);
  }
}

export function triggerAvatarHit(playerId: number) {
  const el = document.getElementById(`avatar-${playerId}`);
  if (el) {
    el.classList.add('animate-avatar-hit');
    setTimeout(() => el.classList.remove('animate-avatar-hit'), 400);
  }
}

export function triggerTalentActivation(talentId: number, playerId: number) {
  const talentContainer = document.getElementById(
    `talent-${talentId}-${playerId}`
  );

  if (talentContainer) {
    talentContainer.classList.add('animate-talent');
    setTimeout(() => {
      talentContainer.classList.remove('animate-talent');
    }, 500);
  }
}

export function triggerItemCollectionActivation(collectionId: number, playerId: number) {
  const collectionContainer = document.getElementById(
    `collection-${collectionId}-${playerId}`
  );

  if (collectionContainer) {
    collectionContainer.classList.add('animate-talent');
    setTimeout(() => {
      collectionContainer.classList.remove('animate-talent');
    }, 500);
  }
}