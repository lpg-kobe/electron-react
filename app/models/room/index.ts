/**
 * @desc modal of room info
 * @author pika
 */
import immutable from 'immutable';
import pathToRegexp from 'path-to-regexp'

// @ts-ignore
import { getRoomInfo, getUserStatusInRoom, getRoomIntroduce } from '@/services/room';
// @ts-ignore
import { closeWindow } from '@/utils/ipc';

type ActionType = {
  payload: any;
};

type StateType = {
  [key: string]: any;
};

type YieldType = {
  call(payload?: any, params?: any): void,
  put(action: any): void,
  select(fn?: any): void,
  take(): void
};

type LocationType = {
  pathname: string;
};

type SetUpType = {
  history: any;
  dispatch: any;
};

type MenuType = {
  menuValue: number,
  menuType: number,
  name: string,
  sort: number
}

const initialState: StateType = {
  // 用户进来直播间时的状态
  userStatus: {},
  // 当前房间信息
  roomInfo: {},
  // 当前房间简介
  roomIntroduce: {},
  // 自定义直播间左侧详情模块菜单,sort根据后端返回
  detailMenu: [
    { menuType: 2, name: '图文直播', sort: 0 },
    { menuType: 4, name: '产品展示', sort: 0 },
    { menuType: 5, name: '资料下载', sort: 0 },
    { menuType: 6, name: '活动介绍', sort: 0 }
  ],
  // 自定义直播间右侧聊天模块菜单,sort根据后端返回
  chatMenu: [
    { menuType: 1, name: '互动区', sort: 0 },
    { menuType: 3, name: '问答区', sort: 0 },
    // { menuType: 7, name: '图片直播', sort: 0 }
  ]
};
export default {
  namespace: 'room',

  state: immutable.fromJS(initialState),

  reducers: {
    save(state: StateType, { payload }: ActionType) {
      return state.merge(payload);
    },

    /**
     * @desc 条件过滤菜单
     * @param {Array} origin 来源菜单 
     * @param {Array} target 被过滤的菜单  
     * @param {string} key 要合并的state key    
     */
    filterMenu(state: StateType, { payload: { origin, target, key } }: ActionType) {
      const value = origin.map((menu: MenuType) => {
        const cur = target.find((ele: any) => ele.menuType === menu.menuType)
        if (cur) {
          return {
            ...menu,
            name: cur.name
          }
        } else {
          return menu
        }
      }).filter((item: MenuType) => target.some((ele: any) => ele.menuType === item.menuType))
      return state.merge({
        [key]: value
      });
    },
  },

  effects: {
    // 获取直播间详情
    *getRoomInfo({ payload }: ActionType, { call, put }: YieldType) {
      const { status, data: { data } } = yield call(getRoomInfo, payload);
      if (status) {
        const { menulist } = data
        const { detailMenu, chatMenu } = initialState
        // 过滤左侧详情区域菜单
        yield put({
          type: 'filterMenu',
          payload: {
            key: 'detailMenu',
            origin: menulist,
            target: detailMenu
          }
        })
        // 过滤右侧聊天区域菜单
        yield put({
          type: 'filterMenu',
          payload: {
            key: 'chatMenu',
            origin: menulist,
            target: chatMenu
          }
        })
        yield put({
          type: 'save',
          payload: {
            roomInfo: data
          }
        })

      }
    },

    // 获取直播间简介
    *getRoomIntroduce({ payload }: ActionType, { call, put }: YieldType) {
      const { status, data: { data } } = yield call(getRoomIntroduce, payload)
      if (status) {
        yield put({
          type: 'save',
          payload: {
            roomIntroduce: data
          }
        })
      }
    },

    // 获取用户进入直播间时的信息
    *getUserStatusInRoom({ payload }: ActionType, { call, put }: YieldType) {
      const { status, data: { data } } = yield call(getUserStatusInRoom, payload)
      if (status) {
        yield put({
          type: 'save',
          payload: {
            userStatus: data
          }
        })
        // 初始化禁言状态
        yield put({
          type: 'chat/save',
          payload: {
            inputDisabled: data.isForbit === 1
          }
        })
      } else {
        // 进不了直播间就直接关闭窗口到直播列表
        setTimeout(() => {
          closeWindow()
        }, 3000)
      }
    },

    // 根据菜单初始化数据，交互变更预留功能
    *handleFetchByMenu({ payload }: ActionType, { call, put }: YieldType) {
      switch (payload.menu) {
        // 互动区
        case 1:
          break;
        // 问答区
        case 3:
          break;
        // 图片直播
        case 7:
          break;

        // 图文直播
        case 2:
          break;
        // 产品展示
        case 4:
          break;
        // 资料下载
        case 5:
          break;
        // 活动介绍
        case 6:
          const { status, data: { data: roomIntroduce } } = yield call(getRoomIntroduce, payload)
          if (status) {
            yield put({
              type: 'save',
              payload: {
                roomIntroduce
              }
            })
          }
          break;
      }

    }
  },

  subscriptions: {
    setup({ history, dispatch }: SetUpType) {
      return history.listen(({ pathname }: LocationType) => {
        const locationMatch = pathToRegexp('/room/:id').exec(pathname)
        if (locationMatch) {
          dispatch({
            type: 'getRoomInfo',
            payload: {
              roomid: locationMatch[1]
            },
          });
          dispatch({
            type: 'getUserStatusInRoom',
            payload: {
              roomid: locationMatch[1]
            },
          });
        }
      });
    },
  }
}
