import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import Slope from './Slope';
import Skiier from './Skiier';
import Yeti from './Yeti';

// Type definitions for our component props
interface GameProps {
  width?: string;
  height?: string;
}

// Collision detection constants
const COLLISION_DISTANCE = 0.8; // Tighter collision distance for more precise hits
const COLLISION_Z_THRESHOLD = 5; // LARGER Z threshold for more forward detection
const CRASH_RECOVERY_TIME = 2000; // Time in ms to recover from crash
const YETI_APPEARANCE_SCORE = 50; // Score at which the yeti appears
const YETI_ATTACK_DELAY = 5000; // 5 seconds delay before yeti starts chasing
const YETI_COLLISION_DISTANCE = 1.2; // Distance at which the yeti catches the player
const YETI_Z_COLLISION_DISTANCE = 3.0; // Z distance for collision - larger for behind attacks

const Game: React.FC<GameProps> = ({ width = '100%', height = '100vh' }) => {
  const [position, setPosition] = useState(0); // Skiier's horizontal position
  const [crashed, setCrashed] = useState(false); // Tracks if player has crashed
  const [score, setScore] = useState(0); // Player's score
  const [lookBehind, setLookBehind] = useState(false); // Tracks if we're looking behind
  const [showYeti, setShowYeti] = useState(false); // Tracks if yeti should be shown
  const [showYetiWarning, setShowYetiWarning] = useState(false); // Warning message
  const [yetiAttacking, setYetiAttacking] = useState(false); // Tracks if yeti is attacking
  const [yetiCaught, setYetiCaught] = useState(false); // Tracks if yeti has caught player
  const slopeWidth = 10; // Width of the slope
  const moveSpeed = 0.1; // How fast the skiier moves side to side
  
  // For the yeti's initial position (captured when the yeti first appears)
  const initialYetiPosition = useRef<[number, number, number]>([0, 0, 0]);
  
  // Track which keys are currently pressed
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  
  // Keep track of obstacle positions
  const obstaclePositions = useRef<{x: number, z: number}[]>([]);
  
  // Track yeti position for collision detection
  const yetiPosition = useRef<{x: number, z: number} | null>(null);
  
  // Track last crash time to prevent multiple crashes in quick succession
  const lastCrashTime = useRef<number>(0);
  
  // Track if yeti has already appeared once
  const yetiHasAppeared = useRef<boolean>(false);
  
  // Update obstacle positions from Slope component
  const updateObstaclePositions = useCallback((positions: {x: number, z: number}[]) => {
    // Only update positions if we have valid data
    if (!positions || positions.length === 0) return;
    
    obstaclePositions.current = positions;
    
    // Check for collisions if not already crashed
    if (!crashed && !yetiCaught) {
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
      
      // Check for yeti collision if yeti is attacking
      if (yetiAttacking && yetiPosition.current) {
        const dx = Math.abs(playerPosition.x - yetiPosition.current.x);
        const dz = Math.abs(playerPosition.z - yetiPosition.current.z);
        
        // If yeti is close enough on both axes
        // We use larger Z threshold since yeti is coming from behind
        if (dx < YETI_COLLISION_DISTANCE && dz < YETI_Z_COLLISION_DISTANCE) {
          console.log(`Yeti caught player! Distance X: ${dx.toFixed(2)}, Z: ${dz.toFixed(2)}`);
          handleYetiCatch();
        }
      }
    }
  }, [position, crashed, yetiAttacking, yetiCaught]);
  
  // Handle yeti position updates for collision detection
  const handleYetiPositionUpdate = useCallback((pos: {x: number, z: number}) => {
    yetiPosition.current = pos;
  }, []);
  
  // Function to get the current player position for the Yeti
  const getCurrentPlayerPosition = useCallback(() => {
    return { x: position, z: 0 };
  }, [position]);
  
  // Handle crash event
  const handleCrash = () => {
    // Don't reset score if being eaten by yeti
    if (!yetiAttacking) {
      setCrashed(true);
      setScore(0); // Reset score to 0 on crash
      lastCrashTime.current = Date.now();
      
      // Recover after a delay
      setTimeout(() => {
        setCrashed(false);
      }, CRASH_RECOVERY_TIME);
    }
  };
  
  // Handle yeti catching the player
  const handleYetiCatch = () => {
    setYetiCaught(true);
    setCrashed(true); // You're also crashed
    
    // No recovery from yeti catch - game over!
    console.log("The yeti got you!");
  };
  
  // Increment score over time
  useEffect(() => {
    const scoreInterval = setInterval(() => {
      if (!crashed && !yetiCaught) {
        setScore(prevScore => prevScore + 1);
      }
    }, 100);
    
    return () => clearInterval(scoreInterval);
  }, [crashed, yetiCaught]);
  
  // Track score to trigger yeti appearance
  useEffect(() => {
    // Only show yeti once per game session
    if (score >= YETI_APPEARANCE_SCORE && !yetiHasAppeared.current) {
      // Show warning message
      setShowYetiWarning(true);
      
      // Hide warning after 3 seconds
      setTimeout(() => {
        setShowYetiWarning(false);
      }, 3000);
      
      // Store the initial position where yeti will appear - FAR BEHIND player (negative Z)
      // First value: X position (horizontal), Second: Y position (height), Third: Z position (distance)
      initialYetiPosition.current = [position, 0, -120]; // Position Z much further behind player like trees spawn
      
      // Track that yeti has appeared (this prevents multiple yetis)
      yetiHasAppeared.current = true;
      
      // After a delay, start the yeti attack sequence
      setTimeout(() => {
        // Show yeti and start attack
        setShowYeti(true);
        setYetiAttacking(true);
      }, YETI_ATTACK_DELAY);
    }
  }, [score, position]);
  
  // Handle keyboard controls - key down
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = true;
      
      // Handle spacebar for looking behind - log to verify it's detected
      if (e.code === 'Space') {
        console.log('Space pressed');
        setLookBehind(true);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false;
      
      // Handle spacebar release
      if (e.code === 'Space') {
        console.log('Space released');
        setLookBehind(false);
      }
    };
    
    // Animation frame for smooth movement
    let animationFrameId: number;
    
    const updatePosition = () => {
      // Only allow movement if not crashed and not being eaten by yeti
      if (!crashed && !yetiCaught) {
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
  }, [crashed, moveSpeed, slopeWidth, yetiCaught]);
  
  return (
    <div style={{ width, height }}>
      <Canvas
        camera={{ 
          position: [0, 3, -6], // Position camera behind the player
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
        
        {/* Rotate the scene rather than the camera */}
        <group rotation={[0, lookBehind ? Math.PI : 0, 0]}>
          {/* We need to cast the components to any to bypass TypeScript type checking */}
          {/* @ts-ignore */}
          <Slope onUpdateObstacles={updateObstaclePositions} />
          
          {/* @ts-ignore */}
          <Skiier position={[position, 0, 0]} crashed={crashed} />
          
          {/* Show the yeti only when triggered */}
          {showYeti && (
            <Yeti 
              initialPosition={initialYetiPosition.current}
              getPlayerPosition={getCurrentPlayerPosition}
              attacking={yetiAttacking}
              onPositionUpdate={handleYetiPositionUpdate}
            />
          )}
        </group>
        
        {/* Instructions */}
        <Html position={[-4, 2, -5]}>
          <div style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.7)', 
            color: 'white', 
            padding: '10px', 
            borderRadius: '5px', 
            fontFamily: 'Arial', 
            width: '200px',
            pointerEvents: 'none' // Make sure it doesn't interfere with gameplay
          }}>
            <p>Use Arrow Keys or A/D to steer</p>
            <p>Avoid the gold aspen trees!</p>
            <p>Hold SPACEBAR to look behind</p>
          </div>
        </Html>
        
        {/* Yeti warning */}
        {showYetiWarning && (
          <Html position={[0, 3, -4]}>
            <div style={{ 
              backgroundColor: 'rgba(255, 0, 0, 0.7)', 
              color: 'white', 
              padding: '15px', 
              borderRadius: '5px', 
              fontFamily: 'Arial', 
              fontSize: '20px',
              fontWeight: 'bold',
              width: '300px',
              textAlign: 'center',
              pointerEvents: 'none',
              animation: 'pulse 0.5s infinite alternate'
            }}>
              <p>WARNING: A YETI HAS BEEN SPOTTED!</p>
            </div>
          </Html>
        )}
        
        {/* Score display */}
        <Html position={[4, 2, -5]}>
          <div style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.7)', 
            color: 'white', 
            padding: '10px', 
            borderRadius: '5px', 
            fontFamily: 'Arial', 
            fontSize: '18px',
            width: '120px',
            textAlign: 'center',
            pointerEvents: 'none'
          }}>
            <p>Score: {score}</p>
          </div>
        </Html>
      </Canvas>
    </div>
  );
};

export default Game; 