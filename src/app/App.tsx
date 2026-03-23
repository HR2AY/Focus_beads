import { useState, useCallback, useEffect, useRef } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { Canvas3D } from './components/Canvas3D';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import * as THREE from 'three';
import { getClosestColor, MAX_DIMENSION } from '../lib/palette';
import type { PixelData } from './components/BeadsBoard';
import TimerWorker from '../workers/timer.worker?worker';

const FOCUS_API_BASE = 'http://127.0.0.1:8765/api';
const POLL_INTERVAL = 2000;

export interface SaveData {
  version: string;
  completionPercentage: number;
  time: number; // 累计用时（秒）
  pixels: { x: number; y: number; hex: string; }[];
}

interface FocusStatus {
  score: number;
  change: number;
  comment: string;
  running: boolean;
  current_goal: string;
}

export default function App() {
  const [focusEngineConnected, setFocusEngineConnected] = useState(false);
  const [focusEngineRunning, setFocusEngineRunning] = useState(false);
  const [focusComment, setFocusComment] = useState('');
  const [currentGoal, setCurrentGoal] = useState('');
  
  const [isIroned, setIsIroned] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [hasEverIroned, setHasEverIroned] = useState(false);
  const [beadsUsed, setBeadsUsed] = useState(0);
  const [change, setChange] = useState(0);
  const [pixels, setPixels] = useState<PixelData[]>([]);

  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState(0);

  const currentChangeRef = useRef<number>(0);
  const prevRunningRef = useRef<boolean>(false);

  // ==================== Web Worker 计时器 ====================
  const timerWorkerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const worker = new TimerWorker();
    timerWorkerRef.current = worker;

    worker.onmessage = (e: MessageEvent) => {
      if (e.data.type === 'tick') {
        setTotalElapsedSeconds(e.data.totalSeconds);
      }
    };

    return () => {
      worker.terminate();
      timerWorkerRef.current = null;
    };
  }, []);

  // 引擎运行状态变化时，启停 Worker 计时器
  useEffect(() => {
    if (!timerWorkerRef.current) return;
    if (focusEngineRunning) {
      timerWorkerRef.current.postMessage({ type: 'start' });
    } else {
      timerWorkerRef.current.postMessage({ type: 'stop' });
    }
  }, [focusEngineRunning]);

  // ==================== Page Visibility API ====================
  // 页面从后台恢复时，立即触发一次轮询以同步最新状态
  const pollNowRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && pollNowRef.current) {
        pollNowRef.current();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // ==================== 引擎轮询 ====================
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const pollFocusStatus = async () => {
      try {
        const response = await fetch(`${FOCUS_API_BASE}/focus/score`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) throw new Error('API request failed');

        const data: FocusStatus = await response.json();
        setFocusEngineConnected(true);
        setFocusEngineRunning(data.running);
        setFocusComment(data.comment);
        setCurrentGoal(data.current_goal);

        // 检测引擎从停止变为运行：重置 changeRef 以确保能接收新的 change
        if (data.running && !prevRunningRef.current) {
          currentChangeRef.current = 0;
        }
        prevRunningRef.current = data.running;

        if (data.change !== 0 && data.change !== currentChangeRef.current) {
          console.log(`Focus change detected: ${data.change}`);
          setChange(data.change);
          currentChangeRef.current = data.change;

          // 根据 change 自动推进专注百分比（此处假设 change > 0 时代表专注有效）
          if (data.change > 0 && beadsUsed > 0) {
            setCompletionPercentage(prev => {
              // 假设每个 change 单位消耗 3 颗豆子
              const addedPercent = (data.change * 3 / beadsUsed) * 100;
              return Math.min(100, prev + addedPercent);
            });
          }
        }

      } catch (error) {
        setFocusEngineConnected(false);
        setFocusEngineRunning(false);
        setFocusComment('');
      }
    };

    // 保存引用以供 Visibility API 使用
    pollNowRef.current = pollFocusStatus;

    pollFocusStatus();
    intervalId = setInterval(pollFocusStatus, POLL_INTERVAL);
    return () => {
      clearInterval(intervalId);
      pollNowRef.current = null;
    };
  }, [beadsUsed]); // 依赖 beadsUsed 用于计算进度

  const handleFileUpload = useCallback((file: File) => {
    if (file.type === 'application/json' || file.name.endsWith('.json')) {
      handleImportJSON(file);
    } else if (file.type.startsWith('image/')) {
      handleImageUpload(file);
    } else {
      toast.error('不支持的文件类型', { description: '请上传图片或 .json 存档文件' });
    }
  }, []);

  const handleImageUpload = (file: File) => {
    toast.success('图片已上传', { description: `${file.name} - 正在处理中...` });
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const newPixels = processImage(img);
        // 导入图片：进度归零，进入默认拼豆状态
        setIsIroned(false);
        setIsPreview(false);
        setPixels(newPixels);
        setBeadsUsed(newPixels.length);
        setCompletionPercentage(0);
        setTotalElapsedSeconds(0);
        timerWorkerRef.current?.postMessage({ type: 'reset' });

        toast.success('图片处理完成', { description: `已转换为 ${newPixels.length} 颗拼豆，开始专注后豆子会逐步出现` });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleImportJSON = (file: File) => {
    toast.info('正在导入存档...', { description: file.name });
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonText = event.target?.result as string;
        const data: SaveData = JSON.parse(jsonText);
        
        if (!data.version || !Array.isArray(data.pixels) || typeof data.completionPercentage !== 'number') {
          throw new Error('存档格式错误');
        }
        
        const restoredPixels: PixelData[] = data.pixels.map(p => ({
          x: p.x, y: p.y, color: new THREE.Color(`#${p.hex}`),
        }));
        
        // 导入存档：读取内部储存的进度，进入默认拼豆状态
        setIsIroned(false);
        setIsPreview(false);
        setPixels(restoredPixels);
        setBeadsUsed(restoredPixels.length);
        setCompletionPercentage(Math.max(0, Math.min(100, data.completionPercentage)));
        const restoredSeconds = typeof data.time === 'number' ? Math.max(0, Math.floor(data.time)) : 0;
        setTotalElapsedSeconds(restoredSeconds);
        timerWorkerRef.current?.postMessage({ type: 'set', value: restoredSeconds });

        const restoredTime = typeof data.time === 'number' ? data.time : 0;
        const hrs = Math.floor(restoredTime / 3600);
        const mins = Math.floor((restoredTime % 3600) / 60);
        const secs = restoredTime % 60;
        const timeStr = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        toast.success('存档导入成功', {
          description: `已恢复 ${restoredPixels.length} 颗拼豆，专注进度 ${data.completionPercentage}%，累计用时 ${timeStr}`,
        });
      } catch (error) {
        toast.error('存档导入失败', { description: error instanceof Error ? error.message : '文件损坏' });
      }
    };
    reader.readAsText(file);
  };

  const processImage = (img: HTMLImageElement): PixelData[] => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    let { width, height } = img;
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }
    canvas.width = width; canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height).data;
    const newPixels: PixelData[] = [];
    
    // 修正：确保坐标对齐到豆板网格（整数+0.5）
    // 豆板圆柱在位置 (i - 39 + 0.5)，即整数坐标+0.5
    // 所以图片像素也应该映射到同样的坐标系统
    const offsetX = Math.floor(width / 2);
    const offsetY = Math.floor(height / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const a = imageData[i + 3];
        if (a <= 128) continue;

        const quantized = getClosestColor(imageData[i], imageData[i + 1], imageData[i + 2]);
        
        // 使用 Math.floor 确保坐标是整数+0.5的形式，与豆板圆柱对齐
        newPixels.push({
          x: (x - offsetX) + 0.5,
          y: -((y - offsetY) + 0.5),
          color: new THREE.Color(quantized.r / 255, quantized.g / 255, quantized.b / 255),
        });
      }
    }
    return newPixels;
  };

  const handleStartToggle = async () => {
    if (!focusEngineConnected) {
      toast.error('FocusAI 引擎未连接', { description: '请先启动 FocusOS 网关' });
      return;
    }
    
    try {
      if (focusEngineRunning) {
        await fetch(`${FOCUS_API_BASE}/stop`, { method: 'POST' });
        toast.info('暂停监控', { description: '休息一下 ☕' });
      } else {
        await fetch(`${FOCUS_API_BASE}/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goal: currentGoal || '专注工作' }),
        });
        toast.info('开始监控', { description: '专注时间已启动 🎯 豆子将随时间被消耗' });
      }
    } catch (error) {
      toast.error('操作失败', { description: '无法与 FocusAI 引擎通信' });
    }
  };

  const handleIronToggle = () => {
    if (isIroned) {
      // 取消熨烫 → 返回默认拼豆状态
      setIsIroned(false);
      toast.info('撤销熨烫', { description: '已恢复到拼豆中状态' });
    } else {
      // 开始熨烫：先取消预览（互斥）
      if (isPreview) setIsPreview(false);
      setIsIroned(true);
      setHasEverIroned(true);
      toast.success('熨烫中', { description: '当前已拼好的豆子正在烫平 🔥' });
    }
  };

  const handlePreviewToggle = () => {
    if (isPreview) {
      // 取消预览 → 返回默认拼豆状态
      setIsPreview(false);
    } else {
      // 开始预览：先取消熨烫（互斥）
      if (isIroned) setIsIroned(false);
      setIsPreview(true);
    }
  };

  const handleExport = () => {
    if (pixels.length === 0) {
      toast.error('没有可导出的内容', { description: '请先上传图片或导入存档' });
      return;
    }
    try {
      const saveData: SaveData = {
        version: '1.0.0',
        completionPercentage: completionPercentage,
        time: totalElapsedSeconds,
        pixels: pixels.map(p => ({ x: p.x, y: p.y, hex: p.color.getHexString() })),
      };
      const jsonString = JSON.stringify(saveData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `focusbeads-project-${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('导出成功', { description: `存档已保存` });
    } catch (error) {
      toast.error('导出失败', { description: '生成存档文件时出错' });
    }
  };

  return (
    <div className="dark size-full relative overflow-hidden">
      <Canvas3D
        isIroned={isIroned}
        isPreview={isPreview}
        pixels={pixels}
        isStarted={focusEngineRunning}
        completionPercentage={completionPercentage}
        change={change}
      />

      <ControlPanel
        isConnected={focusEngineConnected}
        isStarted={focusEngineRunning}
        isIroned={isIroned}
        isPreview={isPreview}
        beadsUsed={beadsUsed}
        completionPercentage={completionPercentage}
        change={change}
        focusComment={focusComment}
        isPreviewMode={isPreview}
        hasEverIroned={hasEverIroned}
        totalElapsedSeconds={totalElapsedSeconds}
        pixels={pixels}
        currentGoal={currentGoal}
        onFileUpload={handleFileUpload}
        onStartToggle={handleStartToggle}
        onIronToggle={handleIronToggle}
        onPreviewToggle={handlePreviewToggle}
        onExport={handleExport}
      />

      <div
        className="fixed top-0 left-0 w-[600px] h-[600px] rounded-full blur-[120px] opacity-20 pointer-events-none"
        style={{
          background: isIroned
            ? 'radial-gradient(circle, rgba(34, 197, 94, 0.3) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(6, 182, 212, 0.3) 0%, transparent 70%)',
        }}
      />
      <Toaster />
    </div>
  );
}