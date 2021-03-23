/*
 * @FilePath: \linkup-ts\src\lib\Painter.ts
 * @Description: Painter 图形绘制
 * @Author: humandetail
 * @Date: 2021-03-18 23:46:55
 * @LastEditors: humandetail
 * @LastEditTime: 2021-03-22 23:47:00
 */

import { ILevelItem, ILinkUpItem, IMahjongItem, IPoint, ITopicsWrapper, PublishSubscribers } from '../../types';
import TopicTypes from '../config/topicTypes';
import { getElemDocPosition, getPagePos, getClickCoordinate, sleep } from './utils';

enum GameStatus {
  // 加载状态
  loading,
  // 正常游戏状态
  normal,
  // 执行动画
  animation,
  // 结束状态
  ended
}

export default class Painter implements PublishSubscribers {
  public static clickEvent?: (event: MouseEvent) => void;
  private static Instance: Painter = new Painter();
  
  // 订阅集合
  private topics: ITopicsWrapper = {};

  public mahjongPicSize: [number, number] = [60, 75];

  // 游戏级别
  protected level!: ILevelItem;

  protected loadingTimer?: NodeJS.Timeout;

  // canvas 容器
  protected canvas!: HTMLCanvasElement;
  // canvas 上下文
  protected ctx!: CanvasRenderingContext2D;

  // 快照
  protected snapshot?: ImageData;

  // 素材 - 元素底图
  protected material!: HTMLImageElement;
  // 素材 - 选中框
  protected checkbox!: HTMLImageElement;
  // 素材 - 错误选中框1
  protected errorCheckbox1!: HTMLImageElement;
  // 素材 - 错误选中框2
  protected errorCheckbox2!: HTMLImageElement;

  // canvas在页面中的位置
  public canvasDocPos!: { left: number; top: number; };

  // 游戏状态
  protected gameStatus: GameStatus = GameStatus.loading;
  // 第一次点击的元素位置
  protected firstClickPos?: IPoint;
  // 第二次点击的元素
  protected secondClickPos?: IPoint;

  // 游戏开始时间
  protected startTime!: Date;

  private constructor () {
  }

  public static getInstance (): Painter {
    return this.Instance;
  }

  async init (level: ILevelItem, el: HTMLCanvasElement) {
    this.level = level;
    this.canvas = el;

    this.ctx = this.canvas.getContext('2d')!;

    this.gameStatus = GameStatus.loading;

    const [width, height] = this.mahjongPicSize;
    const { col, row } = this.level;
    // 设置 canvas 容器的宽高
    this.canvas.width = col * width;
    this.canvas.height = row * height;
    // 初始化加载动画
    this.initLoadingAnimation();
    // 获取画板在页面中的位置
    this.getCanvasDocPos();
    // 加载素材
    await this.initMaterial();

    // 事件监听
    if (Painter.clickEvent) {
      this.canvas.removeEventListener('click', Painter.clickEvent, false);
    }
    Painter.clickEvent = this.handleClick.bind(this);
    this.canvas.addEventListener('click', Painter.clickEvent, false);
  }

  /**
   * 初始化加载动画
   */
  initLoadingAnimation () {
    const ctx = this.ctx;

    if (this.loadingTimer) {
      clearInterval(this.loadingTimer);
      this.loadingTimer = undefined;
    }

    ctx.fillStyle = '#fff';
    ctx.font = '40px sans-serif';

    let n = 0;

    this.loadingTimer = setInterval(() => {
      this.clear();
      ctx.fillText('玩命加载中' + '.'.repeat(n % 4), 10, 50);
      n ++;
    }, 200);
  }

  /**
   * 设置游戏状态为正常游戏
   */
  setGameStatusNormal () {
    this.firstClickPos = undefined;
    this.secondClickPos = undefined;
    this.gameStatus = GameStatus.normal;
  }

  /**
   * 初始化 - 加载素材
   */
  async initMaterial () {
    // 加载底图
    this.material = await this.loadMaterial(require('../assets/img/mahjong.png'))
      .catch(() => {
        throw new Error('素材-[底图] 加载失败.');
      });
    // 加载选中框
    this.checkbox = await this.loadMaterial(require('../assets/img/checkbox.png'))
      .catch(() => {
        throw new Error('素材-[选中框] 加载失败.');
      });
    // 加载错误选中框1
    this.errorCheckbox1 = await this.loadMaterial(require('../assets/img/checkbox-error-1.png'))
      .catch(() => {
        throw new Error('素材-[错误选中框1] 加载失败.');
      });
    // 加载错误选中框2
    this.errorCheckbox2 = await this.loadMaterial(require('../assets/img/checkbox-error-2.png'))
      .catch(() => {
        throw new Error('素材-[错误选中框2] 加载失败.');
      });
  }

