/*
 * @FilePath: \linkup-ts\src\lib\animations\gameover\Rocket.ts
 * @Description: Rocket 动画
 * @Author: humandetail
 * @Date: 2021-03-29 15:23:36
 * @LastEditors: humandetail
 * @LastEditTime: 2021-03-29 16:03:54
 */

import { IGetTargets, IPoint } from "./typings";
import Shard from "./Shard";

export default class Rocket {
  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;

  protected x: number;
  protected y: number;
  protected angle: number;
  // 爆炸速度
  protected blastSpeed: number;
  protected shardCount: number;

  // 色调
  protected hue: number;

  public xSpeed: number = 0;
  public ySpeed: number = 0;

  // 拖尾
  protected trail: any[] = [];
  // 碎片集合
  protected shards: Shard[];

  protected getTargets: IGetTargets;


  constructor (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, shards: Shard[], getTargets: IGetTargets) {
    this.canvas = canvas;
    this.ctx = ctx;

    const { width, height } = canvas;
    
    const quarterW = width / 4;
    this.x = quarterW + Math.random() * (width - quarterW);
    this.y = height - 15;
    this.angle = Math.random() * Math.PI / 4 - Math.PI / 6;
    this.blastSpeed = 6 + Math.random() * 7;
    this.shardCount = 15 + Math.floor(Math.random() * 15);
    this.xSpeed = Math.sin(this.angle) * this.blastSpeed;
    this.ySpeed = -Math.cos(this.angle) * this.blastSpeed;
    this.hue = Math.floor(Math.random() * 360);

    this.shards = shards;
    this.getTargets = getTargets;
  }

  draw () {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.atan2(this.ySpeed, this.xSpeed) + Math.PI / 2);
    ctx.fillStyle = `hsl(${this.hue}, 100%, 50%)`;
    ctx.fillRect(0, 0, 5, 15);
    ctx.restore();
  }

  update () {
    this.x = this.x + this.xSpeed;
    this.y = this.y + this.ySpeed;
    this.ySpeed += 0.1;
  }

  explode () {
    for (let i = 0; i < 70; i++) {
      this.shards.push(new Shard(this.canvas, this.ctx, this.x, this.y, this.hue, this.shards, this.getTargets));
    }
  }
}
