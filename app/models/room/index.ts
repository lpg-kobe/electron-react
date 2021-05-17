/**
 * @desc modal of room info
 * @author pika
 */
import immutable from 'immutable';
import pathToRegexp from 'path-to-regexp';
import { getStore } from '@/utils/tool'
import { Modal } from 'antd';

import {
  getRoomInfo,
  getRoomForbits,
  getUserStatusInRoom,
  tryToEnterRoom,
  getRoomPrivateKey,
  getRoomIntroduce,
  getQuestionnaire,
  sendQuestionnaire,
  onLine,
  offLine,
  leaveRoom,
  handleJoinApply,
  applyJoinRoom,
  handleRoomInvite,
} from '@/services/room';

import { getUserSession } from '../../utils/session';
import { closeWindow } from '../../utils/ipc';

interface ActionType {
  payload: any;
}

interface StateType {
  [key: string]: any;
}

interface YieldType {
  call: (payload?: any, params?: any) => void;
  put: (action: any) => void;
  select: (fn?: any) => void;
  take: () => void;
}

interface LocationType {
  pathname: string;
}

interface SetUpType {
  history: any;
  dispatch: any;
}

interface MenuType {
  menuValue: number;
  menuType: number;
  name: string;
  sort: number | undefined;
}

const initialState: StateType = {
  // 房间初始化状态
  roomPageInit: false,
  // 房间初始语言
  roomLanguage: '',
  // 用户进来直播间时的状态
  userStatus: {},
  // 房间正在上麦用户
  roomAliveUsers: [],
  // 房间禁言成员
  roomForbitUsers: [],
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
  // 房间主播插播视频状态
  roomOpenInsertVideo: false,
  // 房间他人插播视频状态
  roomOpenInsertVideoOther: false,
  // 房间窗口预览模式,控制主窗口跟小窗口展示内容 0:摄像头主视频 1:演讲稿 2:插播视频 权重 2 > 1 > 0
  roomWatchMode: 0,
  // 直播间问卷
  roomQuesList: [],
  // 当前房间信息
  roomInfo: {},
  // 当前房间简介
  roomIntroduce: {},
  // 房间调用函数Object<key:'触发条件',value:Object<'触发的函数name','参数args,'回调callback'>>，供hooks使用
  roomFunHandler: {
    key: '',
    value: {
      name: '',
      args: [],
      callback: () => { },
    },
  },
  // 自定义直播间左侧详情模块菜单,sort根据后端返回
  detailMenu: [
    { menuType: 2, name: '图文直播', sort: undefined },
    // { menuType: 4, name: '产品展示', sort: undefined },
    // { menuType: 5, name: '资料下载', sort: undefined },
    { menuType: 6, name: '活动介绍', sort: undefined },
  ],
  // 自定义直播间右侧聊天模块菜单,sort根据后端返回
  chatMenu: [
    { menuType: 1, name: '互动区', sort: undefined },
    { menuType: 3, name: '问答区', sort: undefined },
    // { menuType: 7, name: '图片直播', sort: undefined }
  ],
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
    filterMenu(
      state: StateType,
      { payload: { origin, target, key } }: ActionType
    ) {
      const value = origin
        .map((menu: MenuType) => {
          const cur = target.find((ele: any) => ele.menuType === menu.menuType);
          if (cur) {
            return {
              ...menu,
              name: cur.name,
            };
          } else {
            return menu;
          }
        })
        .filter((item: MenuType) =>
          target.some((ele: any) => ele.menuType === item.menuType)
        );
      return state.merge({
        [key]: value,
      });
    },
  },

  effects: {

    // 获取直播间详情
    *getRoomInfo({ payload }: ActionType, { select, call, put }: YieldType) {
      const { roomLanguage } = yield select(({ room }: any) => room.toJS())
      const {
        status,
        data: { data },
      } = yield call(getRoomInfo, {
        ...payload,
        headers: {
          'Accept-Language': getStore('userConfig')?.language || roomLanguage
        }
      });
      if (status) {
        const { menulist } = data;
        const { detailMenu, chatMenu } = initialState;
        // 过滤左侧详情区域菜单
        yield put({
          type: 'filterMenu',
          payload: {
            key: 'detailMenu',
            origin: menulist,
            target: detailMenu,
          },
        });
        // 过滤右侧聊天区域菜单
        yield put({
          type: 'filterMenu',
          payload: {
            key: 'chatMenu',
            origin: menulist,
            target: chatMenu,
          },
        });
        yield put({
          type: 'save',
          payload: {
            roomInfo: data,
          },
        });
      }
    },

    // 获取直播间简介
    *getRoomIntroduce({ payload }: ActionType, { select, call, put }: YieldType) {
      const { roomLanguage } = yield select(({ room }: any) => room.toJS())
      const {
        status,
        data: { data },
      } = yield call(getRoomIntroduce, {
        ...payload,
        headers: {
          'Accept-Language': getStore('userConfig')?.language || roomLanguage
        }
      });
      if (status) {
        yield put({
          type: 'save',
          payload: {
            roomIntroduce: data,
          },
        });
      }
    },

    // 获取直播间秘钥
    *getRoomPrivateKey({ payload }: ActionType, { select, call }: YieldType) {
      const { roomLanguage } = yield select(({ room }: any) => room.toJS())
      yield call(getRoomPrivateKey, {
        ...payload,
        headers: {
          'Accept-Language': getStore('userConfig')?.language || roomLanguage
        }
      });
    },

    // 用户尝试进房间
    *tryToEnterRoom({ payload }: ActionType, { select, call }: YieldType) {
      const { roomLanguage } = yield select(({ room }: any) => room.toJS())

      yield call(tryToEnterRoom, {
        ...payload,
        headers: {
          'Accept-Language': getStore('userConfig')?.language || roomLanguage
        }
      });
    },

    // 获取用户进入直播间时的信息
    *getUserStatusInRoom({ payload }: ActionType, { call, put }: YieldType) {
      const {
        status,
        data: { data },
      } = yield call(getUserStatusInRoom, payload);
      if (status) {
        yield put({
          type: 'save',
          payload: {
            userStatus: data,
          },
        });
      }
    },

    // 根据房间信息获取筛选成员
    *getMembers({ payload }: ActionType, { select, put }: YieldType) {
      const { roomLanguage } = yield select(({ room }: any) => room.toJS())

      yield put({
        type: 'chat/getMemberList',
        payload: {
          ...payload,
          headers: {
            'Accept-Language': getStore('userConfig')?.language || roomLanguage
          }
        },
      });
    },

    // 获取房间禁言用户
    *getForbitUsers({ payload }: ActionType, { select, call, put }: YieldType) {
      const { roomLanguage } = yield select(({ room }: any) => room.toJS())

      const {
        status,
        data: { data },
      } = yield call(getRoomForbits, {
        ...payload,
        headers: {
          'Accept-Language': getStore('userConfig')?.language || roomLanguage
        }
      });
      if (status) {
        yield put({
          type: 'save',
          payload: {
            roomForbitUsers: data,
          },
        });
      }
    },

    /**
     * @desc 成员列表排序
     */
    *sortMember({ payload: { list } }: any, { put }: any) {
      const { imAccount } = getUserSession();
      let sortList: Array<any> = [];
      // find anchor
      const anchor = list.find(({ role }: any) => Number(role) === 1);
      // find user is guest
      const userGuest = list.find(
        ({ memberId, role }: any) =>
          Number(role) === 2 && String(memberId) === String(imAccount)
      );

      if (anchor) {
        sortList.push(anchor);
        list = list.filter(({ role }: any) => Number(role) !== 1);
      }

      if (userGuest) {
        sortList.push(userGuest);
        list = list.filter(
          ({ memberId }: any) => String(memberId) !== String(imAccount)
        );
      }

      // filter other guest & add them to sortList
      const otherGuest = list.filter(({ role }: any) => Number(role) === 2);
      sortList = sortList.concat(otherGuest);
      list = list.filter(({ role }: any) => Number(role) !== 2);

      yield put({
        type: 'chat/save',
        payload: {
          memberList: sortList.concat(list),
        },
      });
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
          const {
            status,
            data: { data: roomIntroduce },
          } = yield call(getRoomIntroduce, payload);
          if (status) {
            yield put({
              type: 'save',
              payload: {
                roomIntroduce,
              },
            });
          }
          break;
      }
    },

    // 上麦直播
    *startRoom({ payload }: ActionType, { select, call }: YieldType) {
      const { roomLanguage } = yield select(({ room }: any) => room.toJS())

      yield call(onLine, {
        ...payload,
        headers: {
          'Accept-Language': getStore('userConfig')?.language || roomLanguage
        }
      });
    },

    // 下麦退出直播
    *exitRoom({ payload }: ActionType, { select, call }: YieldType) {
      const { roomLanguage } = yield select(({ room }: any) => room.toJS())

      yield call(offLine, {
        ...payload,
        headers: {
          'Accept-Language': getStore('userConfig')?.language || roomLanguage
        }
      });
    },

    // 用户离开直播间
    *leaveRoom({ payload }: ActionType, { select, call }: YieldType) {
      const { roomLanguage } = yield select(({ room }: any) => room.toJS())

      yield call(leaveRoom, {
        ...payload,
        headers: {
          'Accept-Language': getStore('userConfig')?.language || roomLanguage
        }
      });
    },

    // 处理房间申请上麦消息
    *handleJoinApply({ payload }: ActionType, { select, call }: YieldType) {
      const { roomLanguage } = yield select(({ room }: any) => room.toJS())

      yield call(handleJoinApply, {
        ...payload,
        headers: {
          'Accept-Language': getStore('userConfig')?.language || roomLanguage
        }
      });
    },

    // 获取直播间问卷
    *fetchRoomQuestion({ payload }: ActionType, { select, put, call }: YieldType) {
      const { roomLanguage } = yield select(({ room }: any) => room.toJS())

      const {
        status,
        data: { data },
      } = yield call(getQuestionnaire, {
        ...payload,
        headers: {
          'Accept-Language': getStore('userConfig')?.language || roomLanguage
        }
      });
      if (status) {
        yield put({
          type: 'save',
          payload: {
            roomQuesList: data || [],
          },
        });
      }
    },

    // 发送直播间问卷
    *sendRoomQuestion({ payload }: ActionType, { select, call }: YieldType) {
      const { roomLanguage } = yield select(({ room }: any) => room.toJS())

      yield call(sendQuestionnaire, {
        ...payload,
        headers: {
          'Accept-Language': getStore('userConfig')?.language || roomLanguage
        }
      });
    },

    // 嘉宾申请上麦
    *applyOnLine({ payload }: ActionType, { select, call }: YieldType) {
      const { roomLanguage } = yield select(({ room }: any) => room.toJS())

      yield call(applyJoinRoom, {
        ...payload,
        headers: {
          'Accept-Language': getStore('userConfig')?.language || roomLanguage
        }
      });
    },

    // 嘉宾处理上麦邀请
    *handleRoomInvite({ payload }: ActionType, { select, call }: YieldType) {
      const { roomLanguage } = yield select(({ room }: any) => room.toJS())

      yield call(handleRoomInvite, {
        ...payload,
        headers: {
          'Accept-Language': getStore('userConfig')?.language || roomLanguage
        }
      });
    },
  },

  subscriptions: {
    setup({ history, dispatch }: SetUpType) {
      return history.listen(async ({ pathname }: LocationType) => {
        const locationMatch = pathToRegexp('/room/:id').exec(pathname);

        if (locationMatch?.length) {
          const roomId = locationMatch[1];
          let userResult: any = {}

          // 进房
          const enterPromise = () => new Promise((resolve, reject) => {
            dispatch({
              type: 'getUserStatusInRoom',
              payload: {
                params: {
                  roomid: roomId
                },
                onSuccess: {
                  operate: ({ data }: Record<string, unknown>) => {
                    resolve(data);
                  },
                },
                onError: {
                  operate: () => {
                    // message.error('尝试进房失败，请稍后重试')
                    reject(false);
                  },
                },
              },
            });
          });

          // 房间信息
          const detailPromise = () => new Promise((resolve, reject) => {
            dispatch({
              type: 'getRoomInfo',
              payload: {
                params: {
                  roomid: roomId,
                },
                onSuccess: {
                  operate: ({ data }: Record<string, unknown>) => {
                    resolve(data);
                  },
                },
                onError: {
                  operate: () => {
                    // message.error('房间信息获取失败，请稍后重试')
                    reject(false);
                  },
                },
              },
            });
          });

          // 禁言用户
          const forbitPromise = () => new Promise((resolve, reject) => {
            dispatch({
              type: 'getForbitUsers',
              payload: {
                params: {
                  roomid: roomId,
                },
                onSuccess: {
                  operate: ({ data }: Record<string, unknown>) => {
                    resolve(data);
                  },
                },
                onError: {
                  operate: () => {
                    // message.error('获取禁言用户信息失败，请稍后重试')
                    reject(false);
                  },
                },
              },
            });
          });

          try {
            userResult = await enterPromise()
            // init room language
            dispatch({
              type: 'save',
              payload: {
                roomLanguage: userResult?.lang
              },
            });
          } catch (err) {
            Modal.warn({
              centered: true,
              okText: '确定',
              content: '网络拥堵，可稍后再次尝试进入该直播间',
              title: '提示',
              onOk: () => closeWindow(),
            });
          }

          Promise.all([detailPromise(), forbitPromise()]).then(
            ([detailResult]: any) => {
              // member list data need liveAnthorIds in detailPromise & updated after user enter room by api of enterPromise
              const {
                liveAnthorIds,
                isInstallVideoOpen,
                roomAnthorAndGuestList,
                status,
              } = detailResult;
              const { role } = userResult;
              const roomActive = Number(status) === 1;
              const roomAliveUsers = liveAnthorIds?.map((id: any) => ({
                id,
              }));
              const initVideoAvatar = roomAnthorAndGuestList?.find(
                ({ memberId }: any) =>
                  liveAnthorIds?.some(
                    (id: any) => String(id) === String(memberId)
                  )
              )?.headUrl;

              // init default avatar of live user
              dispatch({
                type: 'video/save',
                payload: {
                  videoAvatar: initVideoAvatar,
                },
              });

              // async alive user by init data
              dispatch({
                type: 'save',
                payload: {
                  roomAliveUsers
                },
              });

              // init insert video
              if (isInstallVideoOpen && roomActive) {
                dispatch({
                  type: 'video/getInsertVideo',
                  payload: {
                    params: {
                      roomid: roomId,
                    },
                    onSuccess: {
                      operate: () => {
                        // only anchor can operate insert video after room init
                        const isAnchor = Number(role) === 1;
                        const roomOpenInsertVideo =
                          isAnchor && !liveAnthorIds.length;
                        dispatch({
                          type: 'save',
                          payload: {
                            roomWatchMode: 2,
                            roomOpenInsertVideo,
                            roomOpenInsertVideoOther: !roomOpenInsertVideo,
                          },
                        });
                      },
                    },
                  },
                });
              }

              // get member list
              dispatch({
                type: 'getMembers',
                payload: {
                  params: {
                    roomid: roomId,
                  },
                  onSuccess: {
                    operate: () =>
                      dispatch({
                        type: 'save',
                        payload: {
                          roomPageInit: true,
                        },
                      }),
                  },
                },
              });
            },
            () => {
              Modal.warn({
                centered: true,
                okText: '确定',
                content: '网络拥堵，可稍后再次尝试进入该直播间',
                title: '提示',
                onOk: () => closeWindow(),
              });
            }
          );
        }
      });
    },
  },
};
