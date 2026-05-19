import { InfoContent } from '../../models/info-content';

export const goldHint: InfoContent = {
  title: 'Gold & Income',
  entries: [
    { icon: '🟡', label: 'Gold', text: 'Your current gold. Spend it to buy and upgrade items in the shop.' },
    { icon: '💰', label: 'Income', text: 'Your income is the gold you earn at the end of each fight. It grows automatically by 1 after every fight, and items or talents can raise it further.' },
  ],
};

export const buyXpHint: InfoContent = {
  title: 'Buy XP',
  entries: [
    { icon: '⬆️', label: 'Buy XP', text: 'Spend 4 gold to gain 4 XP. Each level up to 5 unlocks a new talent and higher-tier items. Past level 5 there is no cap — each extra level grants increasingly powerful stat bonuses (strength, accuracy, HP, and defense all grow stronger the higher you go).' },
  ],
};

export const xpBarHint: InfoContent = {
  title: 'Level & XP',
  entries: [
    { icon: '📊', label: 'Level', text: 'Your current level and XP progress. You gain XP automatically after each fight and can buy more with gold. Reaching level 5 unlocks all talent tiers and the strongest shop items. There is no level cap — beyond level 5, every level grants increasingly powerful stat bonuses. The further past 5 you are, the bigger each level\'s bonus becomes.' },
  ],
};

export const lockShopHint: InfoContent = {
  title: 'Lock Shop',
  entries: [
    { icon: '🔒', label: 'Lock', text: 'Lock your current shop items so they persist into the next round — useful when you cannot afford something right now.' },
  ],
};

export const talentHint: InfoContent = {
  title: 'New Talent Available!',
  entries: [
    { icon: '🌟', label: 'Talent', text: 'You have unlocked a new talent! Click to choose a permanent passive ability that enhances your build.' },
  ],
};

export const draftReadyHint: InfoContent = {
  title: 'Ready to Fight?',
  entries: [
    { icon: '⚔️', label: 'Start Battle', text: 'When you\'re happy with your build, click the Fight button at the bottom to start the round.' },
  ],
};

export const fightingHint: InfoContent = {
  title: 'Battle in Progress',
  entries: [
    { icon: '⏳', label: 'Please Wait', text: 'The fight is underway — sit back and watch! The next draft round will begin when it\'s over.' },
  ],
};
