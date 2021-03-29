/*
 * @FilePath: \linkup-ts\src\lib\LinkUp.ts
 * @Description: LinkUp
 * @Author: humandetail
 * @Date: 2021-03-18 21:14:16
 * @LastEditors: humandetail
 * @LastEditTime: 2021-03-26 15:55:39
 */

import {
  ILevelItem,
  ILinkUpItem,
  IMahjongItem,
  IPoint
} from '../../types';

import { linkDetection } from './pathFinding';

import {
  deepClone,
  getCurrentLevelMahjong,
  shuffle
} from './utils';

export default class Linkup {
  private static Instance: Linkup = new Linkup();

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
    return this.initLinkUpItem(level);
  }

  /**
   * 根据 level 信息生成元素
   */
  initLinkUpItem (level: ILevelItem): ILinkUpItem[][] {
    // const { col, row } = this.level;
    const { col, row } = level;
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
      return this.initLinkUpItem(level);
    }

    return linkUpItems;

    // 发布订阅话题 - 游戏开始
    // setTimeout(() => {
    //   this.publish(topicTypes.START, linkUpItems);
    // }, 500)
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
  removeItems (...points: IPoint[]): {
    linkUpItems: ILinkUpItem[][];
    isFinished: boolean;
  } {
    points.forEach(([x, y]) => {
      this.linkUpItems[y][x][2] = undefined;
    });
    return {
      linkUpItems: this.linkUpItems,
      isFinished: this.isFinished()
    };
  }

  // 元素重排
  handleReset (): ILinkUpItem[][] {
    const linkUpItems = this.linkUpItems;
    const items = shuffle(linkUpItems.reduce((prev, item) => {
      prev = [...prev, ...item.filter((sub) => {
        return sub[2];
      })]

      return prev;
    }, []).map((i) => i[2]));
    
    const row = linkUpItems.length;
    let col: number;
    for (let i = 0; i < row; i++) {
      col = linkUpItems[i].length;
      for (let j = 0; j < col; j++) {
        if (linkUpItems[i][j][2]) {
          linkUpItems[i][j][2] = items.pop()!;
        }
      }
    }
    return linkUpItems;
  }

  // 提示 - 找出其中两个可以消除的点
  handleTip (): [IPoint, IPoint, ILinkUpItem[][]] | undefined {
    // 复制元素并降维
    const copyItems = deepClone(this.linkUpItems, []).flat() as ILinkUpItem[];
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
          return [
            [itemA[0], itemA[1]],
            [itemB[0], itemB[1]],
            this.linkUpItems
          ];
        }
      }
    }
  }

  isSameType (pointA: IPoint, pointB: IPoint): boolean {
    const [x1, y1] = pointA;
    const [x2, y2] = pointB;
    const linkUpItems = this.linkUpItems;
    const itemA = linkUpItems[y1][x1];
    const itemB = linkUpItems[y2][x2];
    if ((itemA[2] && itemB[2]) && (itemA[2].name === itemB[2].name)) {
      return true;
    }

    return false;
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
   * 选中的两个元素比较
   * @param { IPoint } firstClickPos - 第一个元素的坐标点
   * @param { IPoint } secondClickPos - 第二个元素的坐标点
   */
  onCompare (firstClickPos: IPoint, secondClickPos: IPoint): IPoint[] | undefined {
    const [Ax, Ay] = firstClickPos;
    const [Bx, By] = secondClickPos;
    const linkUpItems = this.linkUpItems;

    // 排除空点的情况
    if (!linkUpItems[Ay][Ax][2] || !linkUpItems[By][Bx][2]) {
      return;
    }

    // 1. 首先两种元素必须同款
    if (linkUpItems[Ay][Ax][2]!.name !== linkUpItems[By][Bx][2]!.name) {
      return;
    }

    // 处理相邻情况
    if ((Ax === Bx && Math.abs(Ay - By) === 1) || (Ay === By && Math.abs(Ax - Bx) === 1)) {
      // 相邻点连接成功
      return [firstClickPos, secondClickPos];
    }

    // 其它情况连接
    const ret = linkDetection(firstClickPos, secondClickPos, this.level.row, this.level.col, this.isEmptyItem.bind(this));

    if (!!ret) {
      return ret as IPoint[];
    } else {
      // 连接失败
      return;
    }
  }
}
