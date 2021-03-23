/*
 * @FilePath: \linkup-ts\src\lib\pathFinding.ts
 * @Description: 寻路算法
 * @Author: humandetail
 * @Date: 2021-03-21 20:35:18
 * @LastEditors: humandetail
 * @LastEditTime: 2021-03-22 17:29:01
 */

import { IIsEmptyCallback, ILinkUpItem, IPoint } from '../../types';

// 连连看有四种情况
// 1. 两个点在同一行
// 2. 两个点在同一列
// 3. 一个拐角
// 4. 两个拐角

/**
 * 同一行 - 水平方向检测
 * 
 * [ ] [ ] [ ] [ ] [ ]
 * [ ] [A] [ ] [B] [ ]
 * [ ] [ ] [ ] [ ] [ ]
 * 
 * @param { IPoint } pointA - A点
 * @param { IPoint } pointB - B点
 * @param { IIsEmptyCallback } isEmpty - 检测某个点是否为空元素的点
 */
function horizontalDetection (pointA: IPoint, pointB: IPoint, isEmpty: IIsEmptyCallback): boolean | IPoint[]  {
  const [Ax, Ay] = pointA;
  const [Bx, By] = pointB;
  // 水平 也就是 y 轴坐标相同
  if (Ay !== By) return false;

  // 找出最小的 x 轴坐标 和 最大的 x 轴坐标
  const startX = Math.min(Ax, Bx);
  const endX = Math.max(Ax, Bx);

  // 不包含 A 和 B
  // 相邻的两个点会直接跳过 for 循环
  for (let x = startX + 1; x < endX; x++) {
    if (!isEmpty([x, Ay])) {
      return false;
    }
  }

  return [pointA, pointB];
}

/**
 * 同一列 - 垂直方向检测
 * [ ] [ ] [ ] [ ] [ ]
 * [ ] [A] [ ] [ ] [ ]
 * [ ] [ ] [ ] [ ] [ ]
 * [ ] [B] [ ] [ ] [ ]
 * [ ] [ ] [ ] [ ] [ ]
 * 
 * @param { IPoint } pointA - A点
 * @param { IPoint } pointB - B点
 * @param { IIsEmptyCallback } isEmpty - 检测某个点是否为空元素的点
 */
function verticalDetection (pointA: IPoint, pointB: IPoint, isEmpty: IIsEmptyCallback): boolean | IPoint[]  {
  const [Ax, Ay] = pointA;
  const [Bx, By] = pointB;
  // 垂直 也就是 x 轴坐标相同
  if (Ax !== Bx) return false;

  // 找出最小的 y 轴坐标 和 最大的 y 轴坐标
  const startY = Math.min(Ay, By);
  const endY = Math.max(Ay, By);

  // 不包含 A 和 B
  // 相邻的两个点会直接跳过 for 循环
  for (let y = startY + 1; y < endY; y++) {
    if (!isEmpty([Ax, y])) {
      return false;
    }
  }

  return [pointA, pointB];
}

/**
 * 一个拐角的检测
 * 等同于：
 * 1. A -> C 的水平方向检测 + C -> B 的垂直方向检测
 * 2. A -> D 的垂直方向检测 + D -> B 的水平方向检测
 * [ ] [ ] [ ] [ ] [ ]
 * [ ] [A] [ ] [C] [ ]
 * [ ] [ ] [ ] [ ] [ ]
 * [ ] [D] [ ] [B] [ ]
 * [ ] [ ] [ ] [ ] [ ]
 * 
 * @param { IPoint } pointA - A点
 * @param { IPoint } pointB - B点
 * @param { IIsEmptyCallback } isEmpty - 检测某个点是否为空元素的点
 */
function aCornerDetection (pointA: IPoint, pointB: IPoint, isEmpty: IIsEmptyCallback): boolean | IPoint[] {
  const [Ax, Ay] = pointA;
  const [Bx, By] = pointB;

  // C 点 或 D 点
  const pointC: IPoint = [Ax, By];
  const pointD: IPoint = [Bx, Ay];

  let flag = false;

  // 假设 C 点为非障碍点
  if (isEmpty(pointC) && (!!verticalDetection(pointA, pointC, isEmpty)) && (!!horizontalDetection(pointC, pointB, isEmpty))) {
    return [pointA, pointC, pointB];
  }

  // 假设 D 点为非障碍点
  if (isEmpty(pointD) && (!!horizontalDetection(pointA, pointD, isEmpty)) && (!!verticalDetection(pointD, pointB, isEmpty))) {
    return [pointA, pointD, pointB];
  }

  return flag;
}

