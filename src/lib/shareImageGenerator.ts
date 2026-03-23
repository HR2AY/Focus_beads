import type { PixelData } from '../app/components/BeadsBoard';

export interface ShareImageData {
  durationSeconds: number;
  beadsUsed: number;
  focusContent: string;
  pixels: PixelData[];
}

// ==================== 布局常量（相对于模板尺寸的比例）====================
// 这些值基于 Template.png 的布局，可根据实际模板微调

const LAYOUT = {
  // 左侧卡片动态数据区域
  dataX: 0.161,              // 数据值的 X 起始（占模板宽度比例）
  durationY: 0.228,          // 拼豆时长 Y 位置
  beadCountY: 0.295,         // 总豆子数 Y 位置
  focusContentY: 0.365,      // 专注内容 Y 起始位置
  dataMaxWidth: 0.178,       // 文本最大宽度（用于换行）

  // 右侧卡片区域（用于放置拼豆图）
  rightCardX: 0.398,
  rightCardY: 0.183,
  rightCardW: 0.571,
  rightCardH: 0.667,
  rightCardPadding: 0.012,   // 内边距

  // 字体大小（占模板高度比例）
  largeFontSize: 0.042,
  contentFontSize: 0.024,
  contentLineHeight: 1.65,
};

const ORANGE = '#E07B3A';
const FONT_FAMILY = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", "Source Han Sans SC", sans-serif';

// ==================== 工具函数 ====================

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/**
 * 将文本按像素宽度自动换行
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  const paragraphs = text.split('\n');

  for (const para of paragraphs) {
    if (para.trim() === '') {
      lines.push('');
      continue;
    }
    let currentLine = '';
    for (const char of para) {
      const testLine = currentLine + char;
      if (ctx.measureText(testLine).width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
  }
  return lines;
}

/**
 * 将拼豆数据渲染为平面 2D 像素图（熨烫后的平面视图）
 * 每颗豆子 = 1 像素，后续绘制时通过 imageSmoothingEnabled=false 放大
 */
function renderBeadFlat(pixels: PixelData[]): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  if (pixels.length === 0) {
    canvas.width = 1;
    canvas.height = 1;
    return canvas;
  }

  // 计算边界
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  for (const p of pixels) {
    const ix = Math.floor(p.x);
    const iy = Math.floor(-p.y); // 翻转 Y 轴（3D → 2D）
    if (ix < minX) minX = ix;
    if (ix > maxX) maxX = ix;
    if (iy < minY) minY = iy;
    if (iy > maxY) maxY = iy;
  }

  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // 透明背景，让非正方形区域不遮挡白色卡片
  ctx.clearRect(0, 0, w, h);

  // 逐像素绘制每颗豆子
  for (const p of pixels) {
    const ix = Math.floor(p.x) - minX;
    const iy = Math.floor(-p.y) - minY;
    ctx.fillStyle = `#${p.color.getHexString()}`;
    ctx.fillRect(ix, iy, 1, 1);
  }

  return canvas;
}

// ==================== 主合成函数 ====================

/**
 * 生成分享成果图
 * 1. 加载 Template.png 底图
 * 2. 在左侧卡片绘制动态文字（时长、豆子数、专注内容）
 * 3. 在右侧卡片绘制烫平后的拼豆图
 * 4. 输出高清 PNG Blob
 */
export async function generateShareImage(data: ShareImageData): Promise<Blob> {
  const SCALE = 2; // Retina 2x

  // 1. 加载底图模板
  const template = await loadImage(`${import.meta.env.BASE_URL}Template.png`);
  const tw = template.naturalWidth;
  const th = template.naturalHeight;

  // 2. 创建高清画布（2 倍物理像素）
  const canvas = document.createElement('canvas');
  canvas.width = tw * SCALE;
  canvas.height = th * SCALE;
  const ctx = canvas.getContext('2d')!;

  // 所有绘制指令自动 2x 放大
  ctx.scale(SCALE, SCALE);

  // 3. 绘制底图
  ctx.drawImage(template, 0, 0, tw, th);

  // 4. 计算实际像素坐标
  const dataX = Math.round(tw * LAYOUT.dataX);
  const maxWidth = Math.round(tw * LAYOUT.dataMaxWidth);
  const largeFontPx = Math.round(th * LAYOUT.largeFontSize);
  const contentFontPx = Math.round(th * LAYOUT.contentFontSize);

  // 5. 绘制拼豆时长
  ctx.fillStyle = ORANGE;
  ctx.textBaseline = 'top';
  ctx.font = `bold ${largeFontPx}px ${FONT_FAMILY}`;
  ctx.letterSpacing = '1px';
  const durationText = formatDuration(data.durationSeconds);
  ctx.fillText(durationText, dataX, Math.round(th * LAYOUT.durationY));

  // 6. 绘制总豆子数
  const beadsText = data.beadsUsed.toLocaleString();
  ctx.fillText(beadsText, dataX, Math.round(th * LAYOUT.beadCountY));
  ctx.letterSpacing = '0px';

  // 7. 绘制专注内容（自动换行）
  if (data.focusContent.trim()) {
    ctx.font = `${contentFontPx}px ${FONT_FAMILY}`;
    const lines = wrapText(ctx, data.focusContent, maxWidth);
    const lineH = contentFontPx * LAYOUT.contentLineHeight;
    const startY = Math.round(th * LAYOUT.focusContentY);

    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], dataX, startY + i * lineH);
    }
  }

  // 8. 绘制右侧拼豆平面图
  const beadCanvas = renderBeadFlat(data.pixels);

  // 右侧卡片可用区域
  const pad = Math.round(tw * LAYOUT.rightCardPadding);
  const rcX = Math.round(tw * LAYOUT.rightCardX) + pad;
  const rcY = Math.round(th * LAYOUT.rightCardY) + pad;
  const rcW = Math.round(tw * LAYOUT.rightCardW) - pad * 2;
  const rcH = Math.round(th * LAYOUT.rightCardH) - pad * 2;

  if (beadCanvas.width > 1) {
    // 保持像素比例，缩放到刚好放入正方形区域
    const beadAspect = beadCanvas.width / beadCanvas.height;
    const cardAspect = rcW / rcH;

    let drawW: number, drawH: number, drawX: number, drawY: number;
    if (beadAspect > cardAspect) {
      drawW = rcW;
      drawH = rcW / beadAspect;
      drawX = rcX;
      drawY = rcY + (rcH - drawH) / 2;
    } else {
      drawH = rcH;
      drawW = rcH * beadAspect;
      drawX = rcX + (rcW - drawW) / 2;
      drawY = rcY;
    }

    // 关闭抗锯齿 → 像素风锐利边缘
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(beadCanvas, drawX, drawY, drawW, drawH);
    ctx.imageSmoothingEnabled = true;
  }

  // 9. 导出为 PNG Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      },
      'image/png',
    );
  });
}
