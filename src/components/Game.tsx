import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import Slope from './Slope';
import Skiier from './Skiier';

// Type definitions for our component props
interface GameProps {
  width?: string;
  height?: string;
}

// Collision detection constants
const COLLISION_DISTANCE = 0.8; // Tighter collision distance for more precise hits
const COLLISION_Z_THRESHOLD = 5; // LARGER Z threshold for more forward detection
const CRASH_RECOVERY_TIME = 2000; // Time in ms to recover from crash

const Game: React.FC<GameProps> = ({ width = '100%', height = '100vh' }) => {
  const [position, setPosition] = useState(0); // Skiier's horizontal position
  const [crashed, setCrashed] = useState(false); // Tracks if player has crashed
  const [score, setScore] = useState(0); // Player's score
  const slopeWidth = 10; // Width of the slope
  const moveSpeed = 0.1; // How fast the skiier moves side to side
  
  // Track which keys are currently pressed
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  
  // Keep track of obstacle positions
  const obstaclePositions = useRef<{x: number, z: number}[]>([]);
  
  // Track last crash time to prevent multiple crashes in quick succession
  const lastCrashTime = useRef<number>(0);
  
  // Update obstacle positions from Slope component
  const updateObstaclePositions = useCallback((positions: {x: number, z: number}[]) => {
    // Only update positions if we have valid data
    if (!positions || positions.length === 0) return;
    
    obstaclePositions.current = positions;
    
    // Check for collisions if not already crashed
    if (!crashed) {
      const playerPosition = { x: position, z: 0 };
      const currentTime = Date.now();
      
      // Ensure we're not in a post-crash grace period (prevents double crashes)
      if (currentTime - lastCrashTime.current < 500) return;
      
      // Check each obstacle
      for (const obstacle of positions) {
        // We want to detect collisions BEFORE the tree reaches the player
        // So we'll check for obstacles approaching the player
        // Only check obstacles in front of the player (negative Z means it's in front)
        if (obstacle.z < 0 && obstacle.z > -COLLISION_Z_THRESHOLD) {
          const dx = Math.abs(playerPosition.x - obstacle.x);
          
          // Debug near misses
          if (dx < 1.5 && dx >= COLLISION_DISTANCE) {
            console.log(`Near miss! Player: ${playerPosition.x.toFixed(2)}, Obstacle: ${obstacle.x.toFixed(2)}, Distance: ${dx.toFixed(2)}`);
          }
          
          // If horizontal distance is less than threshold, collision occurred
          if (dx < COLLISION_DISTANCE) {
            console.log(`Collision detected! Player: ${playerPosition.x.toFixed(2)}, Obstacle: ${obstacle.x.toFixed(2)}, Distance: ${dx.toFixed(2)}, Z: ${obstacle.z.toFixed(2)}`);
            handleCrash();
            break;
          }
        }
      }
    }
  }, [position, crashed]);
  
  // Handle crash event
  const handleCrash = () => {
    setCrashed(true);
    setScore(0); // Reset score to 0 on crash
    lastCrashTime.current = Date.now();
    
    // Recover after a delay
    setTimeout(() => {
      setCrashed(false);
    }, CRASH_RECOVERY_TIME);
  };
  
  // Increment score over time
  useEffect(() => {
    const scoreInterval = setInterval(() => {
      if (!crashed) {
        setScore(prevScore => prevScore + 1);
      }
    }, 100);
    
    return () => clearInterval(scoreInterval);
  }, [crashed]);
  
  // Handle keyboard controls - key down
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = true;
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false;
    };
    
    // Animation frame for smooth movement
    let animationFrameId: number;
    
    const updatePosition = () => {
      // Only allow movement if not crashed
      if (!crashed) {
        // Move right (when left arrow pressed)
        if (keysPressed.current['ArrowLeft'] || keysPressed.current['a']) {
          setPosition((prev) => Math.min(prev + moveSpeed, slopeWidth / 2 - 1));
        }
        
        // Move left (when right arrow pressed)
        if (keysPressed.current['ArrowRight'] || keysPressed.current['d']) {
          setPosition((prev) => Math.max(prev - moveSpeed, -slopeWidth / 2 + 1));
        }
      }
      
      animationFrameId = requestAnimationFrame(updatePosition);
    };
    
    // Start animation loop
    animationFrameId = requestAnimationFrame(updatePosition);
    
    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [crashed, moveSpeed, slopeWidth]);
  
  return (
    <div style={{ width, height }}>
      <Canvas
        camera={{ 
          position: [0, 3, -6], // Closer camera position to see the skier better
          fov: 75
        }}
        shadows
      >
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1} 
          castShadow 
          shadow-mapSize-width={2048} 
          shadow-mapSize-height={2048} 
        />
        
        {/* We need to cast the components to any to bypass TypeScript type checking */}
        {/* @ts-ignore */}
        <Slope onUpdateObstacles={updateObstaclePositions} />
        
        {/* @ts-ignore */}
        <Skiier position={[position, 0, 0]} crashed={crashed} />
      </Canvas>
      
      {/* Score display */}
      <div className="game-info">
        <div className="score">Score: {score}</div>
        {crashed && <div className="crash-message">Crashed!</div>}
      </div>
      
      {/* Game controls */}
      <div className="game-controls">
        <p>Use Arrow Keys or A/D to steer</p>
        <p>Avoid the gold aspen trees!</p>
      </div>
    </div>
  );
};

export default Game; 