  /**
   * 加载素材
   * @param imgPath 图片路径
   * @returns 
   */
  loadMaterial (imgPath: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        resolve(img);
      };
      img.onerror = () => {
        reject();
      };

      img.src = imgPath;
    });
  }

  /**
   * 绘制图形
   * @param linkUpItem 元素
   * @returns 
   */
  async drawItem (linkUpItem: ILinkUpItem) {
    const ctx = this.ctx;
    const [width, height] = this.mahjongPicSize;
    const [x, y, mahjongItem] = linkUpItem;
    const img = this.material;

    if (!mahjongItem) {
      return;
    }

    const [sx, sy] = mahjongItem.pos;

    ctx.drawImage(img, sx * width, sy * height, width, height, x * width, y * height, width, height);
  }

  /**
   * 绘制选中框
   */
  async drawCheckbox () {
    const firstClickPos = this.firstClickPos;
    const secondClickPos = this.secondClickPos;

    const ctx = this.ctx;
    const [width, height] = this.mahjongPicSize;

    const checkbox = this.checkbox;

    // 先恢复画板
    this.restoreSnapshot();
    if (firstClickPos) {
      // 绘制第一个选框
      ctx.drawImage(checkbox, 0, 0, width, height, firstClickPos[0] * width, firstClickPos[1] * height, width, height);
    }
    if (secondClickPos) {
      // 绘制第二个选框
      ctx.drawImage(checkbox, 0, 0, width, height, secondClickPos[0] * width, secondClickPos[1] * height, width, height);
    }
  }

  /**
   * 绘制错误选中框
   */
  drawErrorCheckbox (duration: number = 200, n: number = 3): Promise<void> {
    return new Promise((resolve, reject) => {
      const firstClickPos = this.firstClickPos;
      const secondClickPos = this.secondClickPos;
  
      if (!firstClickPos || !secondClickPos) {
        return reject();
      }
  
      const errorCheckbox1 = this.errorCheckbox1;
      const errorCheckbox2 = this.errorCheckbox2;
  
      const ctx = this.ctx;
      const [width, height] = this.mahjongPicSize;
  
      const x1 = firstClickPos[0] * width;
      const y1 = firstClickPos[1] * height;
      const x2 = secondClickPos[0] * width;
      const y2 = secondClickPos[1] * height;
  
      let timer: NodeJS.Timeout | null = null;
      let img!: HTMLImageElement;
  
      timer = setInterval(() => {
        img = n % 2 === 0 ? errorCheckbox1 : errorCheckbox2;
        ctx.drawImage(img, 0, 0, width, height, x1, y1, width, height);
        ctx.drawImage(img, 0, 0, width, height, x2, y2, width, height);
        n--;
        if (n <= 0) {
          clearInterval(timer!);
          timer = null;
          resolve();
        }
      }, duration);
    });
  }

  drawLine (pointA: IPoint, pointB: IPoint): Promise<void> {
    return new Promise((resolve, reject) => {
      let [x1, y1] = pointA,
        [x2, y2] = pointB;

      const [w, h] = this.mahjongPicSize;

      const ctx = this.ctx;

      x1 = x1 * w + w / 2;
      x2 = x2 * w + w / 2
      y1 = y1 * h + h / 2;
      y2 = y2 * h + h / 2;

      let changeAxis = x1 === x2 ? 'Y' : 'X'; // 沿着哪条轴来画

      const direction = (changeAxis === 'Y' ? (y1 - y2) : (x1 - x2)) > 0 ? 'minus' : 'plus';
      const speed = Math.abs(changeAxis === 'Y' ? (y1 - y2) : (x1 - x2)) / 10;

      let timer: NodeJS.Timeout | null  = null;

      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'red';
      ctx.beginPath();
      
      timer = setInterval(() => {
        // 计算坐标值
        let newX,
          newY;

        if (changeAxis === 'Y') {
          newX = x1;
          newY = direction === 'minus' ? y1 - speed : y1 + speed;
        } else {
          newX = direction === 'minus' ? x1 - speed : x1 + speed;
          newY = y1;
        }
        ctx.moveTo(x1, y1);
        ctx.lineTo(newX, newY);
        ctx.stroke();
        x1 = newX;
        y1 = newY;
        if ((changeAxis === 'Y' && newY === y2) || (changeAxis === 'X' && newX === x2)) {
          clearInterval(timer!);
          resolve();
        }
      }, 12);
      ctx.closePath();
    });
  }

  /**
   * 绘制连接动画
   */
  async drawLineAnimation (...points: IPoint[]) {
    const len = points.length;

    for (let i = 1; i < len; i++) {
      await this.drawLine(points[i - 1], points[i]);
    }
  }

  /**
   * 绘制游戏完成提示
   */
  drawGameOverAnimation () {
    this.clear();

    const seconds = Math.ceil((new Date().getTime() - this.startTime.getTime()) / 1000);
    const mm = Math.floor(seconds / 60);
    const ss = seconds % 60;

    const ctx = this.ctx;

    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';

    ctx.fillText('恭喜，全部解开了。', 10, 50);
    ctx.fillText(`游戏用时：【${mm}分${ss}秒】`, 10, 80);
  }

  /**
   * 清空画板
   */
  clear () {
    const {
      width,
      height
    } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);
  }

  /**
   * 保存快照 
   */
  saveSnapshot () {
    this.snapshot = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * 恢复快照
   */
  restoreSnapshot () {
    const snapshot = this.snapshot;
    if (!snapshot) {
      return;
    }

    this.clear();
    this.ctx.putImageData(snapshot, 0, 0);
  }

  /**
   * 获取canvas画板在页面中的位置
   */
  getCanvasDocPos () {
    this.canvasDocPos = getElemDocPosition(this.canvas);
    return this.canvasDocPos;
  }

  /**
   * 画板点击事件
   */
  handleClick (event: MouseEvent) {
    if (this.gameStatus !== GameStatus.normal) {
      // 非正常游戏状态，不处理点击事件
      return;
    }
    const canvasDocPos = this.canvasDocPos;
    const firstClickPos = this.firstClickPos;
    const secondClickPos = this.secondClickPos;

    // 获取当前点击的位置
    const currentClick = getPagePos(event);

    // 获取计算出来的坐标点
    const coordinate = getClickCoordinate(canvasDocPos, currentClick, this.mahjongPicSize);

    if (!firstClickPos) {
      // 第一次选中的元素
      this.publish(TopicTypes.PICK_ELEMENT, coordinate, true);
    } else if (!secondClickPos) {
      // 当前点击位置 和 第一次选中的元素相同
      // 清除第一次选中
      if (coordinate[0] === firstClickPos[0] && coordinate[1] === firstClickPos[1]) {
        this.firstClickPos = undefined;
        this.restoreSnapshot();
      } else {
        // 第二次选中的元素
        this.publish(TopicTypes.PICK_ELEMENT, coordinate, false);
      }
    }
  }

  /**
   * 订阅回调 - 元素准备完毕，可以开启游戏
   */
  start (linkUpItems: ILinkUpItem[][]) {
    if (this.loadingTimer) {
      clearInterval(this.loadingTimer);
      this.loadingTimer = undefined;
    }
    this.setGameStatusNormal();
    this.updateElement(linkUpItems);
    this.startTime = new Date(); // 记录开始时间
  }

  /**
   * 订阅回调 - 确认选中的元素是否为空元素
   */
  isEmptyElement (isEmpty: boolean, point: IPoint, isFirst: boolean) {
    if (isFirst) {
      this.firstClickPos = isEmpty
        ? undefined
        : point;

      this.drawCheckbox();
    } else {
      if (isEmpty) {
        this.setGameStatusNormal(); // 重置所有选中框
        this.restoreSnapshot();
      } else {
        this.secondClickPos = point;
        this.drawCheckbox();

        // 选中了两个元素，进行比较
        this.gameStatus = GameStatus.animation;
        // 发布订阅话题 - 元素比较
        this.publish(TopicTypes.COMPARE_ELEMENT, this.firstClickPos, this.secondClickPos);
      }
    }
  }

  /**
   * 订阅回调 - 更新元素
   * @param linkUpItems - 元素集合
   */
  updateElement (linkUpItems: ILinkUpItem[][]) {
    const len = linkUpItems.length;
    let rowItem: ILinkUpItem[];

    // 清空画板
    this.clear();
    this.setGameStatusNormal();

    for (let i = 0; i < len; i++) {
      rowItem = linkUpItems[i];
      for(let j = 0; j < rowItem.length; j++) {
        this.drawItem(rowItem[j]);
      }
    }
    // 保存快照
    this.saveSnapshot();
  }

  /**
   * 订阅回调 - 元素连接失败
   */
  connectFail () {
    this.drawErrorCheckbox()
      .then(() => {
        this.setGameStatusNormal();
        this.restoreSnapshot();
        // this.publish(TopicTypes.CONNECT_FINISHED);
      })
      .catch(() => {
        throw new Error('程序错误');
      });
  }

  /**
   * 订阅回调 - 元素连接成功
   */
  async connectSuccess (...points: IPoint[]) {
    this.gameStatus = GameStatus.animation;
    await this.drawLineAnimation(...points)
      .catch(() => {
        throw new Error('程序错误');
      });

    this.gameStatus = GameStatus.normal;

    this.publish(TopicTypes.CONNECT_FINISHED, this.firstClickPos, this.secondClickPos);
  }

  /**
   * 订阅回调 - 游戏结束
   */
  gameOver () {
    this.gameStatus = GameStatus.ended;
    this.drawGameOverAnimation();
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