/**
 * 两个拐角检测
 * 等同于：一个拐角检测 + 水平或垂直方向检测
 * [ ] [ ] [ ] [ ] [ ] [ ] [ ]
 * [ ] [ ] [ ] [ ] [ ] [ ] [ ]
 * [ ] [ ] [ ] [ ] [ ] [B] [ ]
 * [ ] [ ] [ ] [ ] [ ] [ ] [ ]
 * [ ] [ ] [ ] [ ] [ ] [ ] [ ]
 * [ ] [ ] [ ] [ ] [ ] [ ] [ ]
 * [ ] [ ] [ ] [ ] [ ] [ ] [ ]
 * [ ] [A] [ ] [ ] [ ] [ ] [ ]
 * [ ] [ ] [ ] [ ] [ ] [ ] [ ]
 * [ ] [ ] [ ] [ ] [ ] [ ] [ ]
 * 从上图可以看出：
 * A 的水平和垂直线 + B 的水平垂直线 = 4条
 * 扫描这4条线上所有不包括 A 或 B 的 点，找到满足以下情况之一的 C 点：
 * 1. A 可以通过垂直或水平检测找到 C，然后 C 可以通过一个拐角检测找到 B;
 * 2. A 可以通过一个拐角找到 C，然后 C 可以通过垂直或水平检测找到 B。
 * 
 * @param { IPoint } pointA - A点
 * @param { IPoint } pointB - B点
 * @param { IIsEmptyCallback } isEmpty - 检测某个点是否为空元素的点
 */
function twoCornersDetection (pointA: IPoint, pointB: IPoint, row: number, col: number, isEmpty: IIsEmptyCallback): boolean | IPoint[] {
  const [Ax, Ay] = pointA;
  const [Bx, By] = pointB;
  for (let i = 0; i < col; i++) {
    for (let j = 0; j < row; j++) {
      if (
        // 非 A 或 B 点 水平垂直线上的点
        (i !== Ax && i !== Bx && j !== Ay && j !== By) ||
        // A 点
        (i === Ax && j === Ay) ||
        // B 点
        (i === Bx && j === By) ||
        // 障碍点
        (!isEmpty([i, j]))
      ) {
        // 以上几种情况都不符合，直接跳过
        continue;
      }

      // 情况1
      let lineInfo: IPoint[] | boolean = aCornerDetection(pointA, [i, j], isEmpty);
      if (
        (!!lineInfo) &&
        (horizontalDetection([i, j], pointB, isEmpty) || verticalDetection([i, j], pointB, isEmpty))
      ) {
        return [...lineInfo as IPoint[], pointB];
      }

      // 情况2
      lineInfo = aCornerDetection([i, j], pointB, isEmpty);
      if (
        (!!lineInfo) &&
        (horizontalDetection(pointA, [i, j], isEmpty) || verticalDetection(pointA, [i, j], isEmpty))
      ) {
        return [pointA, [i, j], ...lineInfo as IPoint[]];
      }
    }
  }

  return false;
}

export function linkDetection (pointA: IPoint, pointB: IPoint, row: number, col: number, isEmpty: IIsEmptyCallback): boolean | IPoint[] {
  let ret: boolean | IPoint[];
  
  ret = horizontalDetection(pointA, pointB, isEmpty);
  if (!!ret) {
    return ret;
  }
  
  ret = verticalDetection(pointA, pointB, isEmpty);
  if (!!ret) {
    return ret;
  }
  
  ret = aCornerDetection(pointA, pointB, isEmpty);
  if (!!ret) {
    return ret;
  }
  
  ret = twoCornersDetection(pointA, pointB, row, col, isEmpty);
  if (!!ret) {
    return ret;
  }

  return false;
}
