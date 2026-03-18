import { useRef, useEffect, useReducer, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { hollowBeadGeom, getIronedGeom, pegCylinderGeom, dummy } from '../../lib/geometry';
import { MAX_DIMENSION } from '../../lib/palette';

export interface PixelData {
  x: number;
  y: number;
  color: THREE.Color;
}

// ==================== 状态类型定义 ====================

type BoardState = 'IDLE' | 'BUILDING' | 'IRONING' | 'PREVIEWING' | 'COMPLETED';

interface BeadInstance {
  id: number;
  x: number;
  y: number;
  color: THREE.Color;
  // 目标状态（由 reducer 计算）
  targetZ: number;
  targetOpacity: number;
  isIroned: boolean;
}

interface BoardStateData {
  state: BoardState;
  beads: BeadInstance[];
  completionPercentage: number;
  // 熨烫动画进度 (0-1)
  ironProgress: number;
  // 豆板透明度 (0-1)
  boardOpacity: number;
}

// ==================== Action 类型 ====================

type Action =
  | { type: 'UPLOAD_IMAGE'; pixels: PixelData[] }
  | { type: 'UPDATE_PROGRESS'; percentage: number }
  | { type: 'START_IRONING' }
  | { type: 'CANCEL_IRONING'; completionPercentage: number }
  | { type: 'START_PREVIEW' }
  | { type: 'CANCEL_PREVIEW'; completionPercentage: number }
  | { type: 'UPDATE_IRON_PROGRESS'; progress: number }
  | { type: 'UPDATE_BOARD_OPACITY'; opacity: number }
  | { type: 'RESET' };

// ==================== Reducer ====================

const initialState: BoardStateData = {
  state: 'IDLE',
  beads: [],
  completionPercentage: 0,
  ironProgress: 0,
  boardOpacity: 0.8,
};

function boardReducer(state: BoardStateData, action: Action): BoardStateData {
  switch (action.type) {
    case 'UPLOAD_IMAGE': {
      // 导入图纸：直接进入拼豆状态，所有豆子初始隐藏（等待 UPDATE_PROGRESS 设置可见性）
      return {
        ...state,
        state: 'BUILDING',
        beads: action.pixels.map((p, i) => ({
          id: i,
          x: p.x,
          y: p.y,
          color: p.color,
          targetZ: -10,
          targetOpacity: 0,
          isIroned: false,
        })),
        completionPercentage: 0,
        ironProgress: 0,
        boardOpacity: 0.8,
      };
    }

    case 'UPDATE_PROGRESS': {
      // 豆子显示占比与专注进度一致：进度越高，显示的豆子越多
      const visibleCount = Math.floor((action.percentage / 100) * state.beads.length);

      return {
        ...state,
        state: action.percentage >= 100 ? 'COMPLETED' : 'BUILDING',
        completionPercentage: action.percentage,
        beads: state.beads.map((b, i) => ({
          ...b,
          targetZ: i < visibleCount ? 0 : -10,
          targetOpacity: i < visibleCount ? 1 : 0,
        })),
      };
    }

    case 'START_IRONING': {
      // 熨烫：只烫平当前可见部分的豆子，不改变可见性
      return {
        ...state,
        state: 'IRONING',
        ironProgress: 0,
      };
    }

    case 'CANCEL_IRONING': {
      // 取消熨烫 → 返回默认拼豆状态
      const pct = action.completionPercentage;
      const visibleCount = Math.floor((pct / 100) * state.beads.length);
      return {
        ...state,
        state: pct >= 100 ? 'COMPLETED' : 'BUILDING',
        ironProgress: 0,
        boardOpacity: 0.8,
        beads: state.beads.map((b, i) => ({
          ...b,
          targetZ: i < visibleCount ? 0 : -10,
          targetOpacity: i < visibleCount ? 1 : 0,
          isIroned: false,
        })),
      };
    }

    case 'START_PREVIEW': {
      // 预览：所有豆子可见 + 触发熨烫效果（展示完整且烫平的图案）
      return {
        ...state,
        state: 'PREVIEWING',
        ironProgress: 0,
        beads: state.beads.map(b => ({
          ...b,
          targetZ: 0,
          targetOpacity: 1,
        })),
      };
    }

    case 'CANCEL_PREVIEW': {
      // 取消预览 → 返回默认拼豆状态（按进度显示未烫豆子）
      const pct = action.completionPercentage;
      const visibleCount = Math.floor((pct / 100) * state.beads.length);
      return {
        ...state,
        state: pct >= 100 ? 'COMPLETED' : 'BUILDING',
        ironProgress: 0,
        boardOpacity: 0.8,
        beads: state.beads.map((b, i) => ({
          ...b,
          targetZ: i < visibleCount ? 0 : -10,
          targetOpacity: i < visibleCount ? 1 : 0,
          isIroned: false,
        })),
      };
    }

    case 'UPDATE_IRON_PROGRESS': {
      // 延迟变形：boardOpacity 降到 0.2 后豆子才开始变形
      const delayThreshold = 0.2;
      const effectiveProgress = state.boardOpacity <= delayThreshold
        ? (delayThreshold - state.boardOpacity) / delayThreshold
        : 0;

      return {
        ...state,
        ironProgress: action.progress,
        beads: state.beads.map(b => ({
          ...b,
          isIroned: effectiveProgress > 0.5,
        })),
      };
    }

    case 'UPDATE_BOARD_OPACITY': {
      return {
        ...state,
        boardOpacity: action.opacity,
      };
    }

    case 'RESET': {
      return initialState;
    }

    default:
      return state;
  }
}

// ==================== 组件 ====================

interface BeadsBoardProps {
  pixels: PixelData[];
  isIroned: boolean;
  isPreview?: boolean;
  isStarted?: boolean;
  completionPercentage?: number;
  change?: number;
}

// 底板组件
function PegBoard({
  targetOpacity,
  isIroned
}: {
  targetOpacity: number;
  isIroned: boolean;
}) {
  const pegMeshRef = useRef<THREE.InstancedMesh>(null);
  const boardMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const pegMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const currentOpacity = useRef(0.8);
  const pegCount = MAX_DIMENSION * MAX_DIMENSION;

  useEffect(() => {
    if (!pegMeshRef.current) return;
    const offset = MAX_DIMENSION / 2;
    let i = 0;
    for (let y = 0; y < MAX_DIMENSION; y++) {
      for (let x = 0; x < MAX_DIMENSION; x++) {
        dummy.position.set(x - offset + 0.5, -(y - offset + 0.5), 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        pegMeshRef.current.setMatrixAt(i++, dummy.matrix);
      }
    }
    pegMeshRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  // 用 useFrame 平滑插值 opacity，绕过 React 渲染
  useFrame((_s, _d, xrFrame) => {
    const target = isIroned ? 0 : targetOpacity;
    const diff = target - currentOpacity.current;
    if (Math.abs(diff) > 0.001) {
      currentOpacity.current += diff * 0.15;
    } else {
      currentOpacity.current = target;
    }
    // 当 opacity 足够小时直接归零，避免残影
    const op = currentOpacity.current < 0.01 ? 0 : currentOpacity.current;
    if (boardMatRef.current) boardMatRef.current.opacity = op;
    if (pegMatRef.current) pegMatRef.current.opacity = op;
  });

  return (
    <group>
      {/* 底部平板 */}
      <mesh position={[0, 0, -0.4]}>
        <boxGeometry args={[MAX_DIMENSION, MAX_DIMENSION, 0.2]} />
        <meshStandardMaterial
          ref={boardMatRef}
          color="#888888"
          opacity={0.8}
          transparent={true}
          depthWrite={false}
          roughness={0.4}
        />
      </mesh>
      {/* 圆柱插销阵列 */}
      <instancedMesh ref={pegMeshRef} args={[pegCylinderGeom, undefined, pegCount]}>
        <meshStandardMaterial
          ref={pegMatRef}
          color="#999999"
          opacity={0.8}
          transparent={true}
          depthWrite={false}
          roughness={0.4}
        />
      </instancedMesh>
    </group>
  );
}

export function BeadsBoard({
  pixels,
  isIroned: isIronedProp,
  isPreview: isPreviewProp = false,
  isStarted = false,
  completionPercentage = 0,
}: BeadsBoardProps) {
  // 使用 useReducer 管理状态
  const [state, dispatch] = useReducer(boardReducer, initialState);
  
  // 引用传递给 Three.js
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  const dirLightRef = useRef<THREE.DirectionalLight>(null);

  // 当前实际状态（用于平滑插值）
  const currentStateRef = useRef({
    zArray: new Float32Array(0),
    opacityArray: new Float32Array(0),
    ironProgress: 0,
    boardOpacity: 0.8,
  });

  // ==================== 同步外部 Props 到内部状态 ====================

  // 1. 图片上传 → PREVIEW（支持替换图纸：先 RESET 再 UPLOAD）
  const prevPixelsRef = useRef<PixelData[]>([]);
  useEffect(() => {
    if (pixels.length === 0) return;
    if (pixels === prevPixelsRef.current) return;
    prevPixelsRef.current = pixels;

    // 如果不是 IDLE，先重置再上传
    if (state.state !== 'IDLE') {
      dispatch({ type: 'RESET' });
      // 重置插值状态
      currentStateRef.current = {
        zArray: new Float32Array(0),
        opacityArray: new Float32Array(0),
        ironProgress: 0,
        boardOpacity: 0.8,
      };
    }
    dispatch({ type: 'UPLOAD_IMAGE', pixels });
  }, [pixels]);

  // 2. 进度更新（仅在拼豆/完成状态下响应）
  useEffect(() => {
    if (state.state === 'BUILDING' || state.state === 'COMPLETED') {
      dispatch({ type: 'UPDATE_PROGRESS', percentage: completionPercentage });
    }
  }, [completionPercentage, state.state]);

  // 3. 熨烫状态变化
  useEffect(() => {
    if (isIronedProp && state.state !== 'IRONING') {
      dispatch({ type: 'START_IRONING' });
    } else if (!isIronedProp && state.state === 'IRONING') {
      dispatch({ type: 'CANCEL_IRONING', completionPercentage });
    }
  }, [isIronedProp, state.state]);

  // 4. 预览状态变化
  useEffect(() => {
    if (isPreviewProp && state.state !== 'PREVIEWING') {
      dispatch({ type: 'START_PREVIEW' });
    } else if (!isPreviewProp && state.state === 'PREVIEWING') {
      dispatch({ type: 'CANCEL_PREVIEW', completionPercentage });
    }
  }, [isPreviewProp, state.state]);

  // 5. 初始化数组长度
  useEffect(() => {
    if (state.beads.length > 0 && currentStateRef.current.zArray.length !== state.beads.length) {
      currentStateRef.current.zArray = new Float32Array(state.beads.length).fill(0);
      const opArr = new Float32Array(state.beads.length);
      state.beads.forEach((b, i) => { opArr[i] = b.targetOpacity; });
      currentStateRef.current.opacityArray = opArr;
    }
  }, [state.beads.length]);

  // 6. 初始化颜色和矩阵（首次渲染）
  useEffect(() => {
    if (!meshRef.current || state.beads.length === 0) return;

    state.beads.forEach((bead, i) => {
      meshRef.current!.setColorAt(i, bead.color);
      dummy.position.set(bead.x, bead.y, bead.targetZ);
      // 修复：预览时保持 scale=1，只改变透明度
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [state.beads]);

  // ==================== 动画循环（只负责平滑插值）====================

  useFrame(() => {
    if (!meshRef.current || state.beads.length === 0) return;

    let needsMatrixUpdate = false;
    let needsColorUpdate = false;

    // 1. 豆板透明度插值
    const targetBoardOpacity = state.boardOpacity;
    const currentBoardOpacity = currentStateRef.current.boardOpacity;
    if (Math.abs(currentBoardOpacity - targetBoardOpacity) > 0.01) {
      currentStateRef.current.boardOpacity += (targetBoardOpacity - currentBoardOpacity) * 0.15;
      // 通知 PegBoard 更新
      // 注意：PegBoard 是独立组件，通过 props 传递
    }

    // 2. 熨烫进度插值
    const targetIronProgress = state.ironProgress;
    const currentIronProgress = currentStateRef.current.ironProgress;
    if (Math.abs(currentIronProgress - targetIronProgress) > 0.001) {
      currentStateRef.current.ironProgress += (targetIronProgress - currentIronProgress) * 0.08;
      needsMatrixUpdate = true;
    }

    // 3. 计算延迟的熨烫变形（boardOpacity 降到 0.2 后才开始）
    const delayThreshold = 0.2;
    const effectiveBoardOpacity = currentStateRef.current.boardOpacity;
    let delayedIronProgress = 0;
    if (effectiveBoardOpacity <= delayThreshold) {
      delayedIronProgress = (delayThreshold - effectiveBoardOpacity) / delayThreshold;
    }
    delayedIronProgress = Math.min(1, delayedIronProgress);

    // 4. 材质属性更新
    if (materialRef.current) {
      materialRef.current.roughness = 0.6 - 0.4 * delayedIronProgress;
      materialRef.current.clearcoat = 0.8 * delayedIronProgress;
    }
    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = 0.6 + 0.6 * delayedIronProgress;
    }
    if (dirLightRef.current) {
      dirLightRef.current.intensity = 0.8 + 0.7 * delayedIronProgress;
    }

    // 5. 每个豆子的平滑插值
    const baseScaleZ = 1.0 - 0.7 * delayedIronProgress;
    const zArray = currentStateRef.current.zArray;
    const opArray = currentStateRef.current.opacityArray;

    for (let i = 0; i < state.beads.length; i++) {
      const bead = state.beads[i];
      const currentZ = zArray[i];
      const currentOp = opArray[i];

      // Z 位置插值
      if (Math.abs(currentZ - bead.targetZ) > 0.01) {
        zArray[i] += (bead.targetZ - currentZ) * 0.1;
        needsMatrixUpdate = true;
      }

      // 透明度插值
      if (Math.abs(currentOp - bead.targetOpacity) > 0.01) {
        opArray[i] += (bead.targetOpacity - currentOp) * 0.1;
        needsMatrixUpdate = true;
      }

      if (needsMatrixUpdate) {
        dummy.position.set(bead.x, bead.y, zArray[i]);
        // 修复：豆子大小保持1，透明度通过材质控制，不缩放几何体
        // 只有Z轴在熨烫时压缩
        const scaleXY = 1; 
        dummy.scale.set(scaleXY, scaleXY, baseScaleZ);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
    }

    if (needsMatrixUpdate) {
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
    
    // 更新实例透明度
    if (meshRef.current.geometry.attributes.instanceOpacity) {
      meshRef.current.geometry.attributes.instanceOpacity.needsUpdate = true;
    }

    // 6. 更新熨烫进度到 reducer（用于触发 isIroned 状态变化）
    if (state.state === 'IRONING' || state.state === 'PREVIEWING') {
      const targetIron = 1;
      const newProgress = currentIronProgress + (targetIron - currentIronProgress) * 0.08;
      if (Math.abs(newProgress - state.ironProgress) > 0.01) {
        dispatch({ type: 'UPDATE_IRON_PROGRESS', progress: newProgress });
        dispatch({ type: 'UPDATE_BOARD_OPACITY', opacity: effectiveBoardOpacity });
      }
    }
  });

  // ==================== 渲染 ====================

  // 熨烫时切换几何体
  const isIronedGeometry = (state.state === 'IRONING' && state.ironProgress > 0.5) || state.state === 'PREVIEWING';
  
  // 使用 useMemo 缓存几何体，避免每次渲染创建新的
  const beadGeometry = useMemo(() => {
    return isIronedGeometry ? getIronedGeom() : hollowBeadGeom;
  }, [isIronedGeometry]);

  // 确保透明度数组长度正确
  const opacityArray = useMemo(() => {
    if (state.beads.length === 0) return new Float32Array(0);
    if (currentStateRef.current.opacityArray.length !== state.beads.length) {
      currentStateRef.current.opacityArray = new Float32Array(state.beads.length);
      state.beads.forEach((bead, i) => {
        currentStateRef.current.opacityArray[i] = bead.targetOpacity;
      });
    }
    return currentStateRef.current.opacityArray;
  }, [state.beads, isIronedGeometry]);

  // 当几何体切换时，重新设置矩阵
  useEffect(() => {
    if (!meshRef.current || state.beads.length === 0) return;
    
    // 几何体改变后，重新应用所有矩阵
    state.beads.forEach((bead, i) => {
      const z = currentStateRef.current.zArray[i] ?? bead.targetZ;
      dummy.position.set(bead.x, bead.y, z);
      dummy.scale.set(1, 1, 1); // 重置 scale
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [isIronedGeometry, state.beads]);

  // 自定义着色器支持实例透明度
  const onBeforeCompile = useCallback((shader: THREE.Shader) => {
    shader.vertexShader = `
      attribute float instanceOpacity;
      varying float vInstanceOpacity;
      ${shader.vertexShader}
    `.replace(
      `#include <begin_vertex>`,
      `#include <begin_vertex>
       vInstanceOpacity = instanceOpacity;`
    );

    shader.fragmentShader = `
      varying float vInstanceOpacity;
      ${shader.fragmentShader}
    `.replace(
      `#include <alphatest_fragment>`,
      `diffuseColor.a *= vInstanceOpacity;
       #include <alphatest_fragment>`
    );
  }, []);

  return (
    <group>
      <ambientLight ref={ambientLightRef} color={0xffffff} intensity={0.6} />
      <directionalLight
        ref={dirLightRef}
        color={0xffffff}
        intensity={0.8}
        position={[50, 50, 100]}
      />

      {/* 底板 */}
      <PegBoard
        targetOpacity={state.boardOpacity}
        isIroned={state.state === 'IRONING' || state.state === 'PREVIEWING'}
      />

      {/* 拼豆 */}
      {state.beads.length > 0 && (
        <instancedMesh
          ref={meshRef}
          key={isIronedGeometry ? 'ironed' : 'normal'} // 强制重新创建当几何体改变时
          args={[beadGeometry, undefined, state.beads.length]}
        >
          <instancedBufferAttribute
            attach="geometry-attributes-instanceOpacity"
            args={[opacityArray, 1]}
          />
          <meshPhysicalMaterial
            ref={materialRef}
            metalness={0.0}
            roughness={0.6}
            transparent={true}
            alphaTest={0.05}
            onBeforeCompile={onBeforeCompile}
          />
        </instancedMesh>
      )}
    </group>
  );
}
