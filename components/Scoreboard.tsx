import React from 'react';
import { EmojiInfo } from '../types';

interface ScoreboardProps {
  score: number;
  highScore: number;
  nextEmoji: EmojiInfo | null;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({ score, highScore, nextEmoji }) => {
  return (
    <div className="flex items-center gap-4 md:gap-6 bg-slate-800/70 p-2 md:p-3 rounded-xl border border-slate-700">
      <div className="text-center">
        <div className="text-xs md:text-sm text-slate-400">SCORE</div>
        <div className="text-lg md:text-2xl font-bold text-yellow-300">{score}</div>
      </div>
      <div className="text-center hidden sm:block">
        <div className="text-xs md:text-sm text-slate-400">BEST</div>
        <div className="text-lg md:text-2xl font-bold text-green-400">{highScore}</div>
      </div>
      <div className="text-center pl-4 border-l border-slate-600">
        <div className="text-xs md:text-sm text-slate-400">NEXT</div>
        <div className="text-2xl md:text-3xl h-8 w-8 md:h-10 md:w-10 flex items-center justify-center">
          {nextEmoji ? nextEmoji.emoji : '?'}
        </div>
      </div>
    </div>
  );
};
