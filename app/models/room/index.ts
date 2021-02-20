/**
 * @desc modal of room info
 * @author pika
 */
import immutable from 'immutable';
import pathToRegexp from 'path-to-regexp'
import { message } from 'antd'

// @ts-ignore
import { getRoomInfo, getUserStatusInRoom, getRoomPrivateKey, getRoomIntroduce, getQuestionnaire, sendQuestionnaire, onLine, offLine, leaveRoom, handleJoinApply, applyJoinRoom, handleRoomInvite } from '@/services/room';

import { getUserSession } from '../../utils/session'

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
  sort: number | undefined
}

const initialState: StateType = {
  // 用户进来直播间时的状态
  userStatus: {},
  // 房间问卷调查
  roomQuesVisible: false,
  // 当前用户在房间直播状态 true推流直播中 false下麦中
  roomIsBegin: false,
  // 房间其他用户上麦状态
  roomIsBeginOther: false,
  // 房间开播人摄像头状态
  roomOpenCamera: false,
  // 房间他人摄像头状态
  roomOpenCameraOther: false,
  // 房间开播人麦克风状态
  roomOpenMic: false,
  // 房间他人麦克风状态
  roomOpenMicOther: false,
  // 房间开播人演讲稿状态
  roomOpenSpeech: false,
  // 房间他人演讲稿状态
  roomOpenSpeechOther: false,
  // 房间窗口预览模式,控制主窗口跟小窗口展示内容 video:主视频优先 speech:演讲稿优先
  roomWatchMode: 'speech',
  // 直播间问卷
  roomQuesList: [],
  // 当前房间信息
  roomInfo: {},
  // 当前房间简介
  roomIntroduce: {},
  // 房间调用函数Object<key:'触发条件',value:Object<'触发的函数','参数'>>，供hooks使用
  roomFunHandler: {
    key: '',
    value: {
      name: '',
      args: []
    }
  },
  // 自定义直播间左侧详情模块菜单,sort根据后端返回
  detailMenu: [
    { menuType: 2, name: '图文直播', sort: undefined },
    // { menuType: 4, name: '产品展示', sort: undefined },
    // { menuType: 5, name: '资料下载', sort: undefined },
    { menuType: 6, name: '活动介绍', sort: undefined }
  ],
  // 自定义直播间右侧聊天模块菜单,sort根据后端返回
  chatMenu: [
    { menuType: 1, name: '互动区', sort: undefined },
    { menuType: 3, name: '问答区', sort: undefined },
    // { menuType: 7, name: '图片直播', sort: undefined }
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
    }
  },

  effects: {
    // get latest value of state by key
    *getLatestState({ payload }: ActionType, { select }: YieldType) {
      const { callback, params: { stateKey } } = payload
      const latestState = yield select(({ room }: any) => room.toJS())
      if (Array.isArray(stateKey)) {
        const result: any = {}
        stateKey.forEach((key: string) => {
          result[key] = latestState[key]
        })
        callback && callback(result)
      } else {
        callback && callback(latestState[stateKey])
      }
    },

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

    // 获取直播间秘钥
    *getRoomPrivateKey({ payload }: ActionType, { call }: YieldType) {
      yield call(getRoomPrivateKey, payload)
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
      }
    },

    // 根据房间信息获取筛选成员
    *getMembers({ payload }: ActionType, { put }: YieldType) {
      yield put({
        type: 'chat/getMemberList',
        payload: {
          ...payload
        }
      })
    },


    /**
     * @desc 成员列表排序
     */
    *sortMember({ payload: { list } }: any, { put }: any) {
      const { imAccount } = getUserSession()
      let sortList: Array<any> = []
      // find anchor
      const anchor = list.find((member: any) => member.role === 1)
      // find user is guest
      const userGuest = list.find(({ memberId, role }: any) => role === 2 && +memberId === + imAccount)

      if (anchor) {
        sortList.push(anchor)
        list = list.filter(({ role }: any) => role !== 1)
      }

      if (userGuest) {
        sortList.push(userGuest)
        list = list.filter(({ memberId }: any) => +memberId !== + imAccount)
      }

      // filter other guest & add them to sortList
      const otherGuest = list.filter(({ role }: any) => role === 2)
      sortList = sortList.concat(otherGuest)
      list = list.filter(({ role }: any) => role !== 2)

      yield put({
        type: 'chat/save',
        payload: {
          memberList: sortList.concat(list)
        }
      })
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

    },

    // 上麦直播
    *startRoom({ payload }: ActionType, { call }: YieldType) {
      yield call(onLine, payload)
    },

    // 下麦退出直播
    *exitRoom({ payload }: ActionType, { call }: YieldType) {
      yield call(offLine, payload)
    },

    // 用户离开直播间
    *leaveRoom({ payload }: ActionType, { call }: YieldType) {
      yield call(leaveRoom, payload)
    },

    // 处理房间申请上麦消息
    *handleJoinApply({ payload }: ActionType, { call }: YieldType) {
      yield call(handleJoinApply, payload)
    },

    // 获取直播间问卷
    *fetchRoomQuestion({ payload }: ActionType, { put, call }: YieldType) {
      const { status, data: { data } } = yield call(getQuestionnaire, payload)
      if (status) {
        yield put({
          type: 'save',
          payload: {
            roomQuesList: data || []
          }
        })
      }
    },

    // 发送直播间问卷
    *sendRoomQuestion({ payload }: ActionType, { call }: YieldType) {
      yield call(sendQuestionnaire, payload)
    },

    // 嘉宾申请上麦
    *applyOnLine({ payload }: ActionType, { call }: YieldType) {
      yield call(applyJoinRoom, payload)
    },

    // 嘉宾处理上麦邀请
    *handleRoomInvite({ payload }: ActionType, { call }: YieldType) {
      yield call(handleRoomInvite, payload)
    }

  },

  subscriptions: {
    setup({ history, dispatch }: SetUpType) {
      return history.listen(({ pathname }: LocationType) => {
        const locationMatch = pathToRegexp('/room/:id').exec(pathname)

        if (locationMatch) {
          const detailPromise = new Promise((resolve, reject) => {
            dispatch({
              type: 'getRoomInfo',
              payload: {
                params: {
                  roomid: locationMatch[1]
                },
                onSuccess: {
                  operate: ({ data }: Record<string, unknown>) => {
                    resolve(data)
                  }
                },
                onError: {
                  operate: () => {
                    message.error('房间信息获取失败，请稍后重试')
                    reject(false)
                  }
                }
              },
            });
          })

          const enterPromise = new Promise((resolve, reject) => {
            dispatch({
              type: 'getUserStatusInRoom',
              payload: {
                params: {
                  roomid: locationMatch[1]
                },
                onSuccess: {
                  operate: ({ data }: Record<string, unknown>) => {
                    resolve(data)
                  }
                },
                onError: {
                  operate: () => {
                    message.error('尝试进房失败，请稍后重试')
                    reject(false)
                  }
                }
              }
            })
          })

          Promise.all([detailPromise, enterPromise]).then(() => {
            dispatch({
              type: 'getMembers',
              payload: {
                params: {
                  roomid: locationMatch[1]
                }
              }
            })
          }, () => {
            throw new Error('fail to enter room | get room info ~~')
          })

        }
      })
    }
  }
}
