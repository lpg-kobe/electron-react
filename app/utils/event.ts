/**
 * @desc event事件调度
 * @author pika
 */

// global event define
const EVENT = {
  // editor of chat area
  editor: {
    getValue: 'GET_EDITOR_VALUE',
    setValue: 'SET_EDITOR_VALUE'
  },
  // component of img
  image: {
    load: 'LOAD_IMAGE'
  },
  // component of anchor
  anchor: {
    setPoster: 'SET_ANCHOR_POSTER'
  },
  // component of guest
  guest: {
    setPoster: 'SET_GUEST_POSTER'
  },
  // component of video
  video: {
    setPoster: 'SET_VIDEO_POSTER'
  }
}

export default class Event {
  public event: any;
  private eventBus: any;

  constructor() {
    this.event = EVENT;
    this.eventBus = this.eventBus || Object.create(null);
  }

  on(eventName: any, handler: any, context?: any) {
    if (typeof handler !== 'function') {
      console.error('Event handler must be a function');
      return;
    }
    this.eventBus[eventName] = this.eventBus[eventName] || []
    this.eventBus[eventName].push({
      handler,
      context,
    });
  }

  emit(eventName: any, data: any) {
    let eventCollection = this.eventBus[eventName];
    const args: Array<any> = [];
    if (eventCollection) {
      eventCollection = [].slice.call(eventCollection);
      args[0] = {
        eventCode: eventName,
        data,
      };
      for (let i = 0, len = eventCollection.length; i < len; i++) {
        eventCollection[i].handler.apply(eventCollection[i].context, args);
      }
    }
  }

  off(eventName: any, handler: any) {
    const eventCollection = this.eventBus[eventName];

    // clear all eventBus when not give the eventName
    if (!eventName) {
      this.eventBus = Object.create(null);
      return;
    }

    if (!eventCollection || !eventCollection.length) {
      return;
    }

    if (!handler) {
      delete this.eventBus[eventName];
    }

    for (let i = 0, len = eventCollection.length; i < len; i++) {
      const fnName = (fun: any) => fun.name || fun.toString().match(/function\s*([^(]*)\(/)[1]
      // remove event handler if function name of it is the same as eventCollection
      if (fnName(eventCollection[i].handler) === fnName(handler)) {
        eventCollection.splice(i, 1);
        break;
      }
    }
  }
}

export const eventEmitter = new Event()
