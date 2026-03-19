import { BrandStatus } from './BrandStatus';
import { ImageUploader } from './ImageUploader';
import { ActionButtons } from './ActionButtons';
import { StatusBar } from './StatusBar';

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
  onFileUpload: (file: File) => void;
  onStartToggle: () => void;
  onIronToggle: () => void;
  onPreviewToggle: () => void;
  onExport: () => void;
  isPreviewMode?: boolean;
  hasEverIroned?: boolean;
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
  onFileUpload,
  onStartToggle,
  onIronToggle,
  onPreviewToggle,
  onExport,
  isPreviewMode = false,
  hasEverIroned = false,
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
      />
    </div>
  );
}
