import { Play, Pause, Flame, Undo2, Power, Eye, EyeOff } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ActionButtonsProps {
  isStarted: boolean;
  isIroned: boolean;
  isPreview: boolean;
  isConnected?: boolean;
  onStartToggle: () => void;
  onIronToggle: () => void;
  onPreviewToggle: () => void;
}

export function ActionButtons({
  isStarted,
  isIroned,
  isPreview,
  isConnected = false,
  onStartToggle,
  onIronToggle,
  onPreviewToggle,
}: ActionButtonsProps) {
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStarted) {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => clearInterval(interval);
  }, [isStarted]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3">
      {/* Preview Button */}
      <button
        onClick={onPreviewToggle}
        className={`
          w-full px-4 py-3 rounded-lg
          flex items-center justify-center gap-2
          transition-all duration-300
          relative overflow-hidden group
          ${
            isPreview
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30'
              : 'bg-gradient-to-r from-sky-500/10 to-cyan-500/10 text-sky-400/70 border border-sky-500/20 hover:from-sky-500/20 hover:to-cyan-500/20'
          }
        `}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        {isPreview ? (
          <>
            <EyeOff className="w-4 h-4" />
            <span>退出预览</span>
          </>
        ) : (
          <>
            <Eye className="w-4 h-4" />
            <span>预览成品</span>
          </>
        )}
      </button>

      {/* Start/Connect Button */}
      <button
        onClick={onStartToggle}
        disabled={!isConnected}
        className={`
          w-full px-4 py-3 rounded-lg
          flex items-center justify-center gap-2
          transition-all duration-300
          relative overflow-hidden group
          disabled:opacity-40 disabled:cursor-not-allowed
          ${
            !isConnected
              ? 'bg-foreground/10 text-foreground/40 border border-foreground/20'
              : isStarted
              ? 'bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30'
              : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:from-blue-500/30 hover:to-cyan-500/30'
          }
        `}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        {!isConnected ? (
          <>
            <Power className="w-4 h-4" />
            <span>引擎未连接</span>
          </>
        ) : isStarted ? (
          <>
            <Pause className="w-4 h-4" />
            <span>{formatDuration(duration)}</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            <span>开始监控</span>
          </>
        )}
      </button>

      {/* Iron Button */}
      <button
        onClick={onIronToggle}
        className={`
          w-full px-4 py-3 rounded-lg
          flex items-center justify-center gap-2
          transition-all duration-300
          relative overflow-hidden group
          ${
            isIroned
              ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
              : 'bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-300 border border-orange-500/30 hover:from-orange-500/30 hover:to-red-500/30 shadow-lg shadow-orange-500/10'
          }
        `}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        {isIroned ? (
          <>
            <Undo2 className="w-4 h-4" />
            <span>⏪ 撤销熨烫</span>
          </>
        ) : (
          <>
            <Flame className="w-4 h-4" />
            <span>🔥 熨烫融合</span>
          </>
        )}
      </button>
    </div>
  );
}
