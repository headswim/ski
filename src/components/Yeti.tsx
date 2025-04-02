import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group } from 'three';

interface YetiProps {
  initialPosition: [number, number, number];
  getPlayerPosition: () => { x: number, z: number };
  attacking?: boolean;
  onPositionUpdate?: (position: {x: number, z: number}) => void;
}

// Helper function for smooth movement
const lerp = (start: number, end: number, t: number): number => {
  return start * (1 - t) + end * t;
};

// Same hill angle as in Slope and Skiier (in degrees, converted to radians)
const HILL_ANGLE = 10;
const HILL_ANGLE_RAD = (HILL_ANGLE * Math.PI) / 180;

// Attack states
enum AttackPhase {
  APPROACH,   // Initial approach from behind
  CHASE,      // Unrelenting chase
  ATTACK      // Final attack phase
}

const Yeti: React.FC<YetiProps> = ({ initialPosition, getPlayerPosition, attacking = false, onPositionUpdate }) => {
  const yetiRef = useRef<Group>(null);
  const [position, setPosition] = useState<[number, number, number]>(initialPosition);
  const targetPositionX = useRef(initialPosition[0]);
  const targetPositionZ = useRef(initialPosition[2]);
  const initialPlayerPosition = useRef<{x: number, z: number}>({ x: 0, z: 0 });
  const armAngle = useRef(0);
  const jumpHeight = useRef(0);
  const [attackPhase, setAttackPhase] = useState<AttackPhase>(AttackPhase.APPROACH);
  const [rotationY, setRotationY] = useState(0);
  const chaseSpeed = useRef(0.05);
  const visibilityHeight = useRef(-1); // Start below the snow 

  // Initialize the yeti with the starting position
  useEffect(() => {
    if (yetiRef.current) {
      yetiRef.current.position.set(initialPosition[0], visibilityHeight.current, initialPosition[2]);
    }
  }, [initialPosition]);

  // Update target position when attack state changes
  useEffect(() => {
    if (attacking) {
      // Capture initial player position
      const playerPosition = getPlayerPosition();
      initialPlayerPosition.current = playerPosition;
      
      // Set our initial target position to the player's current position
      targetPositionX.current = playerPosition.x;
    }
  }, [attacking, getPlayerPosition]);
  
  // Animate the yeti's movement
  useFrame((state, delta) => {
    if (!yetiRef.current || !attacking) return;
    
    // Get the latest player position
    const playerPosition = getPlayerPosition();
    
    // Calculate smoothed delta time for consistent movement
    const smoothDelta = Math.min(delta, 0.05); // Cap delta to prevent large jumps
    
    // State machine for attack phases
    switch (attackPhase) {
      case AttackPhase.APPROACH:
        // Initial approach from behind, significantly further back
        targetPositionZ.current = initialPosition[2] + 30; // Start further back
        
        // Stay closer to player's x position but with an offset
        targetPositionX.current = playerPosition.x + 2;
        
        // Gradually bring the yeti up through the snow as it gets closer
        if (visibilityHeight.current < 1.0) {
          visibilityHeight.current += smoothDelta * 0.3; // Slowly emerge from snow
        }
        
        // Dramatic running animation
        armAngle.current = Math.sin(state.clock.getElapsedTime() * 8) * 0.6;
        jumpHeight.current = Math.abs(Math.sin(state.clock.getElapsedTime() * 6)) * 0.3;
        
        // Gradually increase chase speed
        chaseSpeed.current = lerp(chaseSpeed.current, 0.07, 0.01);
        
        // Transition to chase phase when yeti has moved closer
        if (yetiRef.current.position.z < -40) {
          setAttackPhase(AttackPhase.CHASE);
        }
        break;
        
      case AttackPhase.CHASE:
        // Move closer to player
        targetPositionZ.current = -15; // Move closer but stay behind
        
        // Gradually move toward player's path
        targetPositionX.current = lerp(targetPositionX.current, playerPosition.x + 1, 0.03);
        
        // Ensure yeti is fully visible above snow now
        visibilityHeight.current = 1.0;
        
        // Faster running animation
        armAngle.current = Math.sin(state.clock.getElapsedTime() * 12) * 0.7;
        jumpHeight.current = Math.abs(Math.sin(state.clock.getElapsedTime() * 9)) * 0.4;
        
        // Increase chase speed
        chaseSpeed.current = lerp(chaseSpeed.current, 0.1, 0.01);
        
        // Check if we're close enough for the final attack
        if (yetiRef.current.position.z < -7) {
          setAttackPhase(AttackPhase.ATTACK);
        }
        break;
        
      case AttackPhase.ATTACK:
        // Final attack phase, getting very close to player
        targetPositionZ.current = 0.8; // Almost at player's position
        
        // Aggressive tracking - will follow player no matter where they go
        targetPositionX.current = lerp(targetPositionX.current, playerPosition.x, 0.15);
        
        // Aggressive attack animation
        armAngle.current = Math.sin(state.clock.getElapsedTime() * 15) * 1.0;
        jumpHeight.current = Math.abs(Math.sin(state.clock.getElapsedTime() * 12)) * 0.5;
        
        // Maximum chase speed for final attack
        chaseSpeed.current = 0.18;
        break;
    }
    
    // Apply smooth movement
    // Use chase speed for Z to adjust how quickly yeti catches up
    yetiRef.current.position.x = lerp(
      yetiRef.current.position.x, 
      targetPositionX.current, 
      0.05 * smoothDelta * 60
    );
    
    yetiRef.current.position.z = lerp(
      yetiRef.current.position.z, 
      targetPositionZ.current, 
      chaseSpeed.current * smoothDelta * 60
    );
    
    // Apply height for visibility and jumping
    yetiRef.current.position.y = visibilityHeight.current + jumpHeight.current;
    
    // Add mild bouncing/breathing effect
    const breathe = Math.sin(state.clock.getElapsedTime() * 1.5) * 0.03;
    yetiRef.current.scale.y = 1 + breathe;
    
    // Report position for collision detection
    if (onPositionUpdate) {
      onPositionUpdate({
        x: yetiRef.current.position.x,
        z: yetiRef.current.position.z
      });
    }
    
    // Update internal position state
    setPosition([yetiRef.current.position.x, yetiRef.current.position.y, yetiRef.current.position.z]);
  });
  
  return (
    <group 
      ref={yetiRef} 
      position={initialPosition} 
      rotation={[HILL_ANGLE_RAD, rotationY, 0]}
    >
      {/* Snow mound around the yeti when emerging */}
      {visibilityHeight.current > -0.5 && visibilityHeight.current < 0.9 && (
        <mesh position={[0, -0.5, 0]} castShadow>
          <sphereGeometry args={[1.2, 16, 16, 0, Math.PI * 2, 0, 0.6]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
      )}
    
      {/* Yeti body */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <capsuleGeometry args={[0.8, 1.5, 8, 16]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      
      {/* Yeti head */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <sphereGeometry args={[0.7, 16, 16]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      
      {/* Yeti face */}
      <group position={[0, 2.5, 0.6]}>
        {/* Eyes */}
        <mesh position={[0.2, 0.1, 0]} castShadow>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        
        <mesh position={[-0.2, 0.1, 0]} castShadow>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        
        {/* Angry eyebrows when attacking */}
        {attackPhase === AttackPhase.ATTACK && (
          <>
            <mesh position={[0.2, 0.25, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
              <boxGeometry args={[0.2, 0.05, 0.05]} />
              <meshStandardMaterial color="#333333" />
            </mesh>
            
            <mesh position={[-0.2, 0.25, 0]} rotation={[0, 0, -Math.PI / 4]} castShadow>
              <boxGeometry args={[0.2, 0.05, 0.05]} />
              <meshStandardMaterial color="#333333" />
            </mesh>
          </>
        )}
        
        {/* Mouth */}
        <mesh position={[0, -0.2, 0]} castShadow>
          {attackPhase === AttackPhase.ATTACK ? (
            // Open mouth when attacking
            <sphereGeometry args={[0.2, 16, 16]} />
          ) : (
            // Closed mouth when not attacking
            <boxGeometry args={[0.4, 0.05, 0.05]} />
          )}
          <meshStandardMaterial color="#940000" />
        </mesh>
        
        {/* Teeth when attacking */}
        {attackPhase === AttackPhase.ATTACK && (
          <>
            <mesh position={[0.1, -0.1, 0.1]} rotation={[0, 0, Math.PI / 12]} castShadow>
              <coneGeometry args={[0.05, 0.1, 8]} />
              <meshStandardMaterial color="#EEEEEE" />
            </mesh>
            
            <mesh position={[-0.1, -0.1, 0.1]} rotation={[0, 0, -Math.PI / 12]} castShadow>
              <coneGeometry args={[0.05, 0.1, 8]} />
              <meshStandardMaterial color="#EEEEEE" />
            </mesh>
          </>
        )}
      </group>
      
      {/* Arms */}
      <mesh 
        position={[0.9, 1.3, 0]} 
        rotation={[0, 0, armAngle.current - 0.5]} 
        castShadow
      >
        <capsuleGeometry args={[0.25, 1.2, 8, 16]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      
      <mesh 
        position={[-0.9, 1.3, 0]} 
        rotation={[0, 0, -armAngle.current + 0.5]} 
        castShadow
      >
        <capsuleGeometry args={[0.25, 1.2, 8, 16]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      
      {/* Hands/claws */}
      <mesh 
        position={[1.3, 1.1, 0.3]} 
        rotation={[0.3, 0, armAngle.current]} 
        castShadow
      >
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#EEEEEE" />
      </mesh>
      
      <mesh 
        position={[-1.3, 1.1, 0.3]} 
        rotation={[0.3, 0, -armAngle.current]} 
        castShadow
      >
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#EEEEEE" />
      </mesh>
      
      {/* Claws */}
      {attackPhase === AttackPhase.ATTACK && (
        <>
          <group position={[1.3, 1.0, 0.4]}>
            {[0, 1, 2].map((i) => (
              <mesh 
                key={`right-claw-${i}`}
                position={[0.1, 0.1 + i * 0.1, 0.2]} 
                rotation={[0.4, 0, 0.2 + i * 0.2]} 
                castShadow
              >
                <coneGeometry args={[0.04, 0.2, 8]} />
                <meshStandardMaterial color="#DDDDDD" />
              </mesh>
            ))}
          </group>
          
          <group position={[-1.3, 1.0, 0.4]}>
            {[0, 1, 2].map((i) => (
              <mesh 
                key={`left-claw-${i}`}
                position={[-0.1, 0.1 + i * 0.1, 0.2]} 
                rotation={[0.4, 0, -0.2 - i * 0.2]} 
                castShadow
              >
                <coneGeometry args={[0.04, 0.2, 8]} />
                <meshStandardMaterial color="#DDDDDD" />
              </mesh>
            ))}
          </group>
        </>
      )}
      
      {/* Legs */}
      <mesh 
        position={[0.4, 0.2, 0]} 
        rotation={[0.2, 0, armAngle.current * 0.7]}
        castShadow
      >
        <capsuleGeometry args={[0.25, 1.2, 8, 16]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      
      <mesh 
        position={[-0.4, 0.2, 0]} 
        rotation={[0.2, 0, -armAngle.current * 0.7]}
        castShadow
      >
        <capsuleGeometry args={[0.25, 1.2, 8, 16]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      
      {/* Feet */}
      <mesh position={[0.4, 0, 0.3]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.2, 0.6, 8, 16]} />
        <meshStandardMaterial color="#EEEEEE" />
      </mesh>
      
      <mesh position={[-0.4, 0, 0.3]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.2, 0.6, 8, 16]} />
        <meshStandardMaterial color="#EEEEEE" />
      </mesh>
    </group>
  );
};

export default Yeti; 