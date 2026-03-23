// timer.worker.ts — 后台精确计时器
// Web Worker 不受浏览器标签页休眠节流影响

let totalSeconds = 0;
let isRunning = false;
let timerId: ReturnType<typeof setInterval> | null = null;

function startTimer() {
  if (timerId !== null) return;
  isRunning = true;
  timerId = setInterval(() => {
    if (isRunning) {
      totalSeconds++;
      self.postMessage({ type: 'tick', totalSeconds });
    }
  }, 1000);
}

function stopTimer() {
  isRunning = false;
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

self.onmessage = (e: MessageEvent) => {
  const { type, value } = e.data;
  switch (type) {
    case 'start':
      startTimer();
      break;
    case 'stop':
      stopTimer();
      break;
    case 'set':
      // 恢复存档时设置初始值
      totalSeconds = typeof value === 'number' ? value : 0;
      self.postMessage({ type: 'tick', totalSeconds });
      break;
    case 'reset':
      totalSeconds = 0;
      stopTimer();
      self.postMessage({ type: 'tick', totalSeconds: 0 });
      break;
  }
};
