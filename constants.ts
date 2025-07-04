import { EmojiInfo } from './types';

export const EMOJI_PROGRESSION: EmojiInfo[] = [
  { level: 0, radius: 18, emoji: '💧', score: 2 },    // Droplet
  { level: 1, radius: 22, emoji: '🌱', score: 5 },    // Seedling
  { level: 2, radius: 26, emoji: '🌸', score: 10 },   // Cherry Blossom
  { level: 3, radius: 30, emoji: '🍋', score: 22 },   // Lemon
  { level: 4, radius: 36, emoji: '🍊', score: 45 },   // Tangerine
  { level: 5, radius: 42, emoji: '🍎', score: 90 },   // Apple
  { level: 6, radius: 48, emoji: '🍉', score: 180 },  // Watermelon
  { level: 7, radius: 55, emoji: '🍍', score: 360 },  // Pineapple
  { level: 8, radius: 62, emoji: '🥥', score: 720 },  // Coconut
  { level: 9, radius: 70, emoji: '🎃', score: 1500 }, // Jack-o'-Lantern
  { level: 10, radius: 80, emoji: '💎', score: 3000 }, // Diamond
];

export const INITIAL_EMOJI_LEVELS = 4;
export const GAME_WIDTH = 420;
export const GAME_HEIGHT = 600;
export const WALL_THICKNESS = 20;
export const GAME_OVER_LINE_Y_RATIO = 0.15;
