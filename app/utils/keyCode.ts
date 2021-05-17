/**
 * @desc key code 事件调度中心
 * @author pika
 */
import Event from './event'

const EVENT = {
    enter: 'Enter',
    left: 'ArrowLeft',
    right: 'ArrowRight',
    devtool: 'shiftKey&F12',
}

export default class KeyCode {

    private emmitter: any
    public EVENT: any

    constructor() {
        this.emmitter = new Event()
        this._bindEvent()
        this.EVENT = EVENT
    }

    on(eventName: any, handler: any, context?: any) {
        this.emmitter.on(eventName, handler, context);
    }

    off(eventName: any, handler: any) {
        this.emmitter.off(eventName, handler);
    }

    onKeyCode(event: any) {
        Object.entries(EVENT).forEach(([name, value]: [string, string]) => {
            const { key, code } = event
            const multiKeys = value.split('&')
            if (multiKeys.length) {
                key === multiKeys[1] && event[multiKeys[0]] ? this.emmitter.emit(value, { keys: multiKeys }) : null
            } else {
                key === value && this.emmitter.emit(value, { key, code })
            }
        })
    }

    _bindEvent() {
        document.removeEventListener('keyup', this.onKeyCode.bind(this), true)
        document.addEventListener('keyup', this.onKeyCode.bind(this), true)
    }
}
