/**
 * @desc check network working or not base on internet-available
 * @author pika
 */

import Event from './event'
// @ts-ignore
import networkAvailable from 'internet-available'
import { loopToInterval } from './tool'

const EVENT = {
  network: 'network'
}

interface CheckSetting {
  domainName?: string,// 检测站点
  port?: number,// 检测端口
  timeout?: number; // 超时时间
  retries?: number;// 尝试次数
  host?: string; // 检测host,默认google.dns 8.8.8.8
}

class CheckNet {

  timer: any
  public EVENT: any
  private emmitter: any


  constructor(settings?: CheckSetting) {
    this.emmitter = new Event()
    this.EVENT = EVENT
    this.init(settings)
  }

  on(eventName: any, handler: any, context?: any) {
    this.emmitter.on(eventName, handler, context);
  }

  off(eventName: any, handler: any) {
    this.emmitter.off(eventName, handler);
  }

  init(settings: any) {
    const { network } = this.EVENT
    this.timer = loopToInterval(() => {
      networkAvailable({
        timeout: 3 * 1000,
        retries: 3,
        host: '114.114.114.114',
        ...settings
      }).then(() => {
        this.emmitter.emit(network, { status: true })
      }).catch(() => {
        this.emmitter.emit(network, { status: false })
      })
      return true
    }, this.timer, 1 * 1000)
  }
}

export default new CheckNet()
