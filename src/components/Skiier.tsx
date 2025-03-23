import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group, Object3D } from 'three';

interface SkiierProps {
  position: [number, number, number];
  crashed?: boolean;
}

// Helper function for smooth movement
const lerp = (start: number, end: number, t: number): number => {
  return start * (1 - t) + end * t;
};

// Same hill angle as in Slope (in degrees, converted to radians)
const HILL_ANGLE = 10;
const HILL_ANGLE_RAD = (HILL_ANGLE * Math.PI) / 180;

const Skiier: React.FC<SkiierProps> = ({ position, crashed = false }) => {
  const skiierRef = useRef<Object3D>(null);
  const targetPositionX = useRef(position[0]);
  
  // Update target position when position prop changes
  useEffect(() => {
    targetPositionX.current = position[0];
  }, [position]);
  
  // Smooth skiier movement with lerp
  useFrame((state, delta) => {
    if (skiierRef.current) {
      // Smoothly interpolate the skiier's x position
      skiierRef.current.position.x = lerp(
        skiierRef.current.position.x, 
        targetPositionX.current, 
        0.1
      );
      
      // Calculate direction of movement for tilt effect
      const movementDirection = targetPositionX.current - skiierRef.current.position.x;
      
      if (crashed) {
        // When crashed, rotate skiier to be face down
        skiierRef.current.rotation.x = lerp(
          skiierRef.current.rotation.x,
          -Math.PI / 2, // Rotate forward (face down in snow)
          0.1
        );
      } else {
        // Normal skiing rotation - just handle the z tilt for turning
        skiierRef.current.rotation.x = HILL_ANGLE_RAD;
        skiierRef.current.rotation.z = lerp(
          skiierRef.current.rotation.z,
          -movementDirection * 0.5, // Tilt more when turning
          0.1
        );
      }
    }
  });
  
  return (
    <group ref={skiierRef} position={[position[0], crashed ? -0.3 : 0.1, 0]} rotation={[HILL_ANGLE_RAD, 0, 0]}>
      {/* Skiier body */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <capsuleGeometry args={[0.2, 0.8, 8, 16]} />
        <meshStandardMaterial color="#3333CC" />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#FFD6CC" />
      </mesh>
      
      {/* Winter hat */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 0.2, 16]} />
        <meshStandardMaterial color="#FF0000" />
      </mesh>
      
      {/* Arms */}
      <mesh position={[0.3, 0.7, 0]} rotation={[0, 0, crashed ? 0.8 : -0.5]} castShadow>
        <capsuleGeometry args={[0.06, 0.4, 8, 16]} />
        <meshStandardMaterial color="#3333CC" />
      </mesh>
      
      <mesh position={[-0.3, 0.7, 0]} rotation={[0, 0, crashed ? -0.8 : 0.5]} castShadow>
        <capsuleGeometry args={[0.06, 0.4, 8, 16]} />
        <meshStandardMaterial color="#3333CC" />
      </mesh>
      
      {/* Ski poles */}
      {!crashed && (
        <>
          <mesh position={[0.4, 0.4, 0]} rotation={[-0.2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 1.5, 8]} />
            <meshStandardMaterial color="#999999" />
          </mesh>
          
          <mesh position={[-0.4, 0.4, 0]} rotation={[-0.2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 1.5, 8]} />
            <meshStandardMaterial color="#999999" />
          </mesh>
        </>
      )}
      
      {/* Legs */}
      <mesh position={[0.1, 0.2, 0]} rotation={[0, 0, crashed ? 0.4 : 0]} castShadow>
        <capsuleGeometry args={[0.08, 0.5, 8, 16]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
      
      <mesh position={[-0.1, 0.2, 0]} rotation={[0, 0, crashed ? -0.4 : 0]} castShadow>
        <capsuleGeometry args={[0.08, 0.5, 8, 16]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
      
      {/* Skis */}
      <mesh position={[0.1, -0.05, 0.3]} rotation={[0, crashed ? 0.5 : 0, crashed ? 0.3 : 0]} castShadow>
        <boxGeometry args={[0.1, 0.05, 1.5]} />
        <meshStandardMaterial color="#CC0000" />
      </mesh>
      
      <mesh position={[-0.1, -0.05, 0.3]} rotation={[0, crashed ? -0.5 : 0, crashed ? -0.3 : 0]} castShadow>
        <boxGeometry args={[0.1, 0.05, 1.5]} />
        <meshStandardMaterial color="#CC0000" />
      </mesh>
      
      {/* Snow spray when crashed */}
      {crashed && (
        <mesh position={[0, 0, 0.5]} castShadow>
          <sphereGeometry args={[0.6, 16, 16, 0, Math.PI * 2, 0, 0.5]} />
          <meshStandardMaterial color="#FFFFFF" transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  );
};

export default Skiier; 