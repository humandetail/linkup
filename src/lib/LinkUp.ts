/*
 * @FilePath: \linkup-ts\src\lib\LinkUp.ts
 * @Description: LinkUp
 * @Author: humandetail
 * @Date: 2021-03-18 21:14:16
 * @LastEditors: humandetail
 * @LastEditTime: 2021-03-23 19:39:29
 */

import {
  ITopicsWrapper,
  PublishSubscribers,
  ILevelItem,
  ILinkUpItem,
  IMahjongItem,
  IPoint
} from '../../types';
import TopicTypes from '../config/topicTypes';

import topicTypes from '../config/topicTypes';
import { linkDetection } from './pathFinding';

import {
  deepClone,
  getCurrentLevelMahjong
} from './utils';

export default class Linkup implements PublishSubscribers {
  private static Instance: Linkup = new Linkup();

  // 订阅集合
  private topics: ITopicsWrapper = {};

  // 游戏级别
  protected level!: ILevelItem;

  // 游戏元素集合
  // [
  //   [[1, 1,], [2, 1,], [3, 1,]],
  //   [[1, 2,], [2, 2,], [3, 2,]],
  //   [[1, 3,], [2, 3,], [3, 3,]]
  // ]
  protected linkUpItems: ILinkUpItem[][]  = [];

  private constructor () {}

  public static getInstance (): Linkup {
    return this.Instance;
  }

  /**
   * 初始化
   */
  init (level: ILevelItem) {
    this.level = level;
    // 生成元素
    this.initLinkUpItem();
  }

  /**
   * 根据 level 信息生成元素
   */
  initLinkUpItem (): void {
    const { col, row } = this.level;
    // 获取当前等级所需的元素样式
    const mahjongs = getCurrentLevelMahjong(this.level);

    let linkUpItems: ILinkUpItem[][] = [];

    for (let y = 0; y < row; y++) {
      // 添加行区
      linkUpItems.push([]);
      for (let x = 0; x < col; x++) {
        // 添加每行的元素
        linkUpItems[y].push([x, y, mahjongs.pop()]);
      }
    }

    this.linkUpItems = linkUpItems;

    // 复制元素进行全解测试
    const copyItems = deepClone(linkUpItems, []).flat() as ILinkUpItem[];
    if (!this.testCompleteSolution(copyItems)) {
      return this.initLinkUpItem();
    }

    // 发布订阅话题 - 游戏开始
    setTimeout(() => {
      this.publish(topicTypes.START, linkUpItems);
    }, 500)
    // this.publish(topicTypes.START, linkUpItems);
  }

  /**
   * 全解测试
   * 至少保证游戏有一种以上的解法
   * @param { ILinkUpItem } copyItems - 测试数据
   * @param { number } removeNumber - 空白元素总数
   */
  testCompleteSolution (copyItems: ILinkUpItem[], removeNumber: number = 0): boolean {
    if (!this.linkUpItems) {
      return false;
    }

    // 复制一份数据用于测试
    // 并且对数组进行降维
    const len = copyItems.length;

    let itemA!: ILinkUpItem;
    let itemB!: ILinkUpItem;

    function isEmpty (point: IPoint): boolean {
      const item = copyItems.find((item) => {
        return item[0] === point[0] && item[1] === point[1]
      });

      if (!item) {
        return true;
      }

      return !item[2];
    }

    for (let i = 0; i < len; i++) {
      itemA = copyItems[i];
      // 跳过空元素
      if (!itemA[2]) {
        continue;
      }

      for (let j = i + 1; j < len; j++) {
        itemB = copyItems[j];
        // 跳过空元素
        if (!itemB[2]) {
          continue;
        }

        //  非相同元素 跳过
        if (itemA[2].name !== itemB[2].name) {
          continue;
        }

        if (
          // 垂直相邻元素
          (itemA[0] === itemB[0] && Math.abs(itemA[1] - itemB[1]) === 1) ||
          // 水平相邻元素
          (itemA[1] === itemB[1] && Math.abs(itemA[0] - itemB[0]) === 1) ||
          // 其它
          !!linkDetection([itemA[0], itemA[1]], [itemB[0], itemB[1]], this.level.row, this.level.col, isEmpty)
        ) {
          itemA[2] = undefined;
          itemB[2] = undefined;
          break;
        }
      }
    }

    let flag: number = 0;

    flag = copyItems.reduce((prev, item) => {
      return prev + (!item[2] ? 1 : 0);
    }, 0);

    // const flag = copyItems.every((item) => !item[2]);
    
    if (flag === removeNumber) {
      // 递归出口 - 全解测试失败
      return false;
    }

    if (flag === this.level.row * this.level.col) {
      // 递归出口 - 全解测试成功
      return true;
    }

    if (flag !== 0) {
      return this.testCompleteSolution(copyItems, flag);
    }

    // 全解测试失败
    return false;
  }

