import { BrandStatus } from './BrandStatus';
import { ImageUploader } from './ImageUploader';
import { ActionButtons } from './ActionButtons';
import { StatusBar } from './StatusBar';
import type { PixelData } from './BeadsBoard';

interface ControlPanelProps {
  isConnected: boolean;
  isStarted: boolean;
  isIroned: boolean;
  isPreview: boolean;
  beadsUsed: number;
  completionPercentage: number;
  change?: number;
  focusComment?: string;
  currentGoal?: string;
  pixels?: PixelData[];
  onFileUpload: (file: File) => void;
  onStartToggle: () => void;
  onIronToggle: () => void;
  onPreviewToggle: () => void;
  onExport: () => void;
  isPreviewMode?: boolean;
  hasEverIroned?: boolean;
  totalElapsedSeconds?: number;
}

export function ControlPanel({
  isConnected,
  isStarted,
  isIroned,
  isPreview,
  beadsUsed,
  completionPercentage,
  change = 0,
  focusComment = '',
  currentGoal = '',
  pixels = [],
  onFileUpload,
  onStartToggle,
  onIronToggle,
  onPreviewToggle,
  onExport,
  isPreviewMode = false,
  hasEverIroned = false,
  totalElapsedSeconds = 0,
}: ControlPanelProps) {
  return (
    <div
      className="
        fixed top-6 left-6 w-80
        bg-background/40 backdrop-blur-xl
        border border-border/20
        rounded-2xl shadow-2xl
        p-6
        space-y-6
      "
      style={{
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }}
    >
      <BrandStatus 
        isConnected={isConnected} 
        isStarted={isStarted}
        change={change}
        focusComment={focusComment}
        currentGoal={currentGoal}
      />
      
      <div className="h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />
      
      <ImageUploader onFileUpload={onFileUpload} />
      
      <div className="h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />
      
      <ActionButtons
        isStarted={isStarted}
        isIroned={isIroned}
        isPreview={isPreview}
        isConnected={isConnected}
        totalElapsedSeconds={totalElapsedSeconds}
        onStartToggle={onStartToggle}
        onIronToggle={onIronToggle}
        onPreviewToggle={onPreviewToggle}
      />
      
      <div className="h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />
      
      <StatusBar
        beadsUsed={beadsUsed}
        completionPercentage={completionPercentage}
        change={change}
        onExport={onExport}
        isIroned={isIroned}
        isPreviewMode={isPreviewMode}
        hasEverIroned={hasEverIroned}
        pixels={pixels}
        totalElapsedSeconds={totalElapsedSeconds}
      />
    </div>
  );
}
