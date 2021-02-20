/**
 * @desc system modal during app, base in react-redux and redux-saga
 */
import immutable from 'immutable';
import pathToRegexp from 'path-to-regexp'
import { Modal } from 'antd'
import TrtcElectronVideocast, { EVENT } from '../sdk/trtc-electron-videocast'
// @ts-ignore
import { getTableData, sendHeartBeat, sendLoginHeartBeat } from '@/services/common';
// @ts-ignore
import { SDK_APP_ID } from '@/constants'
import { RENDERER_EVENT, rendererSend, RENDERER_CODE } from '../utils/ipc'
import { loopToInterval } from '../utils/tool'
import { RouteConfigType } from '../utils/type'
import {
  getUserSession,
  removeUserSession
} from '../utils/session';
import routeConfigs from '../route.config'

const initialState = {
  // system trtc instance,login im。目前腾旭trtc-sdk只提供trtcInstance单例，因此
  // 创建多个rtcClient也只会共用相同的trtcInstance
  rtcClient: null,
  // system table contain all table in route component
  table: {},
  // set tableId in order to update after Table change
  updateTableId: '',
};

type LocationType = {
  pathname: string;
};

type SetUpType = {
  history: any;
  dispatch(action: any): void;
};

interface InitRtcPayload {
  eventHandlers: any, // 订阅的事件Object
}

interface InitRtcParams {
  payload: InitRtcPayload
}

export default {
  namespace: 'system',
  state: immutable.fromJS(initialState),
  subscriptions: {
    setup({ history, dispatch }: SetUpType) {
      return history.listen(({ pathname }: LocationType) => {
        // find current route config by path and to sth width route setting
        const curRoute = routeConfigs.find((route: RouteConfigType) => pathToRegexp(route.path).exec(pathname))
        if (!curRoute) {
          return
        }

        const { heartBeat, initTrtc } = curRoute
        heartBeat && dispatch({
          type: 'checkUserOnline',
          payload: {
            dispatch
          }
        })
        initTrtc && dispatch({
          type: 'initRtcClient',
          payload: {}
        })
      })
    },
  },
  effects: {
    // get latest value of state by key & namespace
    *getLatestState({ payload }: any, { select }: any) {

      const { callback, params: { stateKey, namespace } } = payload
      let latestState: any = null

      switch (true) {
        case Boolean(Array.isArray(stateKey)):
          latestState = yield select((state: any) => state[namespace].toJS())
          const result: any = {}
          stateKey.forEach((key: string) => {
            result[key] = latestState[key]
          })
          callback && callback(result)
          break;

        case Boolean(stateKey && typeof stateKey === 'string'):
          latestState = yield select((state: any) => state[namespace].toJS())
          callback && callback(latestState[stateKey])
          break;

        case Boolean(Array.isArray(namespace)):
          const namespaces: any = {}
          yield select((state: any) => {
            namespace.forEach((name: string) => {
              namespaces[name] = state[name].toJS()
            });
            return namespaces
          })
          callback && callback(namespaces)
          break;

        default:
          latestState = yield select((state: any) => state[namespace].toJS())
          callback && callback(latestState)
          break;
      }
    },

    // check user online status
    *checkUserOnline({ payload: { dispatch } }: any) {
      const { imAccount } = getUserSession()
      let timer: any = null
      let errorModal: any = null
      timer = loopToInterval(() => new Promise((resolve, reject) => {
        dispatch({
          type: 'sendLoginUserHB',
          payload: {
            params: {
              memberid: imAccount
            },
            onSuccess: {
              operate: () => {
                resolve(true)
              }
            },
            onError: {
              operate: () => {

                if (errorModal) {
                  return
                }

                const { CLOSE_PAGE } = RENDERER_CODE
                errorModal = Modal.warn({
                  centered: true,
                  content: '您的账号在其它设备登录，您已下线',
                  title: '提示',
                  onOk: () => {
                    removeUserSession()
                    rendererSend(RENDERER_EVENT.RENDERER_SEND_CODE, {
                      code: CLOSE_PAGE
                    })
                  },
                  onCancel: () => {
                    removeUserSession()
                    rendererSend(RENDERER_EVENT.RENDERER_SEND_CODE, {
                      code: CLOSE_PAGE
                    })
                  }
                })
                reject(false)
              }
            }
          }
        })
      }), timer, 1 * 1000)
    },

    // 发送登录用户心跳维持登录态
    *sendLoginUserHB({ payload }: any, { call }: any) {
      yield call(sendLoginHeartBeat, payload)
    },

    // check and load sdk ,this rtcClient is provide local during app run
    *initRtcClient({ payload: { eventHandlers } }: InitRtcParams, { put, select }: any) {
      const { rtcClient } = yield select((state: any) => state.system.toJS());
      const { userSig, imAccount } = getUserSession();
      if (!rtcClient) {
        // this trtc use during app running and had loged in im,whtch you can handle sth as messageReceived or other
        const client = new TrtcElectronVideocast({
          sdkAppId: SDK_APP_ID,
          userId: imAccount,
          imLogin: true,
          userSig
        })
        const { tim: { KICKED_OUT } } = EVENT;

        // web已开启多端登录，该账号剔除功能只会在跨端登录时候接收响应，同端登录需通过发送login heartBeat实现登录剔除功能
        client.on(KICKED_OUT, () => {
          const { CLOSE_PAGE } = RENDERER_CODE
          Modal.warn({
            centered: true,
            content: '您的账号在其它设备登录，您已下线',
            title: '提示',
            onOk: () => {
              removeUserSession()
              rendererSend(RENDERER_EVENT.RENDERER_SEND_CODE, {
                code: CLOSE_PAGE
              })
            },
            onCancel: () => {
              removeUserSession()
              rendererSend(RENDERER_EVENT.RENDERER_SEND_CODE, {
                code: CLOSE_PAGE
              })
            }
          })
        })

        yield put({
          type: 'save',
          payload: {
            rtcClient: client
          }
        })

        // bind event after inited trtc when setted eventHandlers
        if (eventHandlers) {
          Object.entries(eventHandlers).forEach(([eventName, handler]) => {
            client.on(eventName, handler)
          })
        }

      }
    },

    // bind event of system-rtcClient
    *bindRtcEvent({ payload }: any) {
      const { target, eventName, handler } = payload
      target.on(eventName, handler)
    },

    // bind event of system-rtcClient
    *unBindRtcEvent({ payload }: any) {
      const { target, eventName, handler } = payload
      target.off(eventName, handler)
    },

    // 自动拉取表格数据
    *getTableData({ payload }: any, { call, put, select }: any) {
      const {
        data: { data, total },
      } = yield call(getTableData, payload);
      const { table } = yield select((state: any) => state.system.toJS());
      const pagination = yield select((state: any) =>
        state.system.getIn(['table', payload.tableId, 'pagination'])
      );
      yield put({
        type: 'save',
        payload: {
          updateTableId: new Date().getTime(),
          table: {
            ...table,
            [payload.tableId]: {
              data,
              pagination: {
                ...pagination,
                total,
                current: payload.page || 1,
              },
            },
          },
        },
      });
    },

    // 发送房间成员在线心跳
    *sendHeartBeat({ payload }: any, { call }: any) {
      yield call(sendHeartBeat, payload);
    }
  },

  reducers: {
    save(state: any, { payload }: any) {
      return state.merge(payload);
    },
  },
};
