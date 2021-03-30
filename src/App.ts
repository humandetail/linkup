/*
 * @FilePath: \linkup-ts\src\App.ts
 * @Description: App
 * @Author: humandetail
 * @Date: 2021-03-25 13:49:09
 * @LastEditors: humandetail
 * @LastEditTime: 2021-03-30 16:28:04
 */

import Listener from './lib/Listener';
import LinkUp from './lib/LinkUp';
import Painter from './lib/Painter';

import {
  GameOver,
  Loading
} from './lib/animations';

import Levels from './config/level';

import { ILevelItem, ILinkUpItem, IPoint, IPropAmount } from '../types';
import { sleep, throttle } from './lib/utils';

export enum GameStatus {
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
  let gameOver: GameOver | null = null;
  let loading: Loading | null = null;
  const listener = Listener.getInstance();
  const linkUp = LinkUp.getInstance();
  const painter = Painter.getInstance();

  const oAnimationWrapper = document.querySelector('#js-animation-wrapper') as HTMLElement;
  const oLevels = document.querySelector('#js-levels');
  const oProps = document.querySelector('#js-props');
  const oGameWrapper = document.querySelector('#js-game-wrapper') as HTMLCanvasElement;
  const propsTemp = document.querySelector('#js-props-template')!.innerHTML;
  const OInstructionWrapper = document.querySelector('#js-instruction-wrapper') as HTMLElement;
  const instructionTemp = document.querySelector('#js-instruction-template')!.innerHTML;

  let level: ILevelItem;
  let prop: IPropAmount = {
    tip: 0,
    reset: 0,
    bomb: 0
  };
  let activeProp: string = '';
  let gameStatus: GameStatus = GameStatus.loading;
  let startTime: number; // 开始时间 毫秒时间戳

  await painter.init(oGameWrapper);
  showInstruction();
  setProp(prop);

  window.addEventListener('resize', throttle(function () {
    painter.getCanvasDocPos();
  }, 16), false);

  function showInstruction () {
    const reg = /\{\{(.*?)\}\}/g;
    const propsImg = {
      tip: require('./assets/img/prop/tip.png'),
      reset: require('./assets/img/prop/reset.png'),
      bomb: require('./assets/img/prop/bomb.png')
    };

    OInstructionWrapper.innerHTML = instructionTemp.replace(reg, (node, key) => {
      return propsImg[key as keyof typeof propsImg];
    });
  }

  function addEventListener () {
    if (!oLevels || !oProps || !oGameWrapper) {
      listener.emit('error');
      return;
    }
    oLevels.addEventListener('click', levelEventHandler, false);
    oProps.addEventListener('click', propEventHandler, false);
    oGameWrapper.addEventListener('click', elementPickHandler, false);
  }

  function setProp (amount: IPropAmount, activeProp: string = '') {
    const reg = /\{\{(.*?)\}\}/g;
    oProps!.innerHTML = propsTemp.replace(reg, (node, key) => {
      return amount[key as keyof IPropAmount] + '';
    });
    document.querySelectorAll('.prop')?.forEach((el) => el.classList.remove('acitve'));
    if (activeProp) {
      const oActive = document.querySelector(`.prop-${activeProp}`);
      if (oActive) {
        oActive.classList.add('active')
      }
    }
  }

  // 等级按钮点击事件监听处理函数
  function levelEventHandler (e: Event) {
    const target = e.target as HTMLElement;
    let level: string | undefined;

    if (target.classList.contains('level')) {
      level = target.dataset.level;

      if (level && Levels[level] && confirm(`确认选择“${Levels[level].name}”开始游戏吗？`)) {
        oAnimationWrapper.style.display = 'none';
        listener.emit('change-level', Levels[level]);
        if (gameOver) {
          gameOver.clear();
          gameOver = null;
        }
      }
    }
  }

