import React, { useRef, useEffect, useCallback, useState } from 'react';
import Matter from 'matter-js';
import { EMOJI_PROGRESSION, GAME_WIDTH, GAME_HEIGHT, WALL_THICKNESS, GAME_OVER_LINE_Y_RATIO } from '../constants';
import { EmojiInfo } from '../types';

interface GameContainerProps {
  onMerge: (points: number) => void;
  onGameOver: () => void;
  nextEmoji: EmojiInfo | null;
  onNextEmojiNeeded: () => void;
  isGameOver: boolean;
}

// Extend Matter's Body type to include custom properties
interface EmojiBody extends Matter.Body {
  emojiInfo: EmojiInfo;
}

export const GameContainer: React.FC<GameContainerProps> = ({
  onMerge,
  onGameOver,
  nextEmoji,
  onNextEmojiNeeded,
  isGameOver
}) => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const lastDropTimeRef = useRef<number>(0);
  const [pointerX, setPointerX] = useState<number | null>(null);

  const createEmojiBody = useCallback((x: number, y: number, emojiInfo: EmojiInfo): EmojiBody => {
    const body = Matter.Bodies.circle(x, y, emojiInfo.radius, {
      restitution: 0.3,
      friction: 0.4,
      isStatic: false,
      render: {
        sprite: {
          texture: '', // We'll draw the emoji using canvas context instead
          xScale: 1,
          yScale: 1,
        },
      },
      label: `emoji-${emojiInfo.level}`,
    }) as EmojiBody;
    body.emojiInfo = emojiInfo;
    return body;
  }, []);

  useEffect(() => {
    const engine = Matter.Engine.create({ gravity: { y: 0.8 } });
    engineRef.current = engine;
    const world = engine.world;

    if (!sceneRef.current) return;
    
    const render = Matter.Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        wireframes: false,
        background: 'transparent',
      },
    });
    renderRef.current = render;

    // Walls and Floor
    const floor = Matter.Bodies.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - WALL_THICKNESS / 2, GAME_WIDTH, WALL_THICKNESS, { isStatic: true, render: { fillStyle: '#475569' } });
    const leftWall = Matter.Bodies.rectangle(WALL_THICKNESS / 2, GAME_HEIGHT / 2, WALL_THICKNESS, GAME_HEIGHT, { isStatic: true, render: { fillStyle: '#475569' } });
    const rightWall = Matter.Bodies.rectangle(GAME_WIDTH - WALL_THICKNESS / 2, GAME_HEIGHT / 2, WALL_THICKNESS, GAME_HEIGHT, { isStatic: true, render: { fillStyle: '#475569' } });
    Matter.World.add(world, [floor, leftWall, rightWall]);

    // Game Over Line
    const gameOverLineY = GAME_HEIGHT * GAME_OVER_LINE_Y_RATIO;
    
    // Custom emoji rendering
    Matter.Events.on(render, 'afterRender', () => {
      const context = render.context;
      context.save();
      
      // Render existing emoji bodies
      world.bodies.forEach(body => {
        if (body.label.startsWith('emoji-')) {
          const emojiBody = body as EmojiBody;
          const { position, circleRadius } = emojiBody;
          context.font = `bold ${circleRadius * 1.4}px Arial`;
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          context.fillText(emojiBody.emojiInfo.emoji, position.x, position.y);
        }
      });
      
      // Render preview emoji
      if (nextEmoji && !isGameOver) {
        const x = pointerX !== null ? pointerX : GAME_WIDTH / 2;
        const y = 50;
        const radius = nextEmoji.radius;

        // Draw a guideline
        context.beginPath();
        context.moveTo(x, y + radius);
        context.lineTo(x, GAME_HEIGHT - WALL_THICKNESS);
        context.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        context.lineWidth = 1;
        context.setLineDash([4, 4]);
        context.stroke();
        context.setLineDash([]);
        
        // Draw preview emoji itself
        context.globalAlpha = pointerX !== null ? 1.0 : 0.6;
        context.font = `bold ${radius * 1.4}px Arial`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(nextEmoji.emoji, x, y);
        context.globalAlpha = 1.0;
      }
      
      // Draw Game Over Line
      context.beginPath();
      context.moveTo(WALL_THICKNESS, gameOverLineY);
      context.lineTo(GAME_WIDTH - WALL_THICKNESS, gameOverLineY);
      context.strokeStyle = 'rgba(239, 68, 68, 0.5)';
      context.lineWidth = 2;
      context.setLineDash([5, 5]);
      context.stroke();
      context.restore();
    });

    // Collision handling
    Matter.Events.on(engine, 'collisionStart', event => {
      const pairs = event.pairs;
      for (const pair of pairs) {
        const bodyA = pair.bodyA as EmojiBody;
        const bodyB = pair.bodyB as EmojiBody;

        if (bodyA.label.startsWith('emoji-') && bodyB.label.startsWith('emoji-') && bodyA.emojiInfo.level === bodyB.emojiInfo.level) {
          const currentLevel = bodyA.emojiInfo.level;
          if (currentLevel >= EMOJI_PROGRESSION.length - 1) continue;

          const nextLevelInfo = EMOJI_PROGRESSION[currentLevel + 1];
          const midPoint = {
            x: (bodyA.position.x + bodyB.position.x) / 2,
            y: (bodyA.position.y + bodyB.position.y) / 2,
          };
          
          Matter.World.remove(world, [bodyA, bodyB]);
          
          const newEmoji = createEmojiBody(midPoint.x, midPoint.y, nextLevelInfo);
          Matter.World.add(world, newEmoji);
          
          onMerge(bodyA.emojiInfo.score);
        }
      }
    });

    // Game Over Check
    Matter.Events.on(engine, 'afterUpdate', () => {
       if (isGameOver) return;
       const bodies = Matter.Composite.allBodies(world);
       for (const body of bodies) {
         if (!body.isStatic && body.label.startsWith('emoji-') && body.position.y - (body as EmojiBody).circleRadius! < gameOverLineY && body.velocity.y < 0.01 && body.speed < 0.1) {
             onGameOver();
             break;
         }
       }
    });

    const runner = Matter.Runner.create();
    runnerRef.current = runner;
    Matter.Runner.run(runner, engine);
    Matter.Render.run(render);

    return () => {
      if (runnerRef.current) Matter.Runner.stop(runnerRef.current);
      if (renderRef.current) Matter.Render.stop(renderRef.current);
      Matter.Engine.clear(engine);
      if (renderRef.current?.canvas) renderRef.current.canvas.remove();
      if (renderRef.current?.textures) renderRef.current.textures = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount
  
  useEffect(() => {
    if(isGameOver && engineRef.current && runnerRef.current) {
        runnerRef.current.enabled = false;
        // make all bodies static
        engineRef.current.world.bodies.forEach(body => {
            if(!body.isStatic) Matter.Body.setStatic(body, true);
        });
    }
  }, [isGameOver])

  const updatePointerPosition = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isGameOver || !nextEmoji) return;
    const bounds = sceneRef.current!.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const clampedX = Math.max(
      WALL_THICKNESS + nextEmoji.radius,
      Math.min(x, GAME_WIDTH - WALL_THICKNESS - nextEmoji.radius)
    );
    setPointerX(clampedX);
  };

  const handlePointerEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    updatePointerPosition(e);
  };
  
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    updatePointerPosition(e);
  };

  const handlePointerLeave = () => {
    setPointerX(null);
  };
  
  const handlePointerUp = () => {
    if (pointerX === null || !nextEmoji || !engineRef.current || isGameOver) return;
    
    const now = Date.now();
    if(now - lastDropTimeRef.current < 500) return; // Cooldown of 500ms
    lastDropTimeRef.current = now;

    const newEmoji = createEmojiBody(
        pointerX, 
        50, 
        nextEmoji
    );
    Matter.World.add(engineRef.current.world, newEmoji);
    
    onNextEmojiNeeded();
  };

  return (
    <div
      className="relative rounded-lg overflow-hidden border-4 border-slate-700 bg-slate-800/50 shadow-2xl shadow-slate-950/50 cursor-pointer"
      style={{ width: GAME_WIDTH, height: GAME_HEIGHT, touchAction: 'none' }}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    >
      <div ref={sceneRef} />
    </div>
  );
};