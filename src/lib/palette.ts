/** 调色板工具 - 预计算 221 色调色板 */
export const MAX_DIMENSION = 78;

// 预计算 221 色调色板
export const palette221: { r: number; g: number; b: number }[] = [];
const levels = [0, 51, 102, 153, 204, 255];

for (const r of levels) {
  for (const g of levels) {
    for (const b of levels) {
      palette221.push({ r, g, b });
    }
  }
}

// 额外灰度
const extraGrays = [25, 76, 127, 178, 229];
for (const v of extraGrays) {
  palette221.push({ r: v, g: v, b: v });
}

/** 找到最接近的颜色 */
export function getClosestColor(r: number, g: number, b: number) {
  let minDistance = Infinity;
  let closest = palette221[0];
  
  for (const c of palette221) {
    const dist = (c.r - r) ** 2 + (c.g - g) ** 2 + (c.b - b) ** 2;
    if (dist < minDistance) {
      minDistance = dist;
      closest = c;
    }
  }
  
  return closest;
}
