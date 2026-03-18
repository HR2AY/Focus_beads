# FocusAI 拼豆工作台

一个基于 WebGL 的 3D 拼豆（Perler Beads）设计和预览工具，集成专注模式与 gamification 机制。上传图片即可生成 78×78 像素限制的拼豆图纸，支持实时预览、熨烫效果模拟、专注进度追踪和 JSON 图纸导入导出。

![技术栈](https://img.shields.io/badge/React-18.3.1-blue)
![技术栈](https://img.shields.io/badge/Three.js-WebGL-orange)
![技术栈](https://img.shields.io/badge/Tailwind-CSS-06B6D4)
![技术栈](https://img.shields.io/badge/FocusAI-API-green)

---

## ✨ 功能特性

### 🎨 核心功能
- **图片转拼豆**：上传任意图片，自动转换为 78×78 像素限制的拼豆图纸
- **221 色颜色映射**：自动匹配最接近的标准拼豆颜色（216 色立方体 + 5 色灰度）
- **78×78 灰色塑料豆板**：始终显示的物理豆板，圆柱插销设计，豆子可嵌入

### 🔥 熨烫效果
- **分阶段动画**：豆板先透明消失（0.4秒），然后豆子变形烫平
- **两种几何形态**：空心珠（拼豆中）→ 圆角立方体（熨烫后）
- **材质变化**：熨烫后粗糙度降低、清漆层增加，呈现融合光泽

### 🎯 专注模式
- **FocusAI 引擎集成**：连接 FocusAI API 获取专注分数和变化
- **豆子下沉机制**：专注时豆子随进度从平面逐渐下沉消失
- **实时状态追踪**：显示专注进度、当前状态、引擎连接状态

### 📂 图纸管理
- **JSON 导入导出**：保存和恢复拼豆项目（包含进度和像素数据）
- **存档格式**：`{ version, completionPercentage, pixels[] }`

### 🖱️ 交互体验
- **3D 预览**：鼠标旋转、缩放查看拼豆模型
- **预览模式**：上传后先半透明预览，确认后再开始专注
- **响应式 UI**：基于 Tailwind CSS 的现代化毛玻璃界面

---

## 🏗️ 项目架构

```
focus_baeds/
├── src/
│   ├── app/                    # 主应用目录
│   │   ├── App.tsx             # 应用入口组件（状态管理、API 轮询）
│   │   ├── components/         # React 组件
│   │   │   ├── BeadsBoard.tsx      # 3D 拼豆渲染核心（useReducer 状态机）
│   │   │   ├── Canvas3D.tsx        # 3D Canvas 容器
│   │   │   ├── ControlPanel.tsx    # 控制面板（集成所有子组件）
│   │   │   ├── ImageUploader.tsx   # 图片/JSON 上传组件
│   │   │   ├── ActionButtons.tsx   # 专注/熨烫操作按钮
│   │   │   ├── BrandStatus.tsx     # 品牌状态与专注评语
│   │   │   ├── StatusBar.tsx       # 统计面板（豆子数、进度、状态）
│   │   │   └── ui/                 # Radix UI + shadcn 组件库
│   │   └── ...
│   ├── lib/                    # 工具库
│   │   ├── palette.ts          # 221 色调色板 + 颜色匹配算法
│   │   └── geometry.ts         # 3D 几何体定义（空心珠、熨烫体、豆板圆柱）
│   ├── styles/                 # 样式文件
│   └── main.tsx                # 应用入口
├── index.html                  # HTML 模板
├── vite.config.ts              # Vite 配置
├── package.json                # 依赖配置
└── README.md                   # 本文档
```

---

## 🔄 状态机设计

BeadsBoard 使用 useReducer 实现完整的状态管理：

```
IDLE → UPLOAD_IMAGE → PREVIEW → START_BUILDING → BUILDING → IRONING → COMPLETED
                          ↓            ↑              ↓
                    CANCEL_PREVIEW  JSON导入      CANCEL_IRONING
```

### 状态说明

| 状态 | 说明 |
|------|------|
| `IDLE` | 初始状态，未加载图片 |
| `PREVIEW` | 图片上传后预览，豆子半透明 |
| `BUILDING` | 专注进行中，豆子随进度下沉 |
| `IRONING` | 熨烫动画中，豆板消失→豆子变形 |
| `COMPLETED` | 专注完成，所有豆子下沉 |

---

## 🔌 核心接口

### PixelData

3D 拼豆像素数据结构：

```typescript
interface PixelData {
  x: number;           // X 坐标（中心对齐）
  y: number;           // Y 坐标（中心对齐，Y轴向下为负）
  color: THREE.Color;  // Three.js 颜色对象
}
```

### SaveData

存档数据格式：

```typescript
interface SaveData {
  version: string;                    // 版本号
  completionPercentage: number;       // 完成进度 0-100
  pixels: {
    x: number;
    y: number;
    hex: string;  // 颜色十六进制
  }[];
}
```

### FocusStatus

FocusAI API 响应格式：

```typescript
interface FocusStatus {
  score: number;       // 专注分数
  change: number;      // 分数变化: +1, -1, -2
  comment: string;     // AI 评语
  running: boolean;    // 是否运行中
  current_goal: string;// 当前目标
}
```

---

## 📦 模块功能介绍

### 1. App.tsx
**功能**：应用主组件，全局状态管理与 API 集成

- 管理全局状态（引擎连接、专注模式、熨烫状态、预览模式）
- FocusAI API 轮询（每 2 秒获取专注状态）
- 图片上传处理和 JSON 存档导入导出
- 根据 `change` 值自动推进完成百分比

### 2. BeadsBoard.tsx
**功能**：3D 拼豆渲染核心，useReducer 状态机实现

- **状态机**：`IDLE | PREVIEW | BUILDING | IRONING | COMPLETED`
- **InstancedMesh 渲染**：高性能渲染 6000+ 颗拼豆
- **动画系统**：
  - 下沉动画：豆子从 Z=0 沉到 Z=-10
  - 熨烫动画：分阶段（豆板消失 → 豆子变形）
  - 平滑插值：useFrame 实现 60fps 动画
- **几何体切换**：空心珠 ↔ 圆角立方体（熨烫时）

### 3. PegBoard（内嵌组件）
**功能**：78×78 灰色塑料豆板

- **底部平板**：半透明灰色塑料材质
- **圆柱插销阵列**：6084 个圆柱（78×78），与豆子内径契合
- **熨烫响应**：透明度变化（0.8 → 0）

### 4. Canvas3D.tsx
**功能**：3D 场景容器

- React Three Fiber Canvas 封装
- 相机配置：FOV 60，位置 [0, 0, 90]
- OrbitControls：鼠标旋转、缩放、平移

### 5. palette.ts
**功能**：颜色处理工具

```typescript
// 221 色标准调色板
const palette221: { r: number; g: number; b: number }[] = [];
const levels = [0, 51, 102, 153, 204, 255];  // 6 级 RGB
// + 5 色灰度

// 欧几里得距离计算最接近颜色
export function getClosestColor(r: number, g: number, b: number)
```

### 6. geometry.ts
**功能**：3D 几何体预生成

```typescript
hollowBeadGeom:  // 空心圆柱体，外径 0.45，内径 0.27（套在豆板圆柱上）
pegCylinderGeom: // 豆板圆柱，半径 0.27，高度 0.6
getIronedGeom(): // 工厂函数，返回新的圆角立方体（1.0 × 1.0 × 0.6）
```

### 7. ControlPanel.tsx
**功能**：控制面板 UI

- 图片/JSON 上传区域（拖拽支持）
- 品牌状态显示（FocusAI 连接状态 + AI 评语）
- 操作按钮组（专注开关、熨烫开关）
- 状态栏（豆子数、进度、当前状态标签）

### 8. StatusBar.tsx
**功能**：统计面板

- 总豆子数
- 专注进度百分比 + 进度条
- **当前状态标签**：未加载/预览中/拼豆中/已烫平

---

## 📚 依赖库

### 核心框架
| 包名 | 版本 | 用途 |
|------|------|------|
| react | 18.3.1 | React 核心库 |
| react-dom | 18.3.1 | React DOM 渲染 |

### 3D 渲染
| 包名 | 版本 | 用途 |
|------|------|------|
| three | ^0.183.2 | Three.js 3D 引擎 |
| @react-three/fiber | ^8.18.0 | React 的 Three.js 封装 |
| @react-three/drei | ^9.122.0 | Three.js 辅助组件 |
| three-stdlib | ^2.36.1 | 标准扩展库（RoundedBoxGeometry） |

### UI 组件
| 包名 | 版本 | 用途 |
|------|------|------|
| @radix-ui/* | 最新 | Radix UI 无头组件 |
| lucide-react | 0.487.0 | Lucide 图标 |
| sonner | 2.0.3 | Toast 通知 |

### 样式工具
| 包名 | 版本 | 用途 |
|------|------|------|
| tailwindcss | 4.1.12 | Tailwind CSS |
| tailwind-merge | 3.2.0 | 类名合并 |
| clsx | 2.1.1 | 条件类名 |

---

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

访问 http://localhost:5173

### 生产构建

```bash
pnpm build
```

---

## 🎯 使用指南

1. **上传图片**：点击上传区域，选择图片或 JSON 存档
2. **预览模式**：上传后进入半透明预览，可旋转查看
3. **开始专注**：点击"开始监控"启动 FocusAI 引擎连接
4. **豆子下沉**：专注过程中豆子随进度逐渐下沉消失
5. **熨烫效果**：点击"熨烫融合"观看分阶段动画
6. **导出存档**：点击"导出图纸"保存 JSON 文件

---

## 🔧 技术亮点

- **useReducer 状态机**：单一真相源，状态转换可预测
- **InstancedMesh 优化**：6000+ 豆子 60fps 流畅渲染
- **分阶段动画**：豆板消失 → 豆子变形，时序精确控制
- **自定义 Shader**：实例级透明度支持（onBeforeCompile）
- **FocusAI 集成**：实时专注数据驱动豆子下沉动画
- **几何体工厂**：避免共享几何体被意外修改

---

## 📝 注意事项

- 图片最大限制 78×78 像素，超出自动等比缩放
- 透明像素（alpha ≤ 128）会被过滤
- 需要 FocusAI 引擎（http://127.0.0.1:8765）才能使用专注模式
- 熨烫可在无引擎连接时独立使用

---

## 🤝 贡献

欢迎提交 Issue 和 PR！

---

*Built with ❤️ by FocusAI Team*
