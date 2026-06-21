import { InfoContent } from '../../models/info-content';

export const goldHint: InfoContent = {
  id: 'gold',
  title: 'Gold & Income',
  entries: [
    { icon: '🟡', label: 'Gold', text: 'Your current gold. Spend it to buy and upgrade items in the shop.' },
    { icon: '💰', label: 'Income', text: 'Your income is the gold you earn at the end of each fight. It grows automatically by 1 after every fight, and items or talents can raise it further.' },
  ],
};

export const buyXpHint: InfoContent = {
  id: 'buy-xp',
  title: 'Buy XP',
  entries: [
    { icon: '⬆️', label: 'Buy XP', text: 'Spend 4 gold to gain 4 XP toward your next level.' },
  ],
};

export const lockShopHint: InfoContent = {
  id: 'lock-shop',
  title: 'Lock Shop',
  entries: [
    { icon: '🔒', label: 'Lock', text: 'Lock your current shop items so they persist into the next round — useful when you cannot afford something right now.' },
  ],
};

export const talentHint: InfoContent = {
  id: 'talent-available',
  title: 'New Talent Available!',
  entries: [
    { icon: '🌟', label: 'Talent', text: 'You have unlocked a new talent! Click to choose a permanent passive ability that enhances your build.' },
  ],
};

export const draftReadyHint: InfoContent = {
  id: 'draft-ready',
  title: 'Ready to Fight?',
  entries: [
    { icon: '⚔️', label: 'Start Battle', text: 'When you\'re happy with your build, click the Fight button at the bottom to start the round.' },
  ],
};

export const fightingHint: InfoContent = {
  id: 'fighting',
  title: 'Battle in Progress',
  entries: [
    { icon: '⏳', label: 'Please Wait', text: 'The fight is underway — sit back and watch! The next draft round will begin when it\'s over.' },
  ],
};

export const infoBoxHint: InfoContent = {
  id: 'info-box',
  title: 'Help & Hints',
  entries: [
    { icon: '❓', label: 'Info Box', text: 'Toggle the hint panel. Hover over any element on screen to see a description of what it does.' },
  ],
};

export const encyclopediaHint: InfoContent = {
  id: 'encyclopedia',
  title: 'Encyclopedia',
  entries: [
    { icon: '📖', label: 'Browse', text: 'Browse all items, talents, and collections in the game. Great for planning your build or looking up what a specific item does.' },
  ],
};

export const volumeHint: InfoContent = {
  id: 'volume',
  title: 'Volume',
  entries: [
    { icon: '🔊', label: 'Volume', text: 'Click to cycle volume: Max → Loud → Quiet → Muted.' },
  ],
};

export const matchHistoryHint: InfoContent = {
  id: 'match-history',
  title: 'Fight Replays',
  entries: [
    { icon: '🎬', label: 'Replays', text: 'View recordings of your recent fights. Watch them back to review your build and battle performance.' },
  ],
};

export const abandonHint: InfoContent = {
  id: 'abandon',
  title: 'Abandon Run',
  entries: [
    { icon: '🏳️', label: 'Abandon', text: 'End your current run immediately. This cannot be undone — your run will be over and you will be taken to the leaderboard.' },
  ],
};

export const forfeitHint: InfoContent = {
  id: 'forfeit',
  title: 'Forfeit Fight',
  entries: [
    { icon: '🚩', label: 'Forfeit', text: 'Concede just this fight — it counts as a loss (you lose a life and get the usual consolation gold), but your run continues.' },
  ],
};

export const battleWonHint: InfoContent = {
  id: 'battle-won',
  title: 'Round Won!',
  entries: [
    { icon: '🏆', label: 'Victory', text: 'You won this round! Click "Back to Draft" on the result panel to continue to the next draft phase.' },
  ],
};

export const battleLostHint: InfoContent = {
  id: 'battle-lost',
  title: 'Round Lost',
  entries: [
    { icon: '💔', label: 'Defeat', text: 'You lost this round. Click "Back to Draft" on the result panel to keep building and fight back next round.' },
  ],
};

export const battleDrawHint: InfoContent = {
  id: 'battle-draw',
  title: 'Draw',
  entries: [
    { icon: '🤝', label: 'Draw', text: 'The battle ended in a draw — no lives lost. Click "Back to Draft" on the result panel to head into the next round.' },
  ],
};

export const runOverHint: InfoContent = {
  id: 'run-over',
  title: 'Run Over',
  entries: [
    { icon: '💀', label: 'Game Over', text: 'Your run has ended. Click "View Your Results" on the panel to see your final score and leaderboard position.' },
  ],
};

export const versionWinHint: InfoContent = {
  id: 'version-win',
  title: 'New Record!',
  entries: [
    { icon: '🌟', label: 'Version Best', text: 'You set a new personal record! Choose to continue pushing your run or accept this as your result.' },
  ],
};

export const topWinHint: InfoContent = {
  id: 'top-win',
  title: 'All-Time #1!',
  entries: [
    { icon: '👑', label: 'Top of the Leaderboard', text: 'You reached #1 on the all-time leaderboard! Accept your victory to lock in your legendary result.' },
  ],
};
