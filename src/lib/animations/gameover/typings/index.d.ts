/*
 * @FilePath: \linkup-ts\src\lib\animations\gameover\typings\index.d.ts
 * @Description: 类型声明文件
 * @Author: humandetail
 * @Date: 2021-03-29 14:24:31
 * @LastEditors: humandetail
 * @LastEditTime: 2021-03-29 15:52:28
 */

export interface IOptionsParam {
  fidelity?: number;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  text?: string;
  shadowColor?: string;
  shadowBlur?: number;
}
export interface IOptions {
  fidelity: number;
  fontSize: number;
  fontWeight: number;
  color: string;
  text: string;
  shadowColor: string;
  shadowBlur: number;
}

export interface IPoint {
  x: number;
  y: number;
}

export interface IGetTargets {
  (): IPoint | undefined
}
