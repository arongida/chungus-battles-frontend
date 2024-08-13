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