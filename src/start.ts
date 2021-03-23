/*
 * @FilePath: \linkup-ts\src\start.ts
 * @Description: 开始游戏
 * @Author: humandetail
 * @Date: 2021-03-18 20:33:42
 * @LastEditors: humandetail
 * @LastEditTime: 2021-03-23 19:37:23
 */

import LinkUp from './lib/LinkUp';
import Painter from './lib/Painter';

import Levels from './config/level';
import TopicTypes from './config/topicTypes';
import { ILevelItem } from '../types';

export default class Start {

  // linkUp 实例
  private linkUp: LinkUp = LinkUp.getInstance();
  // painter 实例
  private painter: Painter = Painter.getInstance();

  private oLevels: Element;
  private oGameWrapper: HTMLCanvasElement;
  private oProp: Element;

  private isStart: boolean = false;

  constructor (oLevels: Element, oGameWrapper: HTMLCanvasElement, oProp: Element) {
    this.oLevels = oLevels;
    this.oGameWrapper = oGameWrapper;
    this.oProp = oProp;
    this.init();
  }

  init () {
    this.oLevels.addEventListener('click', this.onLevelsClick.bind(this), false);
    this.oProp.addEventListener('click', this.onPropsClick.bind(this), false);
    this.initSubscribe();
  }

  // 初始化订阅
  initSubscribe () {
    const linkUp = this.linkUp;
    const painter = this.painter;

    // 订阅 开始游戏
    linkUp.subscribe(TopicTypes.START, painter.start.bind(painter));
    // 订阅 元素更新
    linkUp.subscribe(TopicTypes.UPDATED_ELEMENT, painter.updateElement.bind(painter));
    // 订阅 是否为空元素
    linkUp.subscribe(TopicTypes.ELEMENT_IS_EMPTY, painter.isEmptyElement.bind(painter));
    // 订阅 元素连接失败
    linkUp.subscribe(TopicTypes.CONNECT_FAIL, painter.connectFail.bind(painter));
    // 订阅 元素连接成功
    linkUp.subscribe(TopicTypes.CONNECT_SUCCESS, painter.connectSuccess.bind(painter));
    // 订阅 游戏结束
    linkUp.subscribe(TopicTypes.GAME_OVER, painter.gameOver.bind(painter));
  
    // 订阅 元素选择
    painter.subscribe(TopicTypes.PICK_ELEMENT, linkUp.pickElement.bind(linkUp));
    // 订阅 元素比较
    painter.subscribe(TopicTypes.COMPARE_ELEMENT, linkUp.onCompare.bind(linkUp));
    // 订阅 元素连接成功动画执行完成
    painter.subscribe(TopicTypes.CONNECT_FINISHED, linkUp.connectFinished.bind(linkUp));
  }

  /**
   * 开始游戏
   */
  async start (level: ILevelItem) {
   await this.painter.init(level, this.oGameWrapper);
   await this.linkUp.init(level);
   this.isStart = true;
  }

  /**
   * 难度选择区域点击
   */
  onLevelsClick (ev: Event) {
    const target = ev.target as HTMLElement;
    let level: string | undefined;

    if (target.classList.contains('level')) {
      level = target.dataset.level;

      if (level && Levels[level] && confirm(`确认选择“${Levels[level].name}”开始游戏吗？`)) {
        this.start(Levels[level]);
      }
    }
  }

  /**
   * 道具点击
   */
  onPropsClick (ev: Event) {
    const target = ev.target as HTMLElement;
    let prop: string | undefined;

    if (target.classList.contains('prop')) {
      prop = target.dataset.prop;

      if (prop && this.isStart) {
        this.linkUp.useProp(prop);
      }
    }
  }
}
