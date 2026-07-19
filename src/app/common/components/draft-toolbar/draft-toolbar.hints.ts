import { InfoContent } from '../../models/info-content';

export const goldHint: InfoContent = {
  id: 'gold',
  title: 'Gold & Income',
  entries: [
    { icon: '🟡', label: 'Gold', text: 'Your current gold. Spend it to buy and upgrade items in the shop.' },
    { icon: '💰', label: 'Income', text: 'Your income is the gold you earn at the end of each fight. It grows automatically by 1 after every fight, and items or talents can raise it further.' },
    { icon: '🍀', label: 'Lucky Find', text: 'Chance for each shop item to roll up a rarity (can chain into higher rarities).' },
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

export const shopPhaseHint: InfoContent = {
  id: 'shop-phase',
  title: '🛒 Shop Phase',
  entries: [
    { icon: '🛍️', label: 'Buy Items', text: 'Spend gold to buy items from the shop. Bought items go into your inventory.' },
    { icon: '🗡️', label: 'Equip Items', text: 'Open your inventory (the bag button in the toolbar) and equip items to strengthen your fighter.' },
    { icon: '⚔️', label: 'Go Fight', text: 'When your build is ready, press the Ready to Chungus! button to start the battle.' },
  ],
};

export const fightingHint: InfoContent = {
  id: 'fighting',
  title: 'Battle in Progress',
  entries: [
    { icon: '⏳', label: 'Please Wait', text: 'The fight is underway — sit back and watch! The next draft round will begin when it\'s over.' },
    { icon: '⏩', label: 'Fight Speed', text: 'Use the 0.5×/1×/2× buttons in the top-left corner to slow down or speed up the fight.' },
  ],
};

export const fightSpeedHint: InfoContent = {
  id: 'fight-speed',
  title: 'Fight Speed',
  entries: [
    { icon: '⏩', label: 'Fight Speed', text: 'Slow down or speed up the fight: 0.5× for a leisurely pace, 2× to skip ahead.' },
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
    { icon: '💀', label: 'Game Over', text: 'Your run has ended. Click "View Your Results" on the panel to see your final stats and the Wall of Fame.' },
  ],
};

export const gameWinHint: InfoContent = {
  id: 'game-win',
  title: 'Game Won!',
  entries: [
    { icon: '🏆', label: '12 Wins', text: 'You reached 12 wins and won the game! Your character is added to the Wall of Fame, ranked by fewest losses.' },
  ],
};
