import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { toast } from 'sonner';

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PROMPT_TEXT = `请阅读我上传的 CSV 日程文件，提取每个任务/活动，将其转换为简洁的中文短句描述。格式要求：
- 每行一个任务，去除时间、地点等冗余信息
- 只保留核心动作+对象，如"学习python知识"
- 不加标点符号，不用序号，不换行分段
- 多个任务用空格分隔
- 示例：学习python知识 了解前端架构 练习wind操作 学习雅思听力

请直接输出转换后的文案，不要有其他解释。

【数据】
<把CSV内容粘贴在这里>`;

export function ShareModal({ open, onOpenChange }: ShareModalProps) {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(PROMPT_TEXT);
      setCopied(true);
      toast.success('提示词已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('复制失败，请手动复制');
    }
  };

  const handleConfirm = () => {
    // 后续实现
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background/95 backdrop-blur-xl border-border/30 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">生成分享文案</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="
              w-full min-h-[120px] max-h-[300px] resize-y
              rounded-lg border border-border/30
              bg-muted/10 text-foreground text-sm
              p-3 outline-none
              focus:border-border/50 focus:ring-1 focus:ring-border/30
              transition-colors duration-200
            "
          />

          <div className="p-3 rounded-lg bg-muted/5 border border-border/15 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-xs text-muted-foreground leading-relaxed flex-1">
                生成文案方法：在 FocusAI 中点击【统计报告】，下载 CSV 文件后发给 AI 助手，使用以下提示词生成文案并粘贴到上方：
              </span>
              <button
                onClick={handleCopyPrompt}
                className="
                  shrink-0 p-1.5 rounded-md
                  text-muted-foreground hover:text-foreground
                  hover:bg-muted/20
                  transition-colors duration-200
                "
                title="复制提示词到剪贴板"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="
              px-4 py-2 rounded-lg text-sm
              bg-muted/10 text-foreground/70 border border-border/30
              hover:bg-muted/20 hover:text-foreground
              transition-all duration-200
            "
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="
              px-4 py-2 rounded-lg text-sm
              bg-gradient-to-r from-blue-500/20 to-cyan-500/20
              text-cyan-300 border border-cyan-500/30
              hover:from-blue-500/30 hover:to-cyan-500/30
              transition-all duration-200
            "
          >
            确认
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
