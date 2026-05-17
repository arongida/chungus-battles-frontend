import { InfoContent } from '../../models/info-content';

export const goldHint: InfoContent = {
  title: 'Gold & Income',
  entries: [
    { icon: '🟡', label: 'Gold', text: 'Your current gold. Spend it to buy and upgrade items in the shop.' },
    { icon: '💰', label: 'Income', text: 'You earn bonus gold at the end of each fight based on your income stat.' },
  ],
};

export const buyXpHint: InfoContent = {
  title: 'Buy XP',
  entries: [
    { icon: '⬆️', label: 'Buy XP', text: 'Spend 4 gold to gain 4 XP. Leveling up gives you more item slots and unlocks new talents.' },
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
