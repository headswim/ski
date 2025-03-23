import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import Slope from './Slope';
import Skiier from './Skiier';

interface GameProps {
  width?: string;
  height?: string;
}

const Game: React.FC<GameProps> = ({ width = '100%', height = '100vh' }) => {
  const [position, setPosition] = useState(0); // Skiier's horizontal position
  const slopeWidth = 10; // Width of the slope
  const moveSpeed = 0.1; // How fast the skiier moves side to side
  
  // Track which keys are currently pressed
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  
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
      // Move right (when left arrow pressed)
      if (keysPressed.current['ArrowLeft'] || keysPressed.current['a']) {
        setPosition((prev) => Math.min(prev + moveSpeed, slopeWidth / 2 - 1));
      }
      
      // Move left (when right arrow pressed)
      if (keysPressed.current['ArrowRight'] || keysPressed.current['d']) {
        setPosition((prev) => Math.max(prev - moveSpeed, -slopeWidth / 2 + 1));
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
  }, []);
  
  return (
    <div style={{ width, height }}>
      <Canvas
        camera={{ 
          position: [0, 3, -6], // Higher position to see down the hill better
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
        
        {/* Slope and environment */}
        <Slope />
        
        {/* Player's skiier */}
        <Skiier position={[position, 0, 0]} />
      </Canvas>
    </div>
  );
};

export default Game; 