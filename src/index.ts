/*
 * @FilePath: \linkup-ts\src\index.ts
 * @Description: entry
 * @Author: humandetail
 * @Date: 2021-03-16 23:24:13
 * @LastEditors: humandetail
 * @LastEditTime: 2021-03-25 14:50:30
 */

// import Start  from './start';
import App from './App';

import './assets/styles/index.scss';

// const OLevels = document.querySelector('#js_levels');
// const OGameWrapper: HTMLCanvasElement | null = document.querySelector('#js_game-wrapper');
// const oProp: HTMLCanvasElement | null = document.querySelector('#js_props');


// if (!OLevels || !OGameWrapper) {
//   throw new Error('游戏出错。');
// }

// new Start(OLevels, OGameWrapper, oProp!);

App();
