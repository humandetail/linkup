/*
 * @FilePath: \linkup-ts\src\lib\utils.ts
 * @Description: 工具集合
 * @Author: humandetail
 * @Date: 2021-03-18 20:35:49
 * @LastEditors: humandetail
 * @LastEditTime: 2021-03-29 19:09:59
 */

import { ILevelItem, IMahjongItem, IPoint } from '../../types';
import {
  mahjongs
} from '../config/mahjong';

/**
 * sleep
 * @param { number } duration - 睡眠时长
 */
export function sleep (duration: number): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, duration);
  });
}

/**
 * deepClone
 */
export function deepClone (origin: any, target: any): any {
  var tar = target || {},
      toStr = Object.prototype.toString,
      arrType = '[object Array]',
      item;
  
   for (var key in origin) {
      if (origin.hasOwnProperty(key)) {
          item = origin[key];
          if (typeof item === 'object' && item !== null) {
              if (toStr.call(item) === arrType) { // 判断该值是对象还是数组
                  tar[key] = [];
              } else {
                  tar[key] = {};
              }
              
              // 递归拷贝
              deepClone(origin[key], tar[key]);
          } else {
              tar[key] = item;
          }
      }
  }
  return tar;
}

/**
 * 加载图片
 * @param { string } src 图片路径
 */
export function loadImage (src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
  
    img.onload = function () {
      resolve();
    }

    img.onerror = function () {
      reject();
    }
  
    img.src = src;
  });
}

/**
 * 获取当前等级的素材
 */
export function getCurrentLevelMahjong (level: ILevelItem): IMahjongItem[] {
  const { col, row, name } = level;

  if (name === '普通难度') {
    const arr = shuffle(mahjongs).slice(0, col * row / 4);
    return shuffle([...arr, ...arr, ...arr, ...arr]);
  }

  const arr = shuffle([...mahjongs, ...mahjongs]).slice(0, col * row / 2);

  return shuffle([...arr, ...arr]);
}

/**
 * 数组随机排序
 * @param input 需要排序的数组
 */
export function shuffle <T extends Array<any>>(input: T): T {
  const len = input.length;

  if (len === 0) return input;

  let randomIndex: number;
  let itemAtIndex;

  for (let i = len - 1; i >= 0; i--) {
    randomIndex = Math.floor(Math.random() * (i + 1));
    itemAtIndex = input[randomIndex];
    input[randomIndex] = input[i];
    input[i] = itemAtIndex;
  }

  return input;
}

/**
 * 获取滚动条的距离
 */
export function getScrollOffset () {
  if (window.pageXOffset) {
    return {
      left: window.pageXOffset,
      top: window.pageYOffset
    }
  } else {
    return { // document.body.scrollLeft 要么有值，要么为0，所以可以两者相加获取到值
      left: document.body.scrollLeft + document.documentElement.scrollLeft,
      top: document.body.scrollTop + document.documentElement.scrollTop
    }
  }
}

/**
 * 获取鼠标点击的位置
 */
export function getPagePos (e: MouseEvent) {
  var e = e || window.event,
    scrollLeft = getScrollOffset().left,
    scrollTop = getScrollOffset().top,
    clientLeft = document.documentElement.clientLeft || 0,
    clientTop = document.documentElement.clientTop || 0;

  return {
    x: e.clientX + scrollLeft - clientLeft,
    y: e.clientY + scrollTop + clientTop
  }
}

/**
 * 获取元素相对于文档的距离
 */
export function getElemDocPosition (el: any) {
  // offsetParent 可以获取到有定位的父级元素
  var parent = el.offsetParent,
      offsetLeft = el.offsetLeft,
      offsetTop = el.offsetTop;

  // 循环加上父级的定位值
  while (parent) {
    offsetLeft += parent.offsetLeft;
    offsetTop += parent.offsetTop;
    parent = parent.offsetParent;
  }

  return {
    left: offsetLeft as number,
    top: offsetTop as number
  }
}

/**
 * 获取画板中点击的坐标点
 */
export function getClickCoordinate (
  pagePos: { left: number; top: number },
  clickPos: { x: number; y: number },
  itemSize: [number, number]
): IPoint {
  const { left, top } = pagePos;
  const { x, y } = clickPos;
  const [width, height] = itemSize;

  return [
    Math.floor((x - left) / width),
    Math.floor((y - top) / height)
  ];
}
