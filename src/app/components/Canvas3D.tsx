import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { BeadsBoard, type PixelData } from './BeadsBoard';

interface Canvas3DProps {
  isIroned: boolean;
  isPreview?: boolean;
  pixels?: PixelData[];
  isStarted?: boolean;
  completionPercentage?: number;
  change?: number;
}

export function Canvas3D({
  isIroned,
  isPreview = false,
  pixels = [],
  isStarted = false,
  completionPercentage = 0,
  change = 0
}: Canvas3DProps) {
  return (
    <Canvas 
      camera={{ position: [0, 0, 90], fov: 60 }} 
      className="fixed top-0 left-0 w-screen h-screen"
      style={{ 
        background: '#1a1a1a',
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 0
      }}
    >
      <OrbitControls enableDamping dampingFactor={0.05} />
      <BeadsBoard
        pixels={pixels}
        isIroned={isIroned}
        isPreview={isPreview}
        isStarted={isStarted}
        completionPercentage={completionPercentage}
        change={change}
      />
    </Canvas>
  );
}