import React, { useRef, useState, useEffect, ReactElement, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group, Object3D, DoubleSide } from 'three';
import ObstacleTree from './ObstacleTree';

// The number of slope segments to render
const SLOPE_SEGMENTS = 40; // Increased for longer visible slope
// The length of each slope segment
const SEGMENT_LENGTH = 8;
// The total slope length (segments * length)
const SLOPE_LENGTH = SLOPE_SEGMENTS * SEGMENT_LENGTH;
// Slope width
const SLOPE_WIDTH = 10;
// Speed of the slope animation (how fast we're "skiing")
const SLOPE_SPEED = 0.4;
// Hill angle in degrees (converted to radians in the code)
const HILL_ANGLE = 10;
// Gravity for physics
const GRAVITY = 9.8;
// How often to spawn a new collidable tree (in milliseconds)
const OBSTACLE_SPAWN_RATE = 8000;
// How far ahead to spawn obstacles
const OBSTACLE_SPAWN_DISTANCE = 120;

// Helper function for smooth movement
const lerp = (start: number, end: number, t: number): number => {
  return start * (1 - t) + end * t;
};

// Single tree component with its own animation
const Tree: React.FC<{ 
  position: [number, number, number],
  isObstacle?: boolean
}> = ({ position, isObstacle = false }) => {
  const treeRef = useRef<Group>(null);
  const height = useMemo(() => isObstacle ? 3.5 + Math.random() * 1.5 : 2 + Math.random() * 2, []); // Aspen trees taller
  const initialZ = position[2];
  
  // Simple physics simulation for tree movement
  useFrame((state, delta) => {
    if (treeRef.current) {
      // Move tree forward continuously at slope speed
      treeRef.current.position.z -= SLOPE_SPEED * delta * 60;
      
      // If tree has moved too far, reset to far away
      // Using a much lower value to ensure trees stay visible longer
      if (treeRef.current.position.z < -100) {
        treeRef.current.position.z = 200;
      }
    }
  });
  
  // Different colors for tree types
  // Regular pine trees have dark trunks and green tops
  // Obstacle aspen trees have white/silver trunks and more yellow-gold tops
  const treeTopColor = isObstacle ? "#F7D94C" : "#0A5F38"; // Bright yellow-gold for aspen foliage
  const treeTrunkColor = isObstacle ? "#FAFAFA" : "#8B4513"; // Brighter white for aspen trunk
  
  // Small random trunk bend for aspens (they often have a slight curve)
  const trunkBend = isObstacle ? Math.random() * 0.1 - 0.05 : 0;
  
  return (
    <group ref={treeRef} position={[position[0], -0.8, position[2]]}>
      {/* Snow mound at base */}
      {isObstacle && (
        <mesh position={[0, 0.1, 0]} castShadow>
          <sphereGeometry args={[0.7, 16, 16, 0, Math.PI * 2, 0, 0.5]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
      )}
      
      {/* Tree trunk */}
      {isObstacle ? (
        // Aspen trunk with distinctive look (tall, slender, white)
        <group position={[0, height / 2, 0]} rotation={[0, 0, trunkBend]}>
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
      ) : (
        // Regular pine tree trunk
        <mesh position={[0, height / 2, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.25, height, 8]} />
          <meshStandardMaterial color={treeTrunkColor} />
        </mesh>
      )}
      
      {/* Tree top - different shape for aspens vs pines */}
      {isObstacle ? (
        // Aspen foliage - more oval/round shape
        <group>
          {/* Multiple smaller foliage clusters for aspen */}
          <mesh position={[0, height + 0.5, 0]} castShadow>
            <sphereGeometry args={[1.0, 16, 16]} />
            <meshStandardMaterial color={treeTopColor} />
          </mesh>
          <mesh position={[0.7, height + 0.2, 0]} castShadow>
            <sphereGeometry args={[0.7, 16, 16]} />
            <meshStandardMaterial color={treeTopColor} />
          </mesh>
          <mesh position={[-0.7, height + 0.3, 0]} castShadow>
            <sphereGeometry args={[0.7, 16, 16]} />
            <meshStandardMaterial color={treeTopColor} />
          </mesh>
          <mesh position={[0, height - 0.3, 0.5]} castShadow>
            <sphereGeometry args={[0.8, 16, 16]} />
            <meshStandardMaterial color={treeTopColor} />
          </mesh>
        </group>
      ) : (
        // Regular pine tree - conical shape
        <mesh position={[0, height + 0.7, 0]} castShadow>
          <coneGeometry args={[1.0, 2.2, 8]} />
          <meshStandardMaterial color={treeTopColor} />
        </mesh>
      )}
    </group>
  );
};

// Update the Slope component interface to accept the callback prop
interface SlopeProps {
  onUpdateObstacles?: (positions: {x: number, z: number}[]) => void;
}

// Renamed to avoid conflict with imported component
const OldObstacleTree: React.FC<{
  onPositionUpdate?: (position: {x: number, z: number}) => void;
}> = ({ onPositionUpdate }) => {
  const [position, setPosition] = useState<[number, number, number]>([0, 0, OBSTACLE_SPAWN_DISTANCE]);
  
  // Reset the tree with a new random position
  const resetTree = useCallback(() => {
    // Random x position within the slope width (but not too close to the edges)
    const xPos = (Math.random() * (SLOPE_WIDTH - 4)) - ((SLOPE_WIDTH - 4) / 2);
    setPosition([xPos, 0, OBSTACLE_SPAWN_DISTANCE]);
  }, []);
  
  const treeRef = useRef<Group>(null);
  
  // Move the tree and reset when it goes off-screen
  useFrame((state, delta) => {
    if (treeRef.current) {
      // Move tree forward with adjusted speed for consistent motion
      const moveAmount = SLOPE_SPEED * delta * 60;
      treeRef.current.position.z -= moveAmount;
      
      // Report position for collision detection - IMPORTANT for gameplay
      if (onPositionUpdate) {
        // For immediate collision detection, use a larger prediction
        // This makes the collision happen before visual intersection
        const predictedZ = treeRef.current.position.z - (moveAmount * 2);
        
        onPositionUpdate({
          x: treeRef.current.position.x,
          z: predictedZ 
        });
      }
      
      // If tree has moved too far, reset to a new position
      if (treeRef.current.position.z < -10) {
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
    }, OBSTACLE_SPAWN_RATE);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [resetTree]);
  
  return (
    <group ref={treeRef} position={position}>
      {/* Using obstacle tree with snow mound */}
      <Tree position={[0, -0.5, 0]} isObstacle={true} />
    </group>
  );
};

const Slope: React.FC<SlopeProps> = ({ onUpdateObstacles }) => {
  // Convert hill angle to radians
  const hillAngleRad = (HILL_ANGLE * Math.PI) / 180;
  
  // Create a ref for the scene 
  const sceneRef = useRef<Group>(null);
  
  // Track obstacle positions for collision detection
  const obstaclePositions = useRef<{x: number, z: number}[]>([]);
  
  // Update obstacle position in the collection
  const handleObstaclePositionUpdate = useCallback((position: {x: number, z: number}) => {
    // Add a small hitbox width to increase collision reliability
    const adjustedPosition = {
      x: position.x,
      z: position.z
    };
    
    obstaclePositions.current = [adjustedPosition]; // Currently just one obstacle
    
    // Report obstacle positions to the Game component
    if (onUpdateObstacles) {
      onUpdateObstacles(obstaclePositions.current);
    }
  }, [onUpdateObstacles]);
  
  // Simplified physics-based downhill slope
  return (
    <>
      {/* Main scene with the slope */}
      <group rotation={[hillAngleRad, 0, 0]}>
        {/* Snow-covered ground (will be big enough that we don't need to move it) */}
        <mesh 
          position={[0, -0.5, 50]} 
          rotation={[-Math.PI / 2, 0, 0]} 
          receiveShadow
        >
          <planeGeometry args={[300, 500]} />
          <meshStandardMaterial color="#FFFFFF" side={DoubleSide} />
        </mesh>
        
        {/* Infinite slope */}
        <group>
          {/* Main slope surface */}
          <mesh 
            position={[0, 0, 50]} 
            rotation={[-Math.PI / 2, 0, 0]} 
            receiveShadow
          >
            <planeGeometry args={[SLOPE_WIDTH, 400]} />
            <meshStandardMaterial color="#F0F8FF" />
          </mesh>
        </group>
        
        {/* Trees on the left and right sides */}
        <TreeField />
        
        {/* Obstacle trees on the slope - using our improved component */}
        <ObstacleTree onPositionUpdate={handleObstaclePositionUpdate} />
        
        {/* Distant mountains for horizon */}
        <mesh position={[0, 10, 230]} castShadow>
          <boxGeometry args={[200, 40, 5]} />
          <meshStandardMaterial color="#808080" />
        </mesh>
      </group>
      
      {/* Sky (not affected by the slope) */}
      <mesh position={[0, 0, -100]}>
        <sphereGeometry args={[150, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial color="#87CEEB" side={DoubleSide} />
      </mesh>
    </>
  );
};

// Generate a field of trees with better distribution
const TreeField: React.FC = () => {
  const trees = useMemo(() => {
    const treeElements: ReactElement[] = [];
    // Create trees for both sides of the slope
    for (let i = 0; i < 200; i++) {
      // Distribute trees in a large area
      const z = Math.random() * 400 - 150;
      
      // Distance from the slope increases as trees go further out
      const distanceFromSlope = SLOPE_WIDTH / 2 + 3 + Math.random() * 15;
      
      // Add a bit of randomness to make the forest look more natural
      const xOffset = Math.random() * 5 - 2.5;
      
      // Left side trees
      treeElements.push(
        <Tree 
          key={`tree-left-${i}`} 
          position={[-distanceFromSlope + xOffset, 0, z]} 
        />
      );
      
      // Right side trees
      treeElements.push(
        <Tree 
          key={`tree-right-${i}`} 
          position={[distanceFromSlope + xOffset, 0, z]} 
        />
      );
    }
    return treeElements;
  }, []);
  
  return <>{trees}</>;
};

export default Slope; 