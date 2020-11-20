/**
 * @desc common tool
 * @author pika
 */

const { v4 } = require('uuid');
// flag of requestAnimationFrame 
let rafFlag: boolean = false

// random guid base Number(16)
export function createGUID() {
  return v4();
}

export function getStore(name: any) {
  try {
    // @ts-ignore
    return JSON.parse(localStorage.getItem(name))
  } catch (error) {
    console.warn('can not parse user object witch you want to get...');
    // @ts-ignore
    return {}
  }
}

export function setStore(key: any, value: any) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('can not stringify user object witch you want to save...');
    localStorage.setItem(key, JSON.stringify({}));
  }
}

export function removeStore(key: any) {
  return localStorage.removeItem(key);
}

export function scrollElement(dom: HTMLElement, position: number | string) {
  if (!dom.nodeType) {
    throw new Error(`target of ${dom} is not an HTMLElement`)
  }
  if (typeof (position) === 'string') {
    const scrollReact: any = {
      'bottom': () => dom.scrollTop = dom.scrollHeight,
      'top': () => dom.scrollTop = 0
    }
    scrollReact[position] && scrollReact[position]()
  } else {
    dom.scrollTop = position
  }
}

// 跟随屏幕帧率节流
export function tottle(fn: any) {
  if (!rafFlag) {
    window.requestAnimationFrame(() => {
      fn()
      rafFlag = false
    })
  }
  rafFlag = true
}

/**
 * @desc 跟随帧率刷新获取dom最新的位置
 * @param {HTMLElement} dom 监听的dom节点
 * @param {Function} callback 回调函数
 */
export function rqaToGetElePos(dom: HTMLElement | string, callback?: any) {
  const realDom: any = typeof (dom) === 'string' ? document.querySelector(dom) : dom
  if (!realDom.nodeType) {
    throw new Error(`target of ${realDom} is not an HTMLElement`)
  }

  const rect = realDom.getBoundingClientRect()
  // 触发首次对比
  let prevTop = rect.top - 1
  let prevLeft = rect.left - 1

  function getPosition() {
    const nextRect = realDom.getBoundingClientRect()
    if (prevTop !== nextRect.top || prevLeft !== nextRect.left) {
      prevTop = nextRect.top
      prevLeft = nextRect.left
      window.requestAnimationFrame(getPosition)
      return {
        offsetTop: realDom.offsetTop,
        offsetLeft: realDom.offsetLeft,
        rect: realDom.getBoundingClientRect()
      }
    } else {
      const curRect = {
        offsetTop: realDom.offsetTop,
        offsetLeft: realDom.offsetLeft,
        rect: realDom.getBoundingClientRect()
      }
      callback && callback(curRect);
      return curRect
    }
  }
  getPosition()
}
