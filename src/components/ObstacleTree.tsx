import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';

// Constants for obstacle trees
const SLOPE_WIDTH = 10;
const SLOPE_SPEED = 0.4;
const OBSTACLE_SPAWN_DISTANCE = 120;

// ObstacleTree component with immediate collision detection
const ObstacleTree: React.FC<{
  onPositionUpdate?: (position: {x: number, z: number}) => void;
}> = ({ onPositionUpdate }) => {
  const [position, setPosition] = useState<[number, number, number]>([0, 0, OBSTACLE_SPAWN_DISTANCE]);
  
  // Reset the tree with a new random position
  const resetTree = useCallback(() => {
    // Random x position within the slope width (but not too close to the edges)
    // Using Math.round to ensure consistent grid-like positioning
    const randomOffset = Math.floor(Math.random() * 5) * 0.6 - 1.5;
    const xPos = randomOffset;
    
    // Set the new position
    setPosition([xPos, 0, OBSTACLE_SPAWN_DISTANCE]);
    
    // If the tree ref exists, update its position immediately to prevent jitter
    if (treeRef.current) {
      treeRef.current.position.x = xPos;
      treeRef.current.position.z = OBSTACLE_SPAWN_DISTANCE;
    }
  }, []);
  
  const treeRef = useRef<Group>(null);
  
  // Use this to track the last frame position for more accurate collision detection
  const lastPositionRef = useRef({ x: 0, z: OBSTACLE_SPAWN_DISTANCE });
  
  // Move the tree and reset when it goes off-screen
  useFrame((state, delta) => {
    if (treeRef.current) {
      // Use a consistent delta time for smoother movement
      const smoothDelta = Math.min(delta, 0.05); // Cap the delta to prevent large jumps
      const moveAmount = SLOPE_SPEED * smoothDelta * 60;
      
      // Apply movement directly to the z-axis only
      treeRef.current.position.z -= moveAmount;
      
      // Report position for collision detection - crucial for immediate feedback
      if (onPositionUpdate) {
        // For trees approaching the player, use a modified prediction
        // that makes collisions happen at the visually appropriate time
        const currentZ = treeRef.current.position.z;
        
        // Calculate a prediction that gets more aggressive as the tree approaches the player
        // but with a more precise approach for nearby trees
        const distanceToPlayer = Math.abs(currentZ);
        
        // More accurate prediction curve - less aggressive for close trees
        let predictionFactor = 0;
        if (distanceToPlayer < 5) {
          // Very close to player - minimal prediction for accurate visual hits
          predictionFactor = 0.2;
        } else if (distanceToPlayer < 15) {
          // Medium distance - moderate prediction
          predictionFactor = 0.5;
        } else {
          // Far away - standard prediction 
          predictionFactor = 1.0;
        }
        
        const predictedZ = currentZ - (moveAmount * predictionFactor);
        
        // Store and report the position with exact x-coordinate (no rounding)
        // This ensures the x-position is exactly what you see
        lastPositionRef.current = {
          x: treeRef.current.position.x,
          z: predictedZ
        };
        
        // Report the prediction
        onPositionUpdate(lastPositionRef.current);
      }
      
      // If tree has moved past the player, reset to a new position
      if (treeRef.current.position.z < -15) {
        resetTree();
      }
    }
  });
  
  // Initial setup
  useEffect(() => {
    // Initial placement
    resetTree();
    
    // Set up timer to occasionally reset the tree
    const intervalId = setInterval(() => {
      if (Math.random() < 0.3) { // 30% chance to respawn
        // Only respawn if the current tree is far enough away
        if (treeRef.current && treeRef.current.position.z > 100) {
          resetTree();
        }
      }
    }, 8000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [resetTree]);
  
  // Aspen tree visual properties
  const height = useMemo(() => 3.5 + Math.random() * 0.5, []); // Less height variation
  const treeTopColor = "#F7D94C"; // Bright yellow-gold for aspen foliage
  const treeTrunkColor = "#FAFAFA"; // Brighter white for aspen trunk
  const trunkBend = useMemo(() => Math.random() * 0.02 - 0.01, []); // Much less trunk bend
  
  // Use a stable ref for the position to prevent wobbling during updates
  const stablePositionRef = useRef(position);
  
  // Only update position in useEffect to avoid constant re-renders
  useEffect(() => {
    stablePositionRef.current = position;
  }, [position]);
  
  return (
    <group ref={treeRef} position={position}>
      {/* Snow mound at base */}
      <mesh position={[0, -0.3, 0]} castShadow>
        <sphereGeometry args={[0.7, 16, 16, 0, Math.PI * 2, 0, 0.5]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      
      {/* Aspen trunk with minimal bend */}
      <group position={[0, height / 2 - 0.5, 0]} rotation={[0, 0, trunkBend]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.15, 0.2, height, 8]} />
          <meshStandardMaterial color={treeTrunkColor} />
        </mesh>
        
        {/* Characteristic aspen trunk markings */}
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={`mark-${i}`} position={[0, -height/2 + i * height/8, 0.16]} castShadow>
            <boxGeometry args={[0.05, 0.05, 0.02]} />
            <meshStandardMaterial color="#222222" />
          </mesh>
        ))}
      </group>
      
      {/* Aspen foliage - more compact clusters */}
      <group position={[0, height, 0]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <sphereGeometry args={[0.9, 16, 16]} />
          <meshStandardMaterial color={treeTopColor} />
        </mesh>
        <mesh position={[0.5, 0.2, 0]} castShadow>
          <sphereGeometry args={[0.6, 16, 16]} />
          <meshStandardMaterial color={treeTopColor} />
        </mesh>
        <mesh position={[-0.5, 0.2, 0]} castShadow>
          <sphereGeometry args={[0.6, 16, 16]} />
          <meshStandardMaterial color={treeTopColor} />
        </mesh>
        <mesh position={[0, -0.2, 0.3]} castShadow>
          <sphereGeometry args={[0.7, 16, 16]} />
          <meshStandardMaterial color={treeTopColor} />
        </mesh>
      </group>
    </group>
  );
};

export default ObstacleTree; 