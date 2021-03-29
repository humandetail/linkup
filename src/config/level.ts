/*
 * @FilePath: \linkup-ts\src\config\level.ts
 * @Description: level config
 * @Author: humandetail
 * @Date: 2021-03-18 23:56:46
 * @LastEditors: humandetail
 * @LastEditTime: 2021-03-26 12:53:09
 */

import { ILevelItem } from '../../types';

const levels: {
  [key: string]: ILevelItem
} = {
  // 高级难度
  'HIGH': {
    name: '高级难度',
    row: 8,
    col: 17
  },
  // 中等难度
  'MIDDLE': {
    name: '中等难度',
    row: 8,
    col: 12
  },
  // 普通难度
  'PRIMARY': {
    name: '普通难度',
    row: 8,
    col: 8
  }
}

export default levels;
