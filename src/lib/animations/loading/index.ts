/*
 * @FilePath: \linkup-ts\src\lib\animations\loading\index.ts
 * @Description: loading 动画
 * @Author: humandetail
 * @Date: 2021-03-29 16:44:59
 * @LastEditors: humandetail
 * @LastEditTime: 2021-03-29 22:08:37
 */

interface IPoint {
  x: number;
  y: number;
}

export default class Loading {
  protected element: HTMLElement;
  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;

  protected quantity: number = 120;
  protected radius: number = 50;
  // 中心坐标
  protected center: IPoint;
  // 圆周上平均分布的点
  protected points: IPoint[] = [];

  protected trails: IPoint[] = [];

  protected text: string = '玩命加载中';

  protected t: number = 0;
  protected dotLen: number = 3;

  public aniId: number | null = null;

  constructor (el: HTMLElement | string) {
    const element = typeof el === 'string' ? document.querySelector(el) : el;
    if (!element) {
      throw new Error('动画初始化失败');
    }

    this.element = element as HTMLElement;

    const canvas = document.createElement('canvas');

    element.appendChild(canvas);

    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;

    const { width, height } = element.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;

    this.center = {
      x: width / 2,
      y: height / 2
    };

    this.init();
  }

  init () {
    this.getPoints();
    this.loop();
  }

  drawCircle () {
    const ctx = this.ctx;
    const { x: cx, y: cy } = this.center;

    ctx.strokeStyle = 'rgba(0, 168,255, .5)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.arc(cx, cy, this.radius, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.closePath();
  }

  /**
   * 获取圆上的点
   */
  getPoints () {
    const quantity = this.quantity;
    const { x: cx, y: cy } = this.center;
    const radius = this.radius;
    const PI = Math.PI;
    const cos = Math.cos;
    const sin = Math.sin;

    const degree = 360 / quantity; // 获取每个点的度数

    const points = [];
    
    for (let i = 0; i < quantity; i++) {
      points.push({
        x: cx + cos(PI * 2 / 360 * (degree * i)) * radius,
        y: cy + sin(PI * 2 / 360 * (degree * i)) * radius,
      });
    }

    this.points = points;
  }

  drawText () {
    const ctx = this.ctx;
    const { x, y } = this.center;
    const text = this.text;

    ctx.font = '300 15px Arial';
    ctx.fillStyle = '#fff';
    const { width } = ctx.measureText(text);

    ctx.fillText(text, x - width / 2, y);
  }

  drawTrails () {
    const trails = this.trails;
    const len = trails.length;
    const ctx = this.ctx;
    const maxRadius = 5;
    const maxAlpha = 1;

    let r: number;
    let a: number;
    let trail: IPoint;

    for (let i = len - 1; i > 0; i--) {
      trail = trails[i];
      ctx.save();;
      ctx.fillStyle = `hsl(${300 - (120 / len) * (i + 1)}, 100%, 50%)`;
      r = (maxRadius / len) * (i + 1);
      a = (maxAlpha / len) * (i + 1);
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(trail.x, trail.y, r, 0, 2 * Math.PI);
      ctx.fill();
      ctx.closePath();
      ctx.restore();
    }

    // 绘制发光头
    let head = trails[len - 1];
    ctx.save();
    for (let j = 0; j < 3; j++) {
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.shadowColor = 'hsl(180, 100%, 50%)';
      ctx.shadowBlur = (j + 1) * 10;
      ctx.beginPath();
      ctx.arc(head.x, head.y, maxRadius * 0.8, 0, 2 * Math.PI);
      ctx.fill();
      ctx.closePath();
    }
    ctx.restore();
  }

  loop () {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.t >= this.quantity) {
      this.t = 0;
    }

    this.trails.push(this.points[this.t]);

    if (this.trails.length > this.quantity) {
      this.trails.shift();
    }

    // if (this.t % 30 === 0) {
    //   this.text += '.';
    //   this.dotLen --;

    //   if (this.dotLen < 0) {
    //     this.text = 'Loading';
    //     this.dotLen = 3;
    //   }
    // }

    // this.drawCircle();
    this.drawText();
    this.drawTrails();

    this.t++;

    this.aniId = requestAnimationFrame(this.loop.bind(this));
  }

  clear () {
    if (this.aniId) {
      cancelAnimationFrame(this.aniId);
      this.aniId = null;
    }
    this.canvas.remove();
  }
}
