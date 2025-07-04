import React, { useState, useCallback, useEffect } from 'react';
import { GameContainer } from './components/GameContainer';
import { GameOverModal } from './components/GameOverModal';
import { Scoreboard } from './components/Scoreboard';
import { EMOJI_PROGRESSION, INITIAL_EMOJI_LEVELS } from './constants';
import { EmojiInfo } from './types';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<'playing' | 'gameOver'>('playing');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem('emoji-merge-highscore') || 0));
  const [nextEmoji, setNextEmoji] = useState<EmojiInfo | null>(null);
  
  const generateNextEmoji = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * INITIAL_EMOJI_LEVELS);
    setNextEmoji(EMOJI_PROGRESSION[randomIndex]);
  }, []);

  useEffect(() => {
    generateNextEmoji();
  }, [generateNextEmoji]);

  const handleMerge = useCallback((points: number) => {
    setScore(prev => prev + points);
  }, []);
  
  const handleGameOver = useCallback(() => {
    if (gameState === 'playing') {
      setGameState('gameOver');
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('emoji-merge-highscore', score.toString());
      }
    }
  }, [score, highScore, gameState]);
  
  const handleRestart = useCallback(() => {
    setScore(0);
    setGameState('playing');
    generateNextEmoji();
  }, [generateNextEmoji]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 font-sans bg-slate-900">
      <div className="w-full max-w-lg mx-auto">
        <header className="flex justify-between items-center mb-4 px-2">
            <h1 className="text-2xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500">
              Emoji Merge
            </h1>
            <Scoreboard score={score} highScore={highScore} nextEmoji={nextEmoji} />
        </header>

        <main className="relative w-full">
            <GameContainer
              onMerge={handleMerge}
              onGameOver={handleGameOver}
              nextEmoji={nextEmoji}
              onNextEmojiNeeded={generateNextEmoji}
              isGameOver={gameState === 'gameOver'}
            />
            <GameOverModal
              show={gameState === 'gameOver'}
              score={score}
              highScore={highScore}
              onRestart={handleRestart}
            />
        </main>

        <footer className="text-center mt-4 text-slate-400 text-sm">
          <p>Drop emojis. Match two of the same kind to merge them into a bigger one!</p>
          <p className="mt-2 text-slate-500">
            &copy; {new Date().getFullYear()} KingSyah. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default App;