  /**
   * 检测某个坐标点上的元素是否为空元素
   * @param point 坐标点
   */
  isEmptyItem (point: IPoint): boolean {
    return !this.linkUpItems[point[1]][point[0]][2];
  }

  /**
   * 移除元素
   */
  removeItems (...points: IPoint[]) {
    points.forEach(([x, y]) => {
      this.linkUpItems[y][x][2] = undefined;
    });
  }

  /**
   * 使用道具
   * @param { string } prop - 道具名称
   */
  useProp (prop: string) {
    switch (prop) {
      case 'tip':
        break;
      case 'reset':
        break;
      case 'bomb':
        break;
      default:
        break;
    }
  }

  /**
   * 检测游戏是否已经完全解开
   */
  isFinished (): boolean {
    const linkUpItems = this.linkUpItems;
    const flag = linkUpItems.every((sub) => {
      return sub.every((item) => {
        return !item[2];
      });
    });
    // console.log('游戏是否已经完全解开：', flag);
    return flag;
  }

  /**
   * 订阅回调 - 选择元素
   * @param point 
   * @param isFirst 
   */
  pickElement (point: IPoint, isFirst: boolean) {
    this.publish(TopicTypes.ELEMENT_IS_EMPTY, this.isEmptyItem(point), point, isFirst);
  }

  /**
   * 订阅回调 - 元素比较
   */
  onCompare (firstClickPos: IPoint, secondClickPos: IPoint): void {
    const [Ax, Ay] = firstClickPos;
    const [Bx, By] = secondClickPos;
    const linkUpItems = this.linkUpItems;

    // 排除空点的情况
    if (!linkUpItems[Ay][Ax][2] || !linkUpItems[By][Bx][2]) {
      return;
    }

    // 1. 首先两种元素必须同款
    if (linkUpItems[Ay][Ax][2]!.name !== linkUpItems[By][Bx][2]!.name) {
      // 非同款元素 连接失败
      this.publish(TopicTypes.CONNECT_FAIL);
      return;
    }

    // 处理相邻情况
    if ((Ax === Bx && Math.abs(Ay - By) === 1) || (Ay === By && Math.abs(Ax - Bx) === 1)) {
      // 相邻点连接成功
      this.publish(TopicTypes.CONNECT_SUCCESS, firstClickPos, secondClickPos);
      return;
    }

    // 其它情况连接
    const ret = linkDetection(firstClickPos, secondClickPos, this.level.row, this.level.col, this.isEmptyItem.bind(this));

    if (!!ret) {
      // 连接成功
      this.publish(TopicTypes.CONNECT_SUCCESS, ...ret as IPoint[]);
    } else {
      // 连接失败
      this.publish(TopicTypes.CONNECT_FAIL);
    }
  }

  /**
   * 订阅回调 - 连接动画结束
   */
  connectFinished (firstClickPos: IPoint, secondClickPos: IPoint) {
    this.removeItems(firstClickPos, secondClickPos);
    this.publish(TopicTypes.UPDATED_ELEMENT, this.linkUpItems);
    // 检测游戏完成状态
    const isFinished = this.isFinished();
    if (isFinished) {
      this.publish(TopicTypes.GAME_OVER);
    }
  }

  /**
   * 订阅
   * @param topic 订阅主题
   * @param cb 回调
   */
  subscribe (topic: TopicTypes, cb: Function) {
    if (this.topics[topic]) {
      this.topics[topic].push(cb);
    } else {
      this.topics[topic] = [cb];
    }
  }

  /**
   * 取消订阅
   * @param topic - 订阅主题
   * @param cb - 回调
   */
  unSubscribe (topic: TopicTypes, cb: Function) {
    if (this.topics[topic]) {
      // 移除相关的监听器
      this.topics[topic] = this.topics[topic].filter((listener: Function) => {
        return cb !== listener;
      });
    }
  }

  /**
   * 发布
   * @param topic - 订阅主题
   * @param args - 参数集合
   */
  publish (topic: TopicTypes, ...args: any[]) {
    if (this.topics[topic]) {
      this.topics[topic].forEach((listener) => {
        listener.call(this, ...args);
      });
    }
  }
}