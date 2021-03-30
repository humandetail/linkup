/*
 * @FilePath: \linkup-ts\src\lib\animations\gameover\Shard.ts
 * @Description: 碎片 动画
 * @Author: humandetail
 * @Date: 2021-03-29 15:27:31
 * @LastEditors: humandetail
 * @LastEditTime: 2021-03-29 15:58:04
 */

import { IGetTargets, IPoint } from "./typings";

export default class Shard {
  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;

  public timer: number = 0;
  public ttl: number = 100;

  public target: IPoint | undefined;

  public x: number;
  public y: number;
  public hue: number;

  public lightness: number = 50;
  public size: number = 15 + Math.random() * 10;

  public xSpeed: number;
  public ySpeed: number;

  public shards: Shard[];

  constructor(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    hue: number,
    shards: Shard[],
    getTargets: IGetTargets
  ) {
    this.canvas = canvas;
    this.ctx = ctx;

    this.x = x;
    this.y = y;
    this.hue = hue;

    const angle = Math.random() * 2 * Math.PI;
    const blastSpeed = 1 + Math.random() * 6;
    this.xSpeed = Math.cos(angle) * blastSpeed;
    this.ySpeed = Math.sin(angle) * blastSpeed;

    this.shards = shards;
    this.target = getTargets();
  }

  draw() {
    const ctx = this.ctx;
    ctx.fillStyle = `hsl(${this.hue}, 100%, ${this.lightness}%)`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
  }

  update (fidelity: number) {
    const lerp = this.lerp;

    if (this.target) {
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const a = Math.atan2(dy, dx);
      const tx = Math.cos(a) * 5;
      const ty = Math.sin(a) * 5;
      this.size = lerp(this.size, 1.5, 0.05);

      if (dist < 5) {
        this.lightness = lerp(this.lightness, 100, 0.01);
        this.xSpeed = this.ySpeed = 0;
        this.x = lerp(this.x, this.target.x + fidelity / 2, 0.05);
        this.y = lerp(this.y, this.target.y + fidelity / 2, 0.05);
        this.timer += 1;
      } else
        if (dist < 10) {
          this.lightness = lerp(this.lightness, 100, 0.01);
          this.xSpeed = lerp(this.xSpeed, tx, 0.1);
          this.ySpeed = lerp(this.ySpeed, ty, 0.1);
          this.timer += 1;
        } else {
          this.xSpeed = lerp(this.xSpeed, tx, 0.02);
          this.ySpeed = lerp(this.ySpeed, ty, 0.02);
        }
    } else {
      this.ySpeed += 0.05;
      //this.xSpeed = lerp(this.xSpeed, 0, 0.1);
      this.size = lerp(this.size, 1, 0.05);

      if (this.y > this.canvas.height) {
        this.shards.forEach((shard, idx) => {
          if (shard === this) {
            this.shards.splice(idx, 1);
          }
        });
      }
    }
    this.x = this.x + this.xSpeed;
    this.y = this.y + this.ySpeed;
  }

  protected lerp (a: number, b: number, t: number) {
    return Math.abs(b - a) > 0.1 ? a + t * (b - a) : b
  }
}
