import { Upload, FileImage, FileJson } from 'lucide-react';
import { useState, useRef } from 'react';

interface ImageUploaderProps {
  onFileUpload: (file: File) => void;
}

export function ImageUploader({ onFileUpload }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-6 
          cursor-pointer transition-all duration-300
          hover:border-primary/50 hover:bg-primary/5
          ${
            isDragging
              ? 'border-primary bg-primary/10 scale-[1.02]'
              : 'border-border/30'
          }
        `}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className={`
            p-3 rounded-full transition-all duration-300
            ${
              isDragging
                ? 'bg-primary/20 text-primary'
                : 'bg-muted/30 text-muted-foreground'
            }
          `}
          >
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-foreground/80 mb-1">
              ➕ 导入图片/存档
            </p>
            <p className="text-xs text-muted-foreground mb-2">
              支持图片转拼豆或导入 JSON 存档恢复进度
            </p>
            <div className="flex items-center justify-center gap-2">
              <span className="flex items-center gap-1 text-xs text-foreground/40">
                <FileImage className="w-3 h-3" /> 图片
              </span>
              <span className="text-foreground/30">·</span>
              <span className="flex items-center gap-1 text-xs text-foreground/40">
                <FileJson className="w-3 h-3" /> JSON
              </span>
            </div>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.json,application/json"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}
