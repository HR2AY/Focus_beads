import { useState } from 'react';
import { Download, Share2, Sparkles } from 'lucide-react';
import { ShareModal } from './ShareModal';
import type { PixelData } from './BeadsBoard';

interface StatusBarProps {
  beadsUsed: number;
  completionPercentage: number;
  change?: number;
  onExport: () => void;
  isIroned?: boolean;
  isPreviewMode?: boolean;
  hasEverIroned?: boolean;
  pixels?: PixelData[];
  totalElapsedSeconds?: number;
}

export function StatusBar({
  beadsUsed,
  completionPercentage,
  change = 0,
  onExport,
  isIroned = false,
  isPreviewMode = false,
  hasEverIroned = false,
  pixels = [],
  totalElapsedSeconds = 0,
}: StatusBarProps) {
  const [shareModalOpen, setShareModalOpen] = useState(false);
  // 根据 change 计算动画中的豆子数量
  const beadsInAnimation = Math.abs(change) * 3;
  
  // 计算当前状态
  const hasImage = beadsUsed > 0;
  const getStatusText = () => {
    if (!hasImage) return { text: '未加载', color: 'text-gray-400', bg: 'bg-gray-400/10' };
    if (isIroned) return { text: '已烫平', color: 'text-orange-400', bg: 'bg-orange-400/10' };
    if (isPreviewMode) return { text: '预览中', color: 'text-purple-400', bg: 'bg-purple-400/10' };
    return { text: '拼豆中', color: 'text-cyan-400', bg: 'bg-cyan-400/10' };
  };
  const status = getStatusText();
  
  return (
    <div className="space-y-3">
      {/* Stats Display */}
      <div className="p-4 rounded-lg bg-muted/5 border border-border/20">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-muted-foreground">拼豆统计</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-foreground/60">总豆子数</span>
            <span className="text-sm text-foreground/90 font-mono">
              {beadsUsed.toLocaleString()} 颗
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-foreground/60">专注进度</span>
            <span className="text-sm text-cyan-400 font-mono">
              {completionPercentage}%
            </span>
          </div>
          
          {/* 当前状态 */}
          <div className="flex justify-between items-center pt-1 border-t border-border/10">
            <span className="text-xs text-foreground/60">当前状态</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color} ${status.bg}`}>
              {status.text}
            </span>
          </div>
          
          {change !== 0 && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-foreground/60">
                {change > 0 ? '浮现中' : '消失中'}
              </span>
              <span className={`text-sm font-mono ${change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {beadsInAnimation} 颗
              </span>
            </div>
          )}
        </div>
        {/* Progress Bar */}
        <div className="mt-3 h-1.5 bg-muted/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 rounded-full"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onExport}
          className="
            flex-1 px-3 py-2.5 rounded-lg
            flex items-center justify-center gap-1.5
            bg-muted/10 text-foreground/80 border border-border/30
            hover:bg-muted/20 hover:border-border/50
            transition-all duration-300
            group
          "
        >
          <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
          <span className="text-sm">导出图纸</span>
        </button>
        <button
          onClick={() => setShareModalOpen(true)}
          disabled={!hasEverIroned}
          className="
            flex-1 px-3 py-2.5 rounded-lg
            flex items-center justify-center gap-1.5
            bg-muted/10 text-foreground/80 border border-border/30
            hover:bg-muted/20 hover:border-border/50
            transition-all duration-300
            group
            disabled:opacity-40 disabled:cursor-not-allowed
            disabled:hover:bg-muted/10 disabled:hover:border-border/30
          "
        >
          <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="text-sm">分享成果</span>
        </button>
      </div>

      <ShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        pixels={pixels}
        totalElapsedSeconds={totalElapsedSeconds}
        beadsUsed={beadsUsed}
      />
    </div>
  );
}
