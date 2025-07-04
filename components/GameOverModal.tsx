import React from 'react';

interface GameOverModalProps {
  show: boolean;
  score: number;
  highScore: number;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ show, score, highScore, onRestart }) => {
  if (!show) {
    return null;
  }

  return (
    <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center z-10 text-center">
      <div className="bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-600 animate-fade-in-up">
        <h2 className="text-5xl font-extrabold text-red-500 mb-4">Game Over</h2>
        <div className="text-xl mb-2">
          <span className="text-slate-400">Your Score:</span>
          <span className="font-bold text-yellow-300 ml-2">{score}</span>
        </div>
        <div className="text-xl mb-6">
          <span className="text-slate-400">High Score:</span>
          <span className="font-bold text-green-400 ml-2">{highScore}</span>
        </div>
        <button
          onClick={onRestart}
          className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold py-3 px-8 rounded-lg text-xl transition-transform duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-yellow-300 focus:ring-opacity-50"
        >
          Restart
        </button>
      </div>
      <style>{`
        @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
            animation: fade-in-up 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
