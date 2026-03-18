interface BrandStatusProps {
  isConnected: boolean;
  isStarted?: boolean;
  change?: number;
  focusComment?: string;
  currentGoal?: string;
}

export function BrandStatus({ 
  isConnected, 
  isStarted = false,
  change = 0,
  focusComment = '',
  currentGoal = ''
}: BrandStatusProps) {
  // 根据 change 值显示状态
  const getChangeDisplay = () => {
    if (change > 0) return { text: `+${change}`, color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/20' };
    if (change < 0) return { text: `${change}`, color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20' };
    return { text: '0', color: 'text-foreground/50', bgColor: 'bg-foreground/5', borderColor: 'border-foreground/10' };
  };
  
  const changeDisplay = getChangeDisplay();
  
  return (
    <div className="space-y-3">
      <h1 className="text-lg tracking-wide text-foreground/90">
        Focus-beads 拼豆工作台
      </h1>
      
      {/* 引擎连接状态 */}
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          } shadow-lg ${
            isConnected ? 'shadow-green-500/50' : 'shadow-red-500/50'
          }`}
        />
        <span
          className={`text-xs px-2.5 py-1 rounded-md ${
            isConnected
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}
        >
          {isConnected 
            ? (isStarted ? '引擎已连接 · 监控中' : '引擎已连接 · 待机')
            : '未连接引擎'
          }
        </span>
      </div>
      
      {/* Change 状态显示 */}
      {isConnected && isStarted && (
        <div className="space-y-2 pt-1">
          {/* Change 指示器 */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-foreground/60">专注变化</span>
            <span className={`font-mono font-bold ${changeDisplay.color}`}>
              {changeDisplay.text}
            </span>
          </div>
          
          {/* 变化说明 */}
          <div className={`text-xs px-2 py-1 rounded ${changeDisplay.bgColor} ${changeDisplay.borderColor} border`}>
            {change > 0 ? '豆子浮现中 (+3个/10秒)' : 
             change < 0 ? `豆子消失中 (${change * 3}个/10秒)` : 
             '等待评分...'}
          </div>
          
          {/* 当前目标 */}
          {currentGoal && (
            <div className="text-xs text-foreground/50 truncate">
              目标: {currentGoal}
            </div>
          )}
          
          {/* AI 评论 */}
          {focusComment && (
            <div className="text-xs text-foreground/70 italic bg-foreground/5 rounded px-2 py-1.5">
              "{focusComment}"
            </div>
          )}
        </div>
      )}
      
      {/* 未连接提示 */}
      {!isConnected && (
        <div className="text-xs text-foreground/50 bg-foreground/5 rounded px-2 py-1.5">
          请先启动 FocusOS 网关以开始专注监控
        </div>
      )}
    </div>
  );
}
