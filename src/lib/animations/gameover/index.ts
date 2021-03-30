/*
 * @FilePath: \linkup-ts\src\lib\animations\gameover\index.ts
 * @Description: 游戏结束动画入口
 * @Author: humandetail
 * @Date: 2021-03-29 14:01:08
 * @LastEditors: humandetail
 * @LastEditTime: 2021-03-29 16:56:07
 */

import Rocket from './Rocket';
import Shard from './Shard';
import { IOptions, IOptionsParam, IPoint } from './typings';

export default class GameOver {
  protected element: HTMLElement;
  // 需要三个canvas
  // 用于绘制文本，获取散点
  protected c1: HTMLCanvasElement;
  // 用于绘制动画
  protected c2: HTMLCanvasElement;
  // 用于绘制阴影
  protected c3: HTMLCanvasElement;
  protected ctx1: CanvasRenderingContext2D;
  protected ctx2: CanvasRenderingContext2D;
  protected ctx3: CanvasRenderingContext2D;

  // 火箭
  protected rockets: Rocket[] = [];
  // 碎片
  protected shards: Shard[] = [];
  // 文字目标点集合
  protected targets: IPoint[] = [];

  // 初始配置信息
  private _opts: IOptions = {
    // 失真度
    fidelity: 3,
    // 文字大小
    fontSize: 100,
    // 文本粗细
    fontWeight: 900,
    // 文本颜色
    color: '#fff',
    // 阴影颜色
    shadowColor: '#ddd',
    // 阴影模糊度
    shadowBlur: 25,
    // 文本
    text: 'GAME OVER！',
  }
  // 文本宽度
  protected textWidth: number = 99999999;

  // 循环计数器
  protected counter: number = 0;
  // 画板尺寸
  private BOARD_SIZE: [number, number] = [480, 600];

  // requestAnimationFrame 的 id
  public aniId: number | null = null;

  constructor (el: HTMLElement | string, opt: IOptionsParam = {}) {
    // 合并配置信息
    Object.assign(this._opts, opt);

    const element = typeof el === 'string' ? document.querySelector(el) : el;

    if (!element) {
      throw new Error('动画初始化失败');
    }

    this.element = element as HTMLElement;
    const rect = element.getBoundingClientRect();
    // 获取画板最大的宽高
    this.BOARD_SIZE = [rect.width, rect.height];

    const c1 = document.createElement('canvas');
    const c2 = document.createElement('canvas');
    const c3 = document.createElement('canvas');

    element.appendChild(c1);
    element.appendChild(c2);
    element.appendChild(c3);

    this.c1 = c1;
    this.ctx1 = c1.getContext('2d')!;
    c1.style.opacity = '0';

    this.c2 = c2;
    this.ctx2 = c2.getContext('2d')!;

    this.c3 = c3;
    this.ctx3 = c3.getContext('2d')!;

    this.init();
  }

  protected init (): GameOver {
    this.initC1();
    this.initTargets();
    this.initC2();
    this.initC3();
    return this;
  }

  /**
   * 初始化 c1 画板
   */
  protected initC1 () {
    const [width] = this.BOARD_SIZE;
    const ctx = this.ctx1;
    // 设置 c1 画板的填充颜色
    ctx.fillStyle = '#000';

    while (this.textWidth > width) {
      ctx.font = `${this._opts.fontWeight} ${this._opts.fontSize--}px Arial`;
      // 获取文本总宽度
      this.textWidth = ctx.measureText(this._opts.text).width;
    }

    this.c1.width = this.textWidth;
    this.c1.height = this._opts.fontSize * 1.5;
    ctx.font = `${this._opts.fontWeight} ${this._opts.fontSize--}px Arial`;
    // 绘制文本
    ctx.fillText(this._opts.text, 0, this._opts.fontSize);
  }
  /**
   * 初始化 c2 画板
   */
  protected initC2 () {
    const [width, height] = this.BOARD_SIZE;
    this.c2.width = width;
    this.c2.height = height;
  }
  /**
   * 初始化 c3 画板
   */
  protected initC3 () {
    const [width, height] = this.BOARD_SIZE;
    this.c3.width = width;
    this.c3.height = height;

    const {
      color,
      shadowColor,
      shadowBlur
    } = this._opts;
    const ctx = this.ctx3;

    ctx.fillStyle = color;
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = shadowBlur;
  }

  /**
   * 初始化 文本目标 散点坐标
   */
  protected initTargets () {
    const c1 = this.c1;
    const ctx = this.ctx1;
    const { fidelity } = this._opts;

    const imageData = ctx.getImageData(0, 0, c1.width, c1.height);
    const len = imageData.data.length;

    let alpha: number,
      x: number,
      y: number;

    for (let i = 0; i < len; i += 4) {
      alpha = imageData.data[i + 3];
      x = Math.floor(i / 4) % imageData.width;
      y = Math.floor(i / 4 / imageData.width);

      if (alpha && x % fidelity === 0 && y % fidelity === 0) {
        this.targets.push({ x, y });
      }
    }
  }

  protected getTargets (): IPoint | undefined {
    const targets = this.targets;
    const len = targets.length;

    const { width, height } = this.c2;
    const { fontSize } = this._opts;
    const textWidth = this.textWidth;

    if (len > 0) {
      const idx = Math.floor(Math.random() * len);
      let { x, y } = targets[idx];
      targets.splice(idx, 1);

      x += width / 2 - textWidth / 2;
      y += height / 2 - fontSize / 2;

      return { x, y };
    }
  }

  /**
   * 循环动画
   */
  loop () {
    const canvas = this.c2;
    const ctx = this.ctx2;
    const rockets = this.rockets;
    const shards = this.shards;

    ctx.fillStyle = 'rgba(0, 0, 0, .1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 计数器 累加
    this.counter += 1;

    if (this.counter % 15 === 0) {
      rockets.push(new Rocket(canvas, ctx, shards, this.getTargets.bind(this)));
    }

    rockets.forEach((rocket, index) => {
      rocket.draw();
      rocket.update();

      if (rocket.ySpeed > 0) {
        rocket.explode();
        rockets.splice(index, 1);
      }
    });

    shards.forEach((shard, index) => {
      shard.draw();
      shard.update(this._opts.fidelity);

      if (shard.timer >= shard.ttl || shard.lightness >= 99) {
        this.ctx3.fillRect(shard.target!.x, shard.target!.y, this._opts.fidelity + 1, this._opts.fidelity + 1);
        shards.splice(index, 1);
      }
    });

    this.aniId = requestAnimationFrame(this.loop.bind(this));
  }

  /**
   * 清除动画
   */
  clear () {
    if (this.aniId) {
      cancelAnimationFrame(this.aniId);
      this.aniId = null;
    }
    this.c1.remove();
    this.c2.remove();
    this.c3.remove();
  }
}
