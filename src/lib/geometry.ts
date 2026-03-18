import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three-stdlib';

/** 预生成几何体 - 空心串珠 */
export const hollowBeadGeom = (() => {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, 0.45, 0, Math.PI * 2, false);
  const holePath = new THREE.Path();
  holePath.absarc(0, 0, 0.45 * 0.6, 0, Math.PI * 2, true); // 内径是外径的0.6倍 (0.27)
  shape.holes.push(holePath);
  
  const geom = new THREE.ExtrudeGeometry(shape, { 
    depth: 0.6, 
    bevelEnabled: false, 
    curveSegments: 16 
  });
  geom.center();
  return geom;
})();

/** 预生成几何体 - 底板卡口圆柱 */
export const pegCylinderGeom = (() => {
  // 半径 0.27 与豆子内径契合，高度 0.6 与豆子一致
  const geom = new THREE.CylinderGeometry(0.27, 0.27, 0.6, 16);
  geom.rotateX(Math.PI / 2); // 旋转使其朝向 Z 轴
  return geom;
})();

/** 预生成熨烫后的圆角正方体 - 使用函数确保每次获取都是新的实例 */
export const getIronedGeom = () => new RoundedBoxGeometry(1.0, 1.0, 0.6, 2, 0.02);

/** 用于计算矩阵的哑元对象 */
export const dummy = new THREE.Object3D();