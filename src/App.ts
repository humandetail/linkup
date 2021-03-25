/*
 * @FilePath: \linkup-ts\src\App.ts
 * @Description: App
 * @Author: humandetail
 * @Date: 2021-03-25 13:49:09
 * @LastEditors: humandetail
 * @LastEditTime: 2021-03-25 23:46:23
 */

import Listener from './lib/Listener';
import LinkUp from './lib/LinkUp';
import Painter from './lib/Painter';

import Levels from './config/level';

import { ILevelItem, ILinkUpItem, IPoint } from '../types';
import { sleep } from './lib/utils';

enum GameStatus {
  // 加载状态
  loading,
  // 正常游戏状态
  normal,
  // 执行动画
  animation,
  // 结束状态
  ended,
  // 游戏错误
  error
}

export default async () => {
  const listener = Listener.getInstance();
  const linkUp = LinkUp.getInstance();
  const painter = Painter.getInstance();

  const oLevels = document.querySelector('#js-levels');
  const oProps = document.querySelector('#js-props');
  const oGameWrapper = document.querySelector('#js-game-wrapper') as HTMLCanvasElement;

  let level: ILevelItem;
  let gameStatus: GameStatus = GameStatus.loading;
  let startTime: number; // 开始时间 毫秒时间戳

  await painter.init(oGameWrapper);

  function addEventListener () {
    if (!oLevels || !oProps || !oGameWrapper) {
      listener.emit('error');
      return;
    }
    oLevels.addEventListener('click', levelEventHandler, false);
    oProps.addEventListener('click', (e: Event) => {});
    oGameWrapper.addEventListener('click', elementPickHandler, false);
  }

  // 等级按钮点击事件监听处理函数
  function levelEventHandler (e: Event) {
    const target = e.target as HTMLElement;
    let level: string | undefined;

    if (target.classList.contains('level')) {
      level = target.dataset.level;

      if (level && Levels[level] && confirm(`确认选择“${Levels[level].name}”开始游戏吗？`)) {
        listener.emit('change-level', Levels[level]);
      }
    }
  }

  // 游戏面板点击事件处理 - 处理元素选择
  function elementPickHandler (e: MouseEvent) {
    // 非正常游戏状态，不处理点击事件
    if (gameStatus !== GameStatus.normal) {
      return;
    }
    const pos: IPoint = painter.handleClick(e);

    listener.emit('pick', pos);
  }

  // 添加事件监听
  addEventListener();

  listener.on('error', () => {
    throw new Error('游戏初始化失败，请刷新页面重试。');
  });

  // 游戏等级监听
  listener.on('change-level', async (lv: ILevelItem) => {
    level = lv;
    gameStatus = GameStatus.loading;
    // await painter.init(level, oGameWrapper);
    // 更新画板
    painter.changeLevel(level);
    // 开启加载动画
    painter.initLoadingAnimation();

    // 生成连接元素
    const linkUpItems = linkUp.init(level);
    await sleep(500);
    listener.emit('loaded', linkUpItems);
  });
  
  // 游戏加载完成监听
  listener.on('loaded', (linkUpItems: ILinkUpItem[][]) => {
    // 清除加载动画
    painter.clearLoadingAnimation();
    // 绘制游戏元素
    painter.updateElement(linkUpItems);
    // 正常开始游戏
    gameStatus = GameStatus.normal;
    startTime = new Date().getTime();
  });
  
  // 数据更新
  listener.on('update', (linkUpItems: ILinkUpItem[][]) => {
    painter.updateElement(linkUpItems);
    gameStatus = GameStatus.normal;
  });
  
  // 元素选择
  listener.on('pick', (pos) => {
    if (linkUp.isEmptyItem(pos)) {
      // 当前坐标点为空白元素点
      return;
    }
    const points = painter.setClickPos(pos);
    if (points.length === 2) {
      // 已经选中两个元素
      // 进行对比
      listener.emit('element-connect', points)
    };
  });

  // 元素连接
  listener.on('element-connect', async (points: [IPoint, IPoint]) => {
    const result = linkUp.onCompare(...points);
    gameStatus = GameStatus.animation;
    if (!result) {
      await painter.handleConnectFail();
      gameStatus = GameStatus.normal;
      return;
    }
    
    await painter.drawLineAnimation(...result);
    const {
      linkUpItems,
      isFinished
    } = linkUp.removeItems(...points);

    listener.emit('update', linkUpItems);
    
    if (isFinished) {
      listener.emit('finished');
    }
  });

  // 游戏结束
  listener.on('finished', () => {
    gameStatus = GameStatus.ended;
    const duration = Math.ceil((new Date().getTime() - startTime) / 1000);
    const mm = Math.floor(duration / 60);
    const ss = duration % 60;

    painter.drawGameOverAnimation(`${mm}分${ss}秒`);
  });
}