  // 道具点击事件处理
  function propEventHandler (e: Event) {
    if (gameStatus !== GameStatus.normal) {
      return;
    }

    let oLi: HTMLElement | null = e.target as HTMLElement;
    while (oLi && !oLi.classList.contains('prop')) {
      oLi = oLi.parentElement;
    }
    
    if (oLi) {
      if (oLi.classList.contains('active')) {
        setProp(prop);
      } else {
        activeProp = oLi.dataset.prop || '';
        if (activeProp === 'reset' && prop.reset > 0) {
          setProp(prop, activeProp);
          listener.emit('reset');
        } else if (activeProp === 'tip' && prop.tip > 0) {
          setProp(prop, activeProp);
          listener.emit('tip');
        } else if (activeProp === 'bomb' && prop.bomb > 0) {
          setProp(prop, activeProp);
        }
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

  function initProp (level: ILevelItem) {
    let tip: number = 0;
    let reset: number = 0;
    let bomb: number = 0;
    switch (level.name) {
      case '普通难度':
        tip = 3;
        reset = 3;
        bomb = 3;
        break;
      case '中等难度':
        tip = 2;
        reset = 2;
        bomb = 2;
        break;
      case '高级难度':
        tip = 1;
        reset = 1;
        bomb = 1;
        break;
      default:
        break;
    }

    return {
      tip,
      reset,
      bomb
    };
  }

  // 添加事件监听
  addEventListener();

  listener.on('error', () => {
    throw new Error('游戏初始化失败，请刷新页面重试。');
  });

  // 游戏等级监听
  listener.on('change-level', async (lv: ILevelItem) => {
    level = lv;
    prop = initProp(level);
    gameStatus = GameStatus.loading;
    // await painter.init(level, oGameWrapper);
    OInstructionWrapper.remove();
    // 设置道具数量
    setProp(prop);
    // 更新画板
    painter.changeLevel(level);
    // 开启加载动画
    // painter.initLoadingAnimation();
    oAnimationWrapper.style.display = 'block';
    loading = new Loading(oAnimationWrapper);

    // 生成连接元素
    const linkUpItems = linkUp.init(level);
    await sleep(500);
    loading.clear();
    oAnimationWrapper.style.display = 'none';
    listener.emit('loaded', linkUpItems);
  });

  // 重排道具使用监听
  listener.on('reset', () => {
    // 对数据进行重排
    const linkUpItems = linkUp.handleReset();
    // 重绘
    listener.emit('update', linkUpItems);
    // 清除道具
    prop.reset -= 1;
    activeProp = '';
    setProp(prop);
  });

  // 提示道具使用监听
  listener.on('tip', async () => {
    const result = linkUp.handleTip();
    if (!result) {
      // 无法找到连接点，游戏失败
      gameStatus = GameStatus.ended;
      alert('Game over!');
      return;
    }
    gameStatus = GameStatus.loading;
    await painter.drawTipAnimation(...result);
    prop.tip -= 1;
    setProp(prop);
    activeProp = '';
    gameStatus = GameStatus.normal;
  });
  
  // 游戏加载完成监听
  listener.on('loaded', (linkUpItems: ILinkUpItem[][]) => {
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
    if (activeProp === 'bomb' && linkUp.isSameType(...points)) {
      prop.bomb -= 1;
      activeProp = '';
      setProp(prop);
      painter.clearClickPos();
    } else {
      const result = linkUp.onCompare(...points);
      gameStatus = GameStatus.animation;
      if (!result) {
        await painter.handleConnectFail();
        gameStatus = GameStatus.normal;
        return;
      }
      
      // 绘制连接动画
      await painter.connect(result);
    }
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
    console.log(`游戏用时：${mm}分${ss}秒`);

    oAnimationWrapper.style.display = 'block';
    gameOver = new GameOver(oAnimationWrapper, { text: 'YOU WIN' });
    // 绘制结束动画
    gameOver.loop();
  });
}

