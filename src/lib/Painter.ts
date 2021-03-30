/*
 * @FilePath: \linkup-ts\src\lib\Painter.ts
 * @Description: Painter 图形绘制
 * @Author: humandetail
 * @Date: 2021-03-18 23:46:55
 * @LastEditors: humandetail
 * @LastEditTime: 2021-03-30 15:24:19
 */

import { ILevelItem, ILinkUpItem, IPoint } from '../../types';
import { getElemDocPosition, getPagePos, getClickCoordinate } from './utils';
import { singleSize } from '../config/mahjong';

// 方向
enum Direction {
  UP = 0,
  RIGHT,
  DOWN,
  LEFT,
  CENTER
}

export default class Painter {
  private static Instance: Painter = new Painter();

  public mahjongPicSize: [number, number] = singleSize;

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

  // 第一次点击的元素位置
  protected firstClickPos?: IPoint;
  // 第二次点击的元素
  protected secondClickPos?: IPoint;

  // 路径配置
  protected lineWidth: number = 2;
  protected defaultSpeed: number = 16; // requestAnimationFrame 每16ms执行一行
  protected maxDuration: number = 300; // 期望在 1000ms 执行完线路绘制

  private constructor () {}

  public static getInstance (): Painter {
    return this.Instance;
  }

  async init (el: HTMLCanvasElement) {
    this.canvas = el;
    this.ctx = this.canvas.getContext('2d')!;
    // 加载素材
    await this.initMaterial();
  }

  /**
   * 初始化加载动画
   */
  initLoadingAnimation (fillStyle: string = '#fff', font: string = '40px sans-serif') {
    const ctx = this.ctx;
    // 先清理之前可能会存在的动画
    this.clearLoadingAnimation();

    ctx.fillStyle = fillStyle;
    ctx.font = font;

    let n = 0;

    this.loadingTimer = setInterval(() => {
      this.clear();
      ctx.fillText('玩命加载中' + '.'.repeat(n % 4), 10, 50);
      n ++;
    }, 200);
  }

  // 清理 loading 动画
  clearLoadingAnimation () {
    if (this.loadingTimer) {
      clearInterval(this.loadingTimer);
      this.loadingTimer = undefined;
    }
  }

  /**
   * 切换游戏等级
   * @param level 
   */
  changeLevel (level: ILevelItem) {
    const [width, height] = this.mahjongPicSize;
    const { col, row } = level;
    // 设置 canvas 容器的宽高
    this.canvas.width = col * width;
    this.canvas.height = row * height;
    // 获取画板在页面中的位置
    this.getCanvasDocPos();
  }

