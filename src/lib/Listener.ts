/*
 * @FilePath: \linkup-ts\src\lib\Listener.ts
 * @Description: Listener
 * @Author: humandetail
 * @Date: 2021-03-23 22:27:34
 * @LastEditors: humandetail
 * @LastEditTime: 2021-03-23 22:54:43
 */

interface EventCallback  {
  (...args: any[]): any;
  listen?: () => any;
}

interface EventWrapper {
  [key: string]: EventCallback[]
}


export default class Listener {

  private static instance: Listener = new Listener();

  private _events: EventWrapper;

  // 防止外部实例化
  private constructor () {
    this._events = Object.create(null);
  }

  get events () {
    return this._events;
  }

  public static getInstance (): Listener {
    return this.instance;
  }

  on (type: string, cb: EventCallback): Listener {
    if (this._events[type]) {
      this._events[type].push();
    } else {
      this._events[type] = [cb];
    }

    return this;
  }

  once (type: string, cb: EventCallback): Listener {
    const _this = this;
    const wrap: EventCallback = function (...args: any[]): void {
      cb(...args);
      // 当回调函数被调用之后，立即解除监听
      _this.off(type, wrap);
    }

    wrap.listen = cb;
    this.on(type, wrap);
    
    return this;
  }

  emit (type: string, ...args: any[]): Listener {
    if (this._events[type]) {
      this._events[type].forEach((Listener) => {
        Listener.call(this, ...args);
      });
    }

    return this;
  }

  off (type: string, cb: EventCallback): Listener {
    if (this._events[type]) {
      // 移除相关的监听器
      this._events[type] = this._events[type].filter((listener) => {
        return cb !== listener && cb !== listener.listen;
      });
    }

    return this;
  }
  
  clear (): Listener {
    this._events = Object.create(null);
    return this;
  }

}
