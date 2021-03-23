/*
 * @FilePath: \linkup-ts\types\index.d.ts
 * @Description: 
 * @Author: humandetail
 * @Date: 2021-03-18 16:09:29
 * @LastEditors: humandetail
 * @LastEditTime: 2021-03-21 23:05:58
 */

export interface ITopicsWrapper {
  [key: string]: Function[]
}

export interface PublishSubscribers {
  subscribe: (topic: TopicTypes, cb: Function) => void;
  unSubscribe: (topic: TopicTypes, cb: Function) => void;
  publish: (topic: TopicTypes, ...args: any[]) => void;
}

export interface ILevelItem {
  name: string;
  row: number;
  col: number;
}

export interface IMahjongItem {
  // 名称
  name: string;
  // 中文名
  label: string;
  // 所在素材位置
  pos: [number, number]
}

export type ILinkUpItem = [number, number, undefined | IMahjongItem]

export type IPoint = [number, number];

export interface IIsEmptyCallback {
  (point: IPoint): boolean;
}
