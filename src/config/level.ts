/*
 * @FilePath: \linkup-ts\src\config\level.ts
 * @Description: level config
 * @Author: humandetail
 * @Date: 2021-03-18 23:56:46
 * @LastEditors: humandetail
 * @LastEditTime: 2021-03-19 18:38:43
 */

import { ILevelItem } from '../../types';

export default <{
  [key: string]: ILevelItem
}>{
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
};
