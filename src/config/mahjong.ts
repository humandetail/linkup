/*
 * @FilePath: \linkup-ts\src\config\mahjong.ts
 * @Description: mahjong config
 * @Author: humandetail
 * @Date: 2021-03-19 22:45:02
 * @LastEditors: humandetail
 * @LastEditTime: 2021-03-25 23:17:34
 */

import { IMahjongItem } from '../../types';

// 底图素材
export const mahjongPic = './assets/img/mahjong.png';
// 单个元素尺寸
export const singleSize: [number, number] = [60, 75]; 
// 元素集合
export const mahjongs: IMahjongItem[] = [
  // 万
  {
    name: 'character-one',
    label: '一万',
    pos: [0, 0]
  },
  {
    name: 'character-two',
    label: '二万',
    pos: [1, 0]
  },
  {
    name: 'character-three',
    label: '三万',
    pos: [2, 0]
  },
  {
    name: 'character-four',
    label: '四万',
    pos: [3, 0]
  },
  {
    name: 'character-five',
    label: '五万',
    pos: [4, 0]
  },
  {
    name: 'character-six',
    label: '六万',
    pos: [5, 0]
  },
  {
    name: 'character-seven',
    label: '七万',
    pos: [6, 0]
  },
  {
    name: 'character-eight',
    label: '八万',
    pos: [7, 0]
  },
  {
    name: 'character-night',
    label: '九万',
    pos: [8, 0]
  },

  // 筒
  {
    name: 'dot-one',
    label: '一筒',
    pos: [0, 1]
  },
  {
    name: 'dot-two',
    label: '二筒',
    pos: [1, 1]
  },
  {
    name: 'dot-three',
    label: '三筒',
    pos: [2, 1]
  },
  {
    name: 'dot-four',
    label: '四筒',
    pos: [3, 1]
  },
  {
    name: 'dot-five',
    label: '五筒',
    pos: [4, 1]
  },
  {
    name: 'dot-six',
    label: '六筒',
    pos: [5, 1]
  },
  {
    name: 'dot-seven',
    label: '七筒',
    pos: [6, 1]
  },
  {
    name: 'dot-eight',
    label: '八筒',
    pos: [7, 1]
  },
  {
    name: 'dot-night',
    label: '九筒',
    pos: [8, 1]
  },

  // 条
  {
    name: 'bamboo-one',
    label: '一条',
    pos: [0, 2]
  },
  {
    name: 'bamboo-two',
    label: '二条',
    pos: [1, 2]
  },
  {
    name: 'bamboo-three',
    label: '三条',
    pos: [2, 2]
  },
  {
    name: 'bamboo-four',
    label: '四条',
    pos: [3, 2]
  },
  {
    name: 'bamboo-five',
    label: '五条',
    pos: [4, 2]
  },
  {
    name: 'bamboo-six',
    label: '六条',
    pos: [5, 2]
  },
  {
    name: 'bamboo-seven',
    label: '七条',
    pos: [6, 2]
  },
  {
    name: 'bamboo-eight',
    label: '八条',
    pos: [7, 2]
  },
  {
    name: 'bamboo-night',
    label: '九条',
    pos: [8, 2]
  },


  // 字
  {
    name: 'east-widh',
    label: '东风',
    pos: [0, 3]
  },
  {
    name: 'south-wind',
    label: '南风',
    pos: [1, 3]
  },
  {
    name: 'west-wind',
    label: '西风',
    pos: [2, 3]
  },
  {
    name: 'north-wind',
    label: '北风',
    pos: [3, 3]
  },
  {
    name: 'red-dragon',
    label: '红中',
    pos: [4, 3]
  },
  {
    name: 'green-dragon',
    label: '发财',
    pos: [5, 3]
  },
  {
    name: 'white-dragon',
    label: '白板',
    pos: [6, 3]
  }
];