  /**
   * 初始化 - 加载素材
   */
  async initMaterial () {
    // 加载底图
    this.material = await this.loadMaterial(require('../assets/img/mahjong.png'))
      .catch(() => {
        alert('素材加载失败，请刷新页面重试');
        throw new Error('素材-[底图] 加载失败.');
      });
    // 加载选中框
    this.checkbox = await this.loadMaterial(require('../assets/img/checkbox.png'))
      .catch(() => {
        alert('素材加载失败，请刷新页面重试');
        throw new Error('素材-[选中框] 加载失败.');
      });
    // 加载错误选中框1
    this.errorCheckbox1 = await this.loadMaterial(require('../assets/img/checkbox-error-1.png'))
      .catch(() => {
        alert('素材加载失败，请刷新页面重试');
        throw new Error('素材-[错误选中框1] 加载失败.');
      });
    // 加载错误选中框2
    this.errorCheckbox2 = await this.loadMaterial(require('../assets/img/checkbox-error-2.png'))
      .catch(() => {
        alert('素材加载失败，请刷新页面重试');
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

  /**
   * 绘制连接线
   * @param pointA - A 点
   * @param pointB - B 点
   * @returns 
   */
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
    // 动画完毕后清空点击数据
    this.clearClickPos();
  }

  /**
   * 绘制游戏完成提示
   * @param { string } duration - 游戏耗时
   */
  drawGameOverAnimation (duration: string) {
    this.clear();

    const ctx = this.ctx;

    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';

    ctx.fillText('恭喜，全部解开了。', 10, 50);
    ctx.fillText(`游戏用时：【${duration}】`, 10, 80);
  }

  /**
   * 获取从第一个点移动到第二个点的方向
   * 两个点必须在同一个方向
   */
  getMoveDirection (pointA: IPoint, pointB: IPoint): Direction {
    const [x1, y1] = pointA;
    const [x2, y2] = pointB;

    if (x1 === x2) {
      return y1 > y2 ? Direction.UP : Direction.DOWN;
    }

    if (y1 === y2) {
      return x1 > x2 ? Direction.LEFT : Direction.RIGHT;
    }

    // 未知情况
    return Direction.CENTER;
  }

  /**
   * 计算连接坐标点
   */
  calculateConnectPoints (points: IPoint[]): IPoint[] {
    const [width, height] = this.mahjongPicSize;
    const len = points.length;

    if (len < 2) return points;

    points = points.map((point) => {
      return [
        point[0] * width,
        point[1] * height
      ];
    });

    let point: IPoint;
    let dir: Direction = Direction.CENTER;

    let temp: IPoint[] = [];

    for (let i = 0; i < len; i++) {
      point = points[i];

      if (i === 0) {
        // 第一个点和下一个点进行比对
        dir = this.getMoveDirection(point, points[i + 1]);
      } else if (i === len - 1) {
        // 最后一个点和上一个点进行比对
        dir = this.getMoveDirection(point, points[i - 1]);
      } else {
        dir = Direction.CENTER;
      }

      switch (dir) {
        case Direction.UP:
          // 向上，取center top 点
          temp.push([
            point[0] + width / 2,
            point[1]
          ]);
          break;
        case Direction.RIGHT:
          // 向右，取right center
          temp.push([
            point[0] + width,
            point[1] + height / 2
          ]);
          break;
        case Direction.DOWN:
          // 向下，取center bottom
          temp.push([
            point[0] + width / 2,
            point[1] + height
          ]);
          break;
        case Direction.LEFT:
          // 向左，取left center
          temp.push([
            point[0],
            point[1] + height / 2
          ]);
          break;
        default:
          // 取center center
          temp.push([
            point[0] + width / 2,
            point[1] + height / 2
          ]);
          break;
      }
    }

    const tempLen = temp.length;

    let x1: number,
      y1: number,
      x2: number,
      y2: number;

    const scatters: IPoint[] = [];

    for (let i = 1; i < tempLen; i++) {
      ([x1, y1] = temp[i - 1]);
      ([x2, y2] = temp[i]);

      if (x1 === x2) {
        if (y1 > y2) {
          for (let j = y1; j >= y2; j--) {
            scatters.push([x1, j]);
          }
        } else {
          for (let j = y1; j <= y2; j++) {
            scatters.push([x1, j]);
          }
        }
      }

      if (y1 === y2) {
        if (x1 > x2) {
          for (let j = x1; j >= x2; j--) {
            scatters.push([j, y1]);
          }
        } else {
          for (let j = x1; j <= x2; j++) {
            scatters.push([j, y1]);
          }
        }
      }
    }

    return scatters;
  }

  /**
   * 连接动画
   * @param points 
   * @returns 
   */
  connect (points: IPoint[]): Promise<void> {
    const calcPoints = this.calculateConnectPoints(points);
    return new Promise((resolve, reject) => {
      const len = calcPoints.length;

      if (len === 2) {
        // 相同的坐标点
        if (points[0][0] === points[1][0] && points[0][1] === points[1][1]) {
          resolve();
        }
      }

      const defaultSpeed = this.defaultSpeed;
      const maxDuration = this.maxDuration;

      let i = Math.floor(len * defaultSpeed / maxDuration);
      if (i < 1) {
        i = 1;
      }

      if (len <= 0) {
        // 动画完毕后清空点击数据
        this.clearClickPos();
        resolve();
      }

      let temp: IPoint[] = [],
        t = 0,
        aniId: number | null = null;

      const ani = () => {
        if ((t >= len) && aniId) {
          cancelAnimationFrame(aniId);
          // 动画完毕后清空点击数据
          this.clearClickPos();
          return resolve();
        }
        for (let j = i; j > 0; j--) {
          temp.push(calcPoints[t]);
          t++;
          if (t >= len) {
            break;
          }
        }
        this.drawConnectPoints(temp);
        aniId = requestAnimationFrame(ani);
      }

      ani();
    });
  }

  drawConnectPoints (points: IPoint[]) {
    const ctx = this.ctx;
    const lineWidth = this.lineWidth;
    this.restoreSnapshot();
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.fillStyle = '#fff';
      ctx.shadowColor = 'orange';
      ctx.shadowBlur = 5 + i;
      points.forEach(([x, y]) => {
        ctx.fillRect(x - lineWidth / 2, y - lineWidth / 2, lineWidth, lineWidth);
      });
      ctx.restore();
    }
  }

  /**
   * 连接失败处理
   */
  async handleConnectFail () {
    await this.drawErrorCheckbox();
    this.clearClickPos();
    this.drawCheckbox();
  }

  /**
   * 提示动画绘制
   */
  drawTipAnimation (pointA: IPoint, pointB: IPoint, linkUpItems: ILinkUpItem[][]): Promise<void> {
    return new Promise((resolve, reject) => {
      this.clearClickPos();
      // 清空画板
      this.clear();
      
      const ctx = this.ctx;
      const len = linkUpItems.length;
      let rowItem: ILinkUpItem[];
  
      let itemA: ILinkUpItem | undefined = undefined;
      let itemB: ILinkUpItem | undefined = undefined;
  
      for (let y = 0; y < len; y++) {
        rowItem = linkUpItems[y];
        for(let x = 0; x < rowItem.length; x++) {
          if (pointA[0] === x && pointA[1] === y) {
            itemA = rowItem[x];
            continue;
          }
          if (pointB[0] === x && pointB[1] === y) {
            itemB = rowItem[x];
            continue;
          }
          this.drawItem(rowItem[x]);
        }
      }
  
      if (!itemA || !itemB || !itemA[2] || !itemB[2]) {
        // 找不到需要提示的元素，游戏出错
        throw new Error('游戏出错');
      }
  
      // 获取快照
      const ImageData: ImageData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  
      // 单独绘制两点提示点的动画
      let timer: NodeJS.Timeout;
      const [width, height] = this.mahjongPicSize;
      const img = this.material;
      let [Asx, Asy] = itemA[2].pos;
      let [Bsx, Bsy] = itemB[2].pos;
      Asx *= width;
      Bsx *= width;
      Asy *= height;
      Bsy *= height;
  
      let n = 2;
  
      timer = setInterval(() => {
        if (n <= 0) {
          clearInterval(timer);
          this.updateElement(linkUpItems);
          resolve();
        }
  
        if (n % 2 === 0) {
          ctx.drawImage(img, Asx, Asy, width, height, pointA[0] * width, pointA[1] * height, width, height);
          ctx.drawImage(img, Bsx, Bsy, width, height, pointB[0] * width, pointB[1] * height, width, height);
        } else {
          ctx.putImageData(ImageData, 0, 0);
        }
  
        n --;
      }, 250);
    });
  }

  clearClickPos () {
    this.firstClickPos = undefined;
    this.secondClickPos = undefined;
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
    const rect = this.canvas.getBoundingClientRect();
    this.canvasDocPos = {
      left: rect.left,
      top: rect.top
    };

    return this.canvasDocPos;
  }

  /**
   * 画板点击事件处理
   */
  handleClick (event: MouseEvent): IPoint {
    const canvasDocPos = this.canvasDocPos;

    // 获取当前点击的位置
    const currentClick = getPagePos(event);

    // 获取计算出来的坐标点
    return getClickCoordinate(canvasDocPos, currentClick, this.mahjongPicSize);
  }

  /**
   * 设置点击位置信息
   */
  setClickPos (pos: IPoint): IPoint[] {
    if (!this.firstClickPos) {
      this.firstClickPos = pos;
      this.drawCheckbox();
      return [pos];
    }

    if (!this.secondClickPos) {
      if (pos[0] === this.firstClickPos[0] && pos[1] === this.firstClickPos[1]) {
        this.firstClickPos = undefined;
        this.drawCheckbox();
        return [];
      } else {
        // 第二次选中的元素
        this.secondClickPos = pos;
        this.drawCheckbox();
        return [this.firstClickPos, this.secondClickPos];
      }
    }

    return [];
  }

  /**
   * 更新元素
   * @param linkUpItems - 元素集合
   */
  updateElement (linkUpItems: ILinkUpItem[][]) {
    const len = linkUpItems.length;
    let rowItem: ILinkUpItem[];

    // 清空画板
    this.clear();

    for (let i = 0; i < len; i++) {
      rowItem = linkUpItems[i];
      for(let j = 0; j < rowItem.length; j++) {
        this.drawItem(rowItem[j]);
      }
    }
    // 保存快照
    this.saveSnapshot();
  }
}
