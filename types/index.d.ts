/*
 * @FilePath: \linkup-ts\types\index.d.ts
 * @Description: 
 * @Author: humandetail
 * @Date: 2021-03-18 16:09:29
 * @LastEditors: humandetail
 * @LastEditTime: 2021-03-25 23:30:24
 */

// 等级
export interface ILevelItem {
  name: string;
  row: number;
  col: number;
}

// 麻将元素
export interface IMahjongItem {
  // 名称
  name: string;
  // 中文名
  label: string;
  // 所在素材位置
  pos: [number, number]
}

// 游戏元素信息
// [x, y, 麻将元素|undefined(空元素，已被消除)]
export type ILinkUpItem = [number, number, undefined | IMahjongItem]

// 坐标点
export type IPoint = [number, number];

// 空元素判断回调
export interface IIsEmptyCallback {
  (point: IPoint): boolean;
}

export interface EventCallback  {
  (...args: any[]): any;
  listen?: () => any;
}

export interface EventWrapper {
  [key: string]: EventCallback[]
}

