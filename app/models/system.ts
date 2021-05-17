/**
 * @desc system modal during app, base in react-redux and redux-saga
 */

/* eslint require-yield: "off" */
/* eslint-env es6 */

import immutable from 'immutable';
import pathToRegexp from 'path-to-regexp';
import { Modal } from 'antd';
import {
  getTableData,
  sendHeartBeat,
  sendLoginHeartBeat,
  getLanguage
} from '@/services/common';
import { SDK_APP_ID } from '@/constants';

import TrtcElectronVideocast, { EVENT } from '../sdk/trtc-electron-videocast';
import {
  RENDERER_EVENT,
  rendererSend,
  rendererListen,
  RENDERER_CODE,
  getCurrentWindow,
} from '../utils/ipc';
import { loopToInterval, setStore } from '../utils/tool';
import KeyCode from '../utils/keyCode';
import { RouteConfigType } from '../utils/type';
import CheckNet from '../utils/checkNet';
import { getUserSession, removeUserSession } from '../utils/session';
import logger from '../utils/log';
import routeConfigs from '../route.config';

const OFweekLog = logger('______System Modal______');

const initialState = {
  // status of network during app run
  networkStatus: true,
  // map define of quality in trtc
  qualityMap: ['未知', '最好', '好', '一般', '差', '很差', '不可用'],
  // detail quaility of trtc network
  netQuality: 0,
  // collection of statistics in trtc
  statistics: {},
  // system trtc instance,login im。目前腾旭trtc-sdk只提供trtcInstance单例，因此
  // 创建多个rtcClient也只会共用相同的trtcInstance
  rtcClient: null,
  // system table contain all table in route component
  table: {},
  // set tableId in order to update after Table change
  updateTableId: '',
};

interface LocationType {
  pathname: string;
}

interface SetUpType {
  history: any;
  dispatch: (action: any) => void;
}

interface InitRtcPayload {
  eventHandlers: any; // 订阅的事件Object
}

interface InitRtcParams {
  payload: InitRtcPayload;
}

export default {
  namespace: 'system',
  state: immutable.fromJS(initialState),
  subscriptions: {
    setup({ history, dispatch }: SetUpType) {
      // check network status
      dispatch({
        type: 'checkNetwork',
        payload: {
          dispatch,
        },
      });
      // register common event of send_code from renderer
      dispatch({
        type: 'registerSendCode',
        payload: {
          dispatch,
        },
      });
      // register common event of key_code
      dispatch({
        type: 'registerKeyCode',
        payload: {},
      });
      // auto fetch language by ip address
      dispatch({
        type: 'getLanguage',
        payload: {}
      })

      return history.listen(({ pathname }: LocationType) => {
        // find current route config by path and to sth width route setting
        const curRoute = routeConfigs.find((route: RouteConfigType) =>
          pathToRegexp(route.path).exec(pathname)
        );
        if (!curRoute) {
          return;
        }

        const { heartBeat, initTrtc } = curRoute;
        heartBeat &&
          dispatch({
            type: 'checkUserOnline',
            payload: {
              dispatch,
            },
          });
        initTrtc &&
          dispatch({
            type: 'initRtcClient',
            payload: {},
          });
      });
    },
  },
  effects: {
    // check network status
    *checkNetwork({ payload }: any) {
      const {
        EVENT: { network },
      } = CheckNet;
      const { dispatch } = payload;
      CheckNet.on(network, ({ data: { status } }: any) => {
        dispatch({
          type: 'getLatestState',
          payload: {
            params: {
              namespace: 'system',
              stateKey: 'networkStatus',
            },
            callback: (networkStatus: boolean) => {
              if (status) {
                // connected
                !networkStatus &&
                  dispatch({
                    type: 'save',
                    payload: {
                      networkStatus: true,
                    },
                  });
              } else {
                // network error
                networkStatus &&
                  dispatch({
                    type: 'save',
                    payload: {
                      networkStatus: false,
                    },
                  });
              }
            },
          },
        });
      });
    },

    // register common event of send code from main process
    *registerSendCode({ payload: { dispatch } }: any) {
      const { RENDERER_SEND_CODE } = RENDERER_EVENT
      const { CLOSE_PAGE, KICKED_OUT } = RENDERER_CODE;

      rendererListen(
        RENDERER_SEND_CODE,
        (event: any, { code, data }: any) => {
          OFweekLog.info('receive code from renderer in system:', code);
          const codeAction: any = {
            // user login by other platform
            [KICKED_OUT]: () => {
              dispatch({
                type: 'getLatestState',
                payload: {
                  params: {
                    namespace: 'system',
                    stateKey: 'rtcClient',
                  },
                  callback: (client: any) => {
                    client?.logoutIm();
                  },
                },
              });
              Modal.warn({
                okText: '确定',
                centered: true,
                content: data?.message
                  ? data.message
                  : '您的账号在其它设备登录，您已下线',
                title: '提示',
                onOk: () => {
                  removeUserSession();
                  rendererSend(RENDERER_SEND_CODE, {
                    code: CLOSE_PAGE,
                  });
                },
                onCancel: () => {
                  removeUserSession();
                  rendererSend(RENDERER_SEND_CODE, {
                    code: CLOSE_PAGE,
                  });
                },
              });
            }
          };
          codeAction[code]?.();
        }
      );
    },

    // register common event of keyCode
    *registerKeyCode() {
      const systemKeyCode = new KeyCode();
      const {
        EVENT: { devtool },
      } = systemKeyCode;
      systemKeyCode.on(devtool, () => {
        getCurrentWindow().webContents.openDevTools({ mode: 'detach' });
      });
    },

    // get language by ip
    *getLanguage({ payload }: any, { call }: any) {
      const { status, data: { data } } = yield call(getLanguage, payload)
      status && setStore('language', data)
    },

    // get latest value of state by key & namespace
    *getLatestState({ payload }: any, { select }: any) {
      const {
        callback,
        params: { stateKey, namespace },
      } = payload;
      let latestState: any = null;

      switch (true) {
        case Boolean(Array.isArray(stateKey)):
          latestState = yield select((state: any) => state[namespace].toJS());
          const result: any = {};
          stateKey.forEach((key: string) => {
            result[key] = latestState[key];
          });
          callback?.(result);
          break;

        case Boolean(stateKey && typeof stateKey === 'string'):
          latestState = yield select((state: any) => state[namespace].toJS());
          callback?.(latestState[stateKey]);
          break;

        case Boolean(Array.isArray(namespace)):
          const namespaces: any = {};
          yield select((state: any) => {
            namespace.forEach((name: string) => {
              namespaces[name] = state[name].toJS();
            });
            return namespaces;
          });
          callback?.(namespaces);
          break;

        default:
          latestState = yield select((state: any) => state[namespace].toJS());
          callback?.(latestState);
          break;
      }
    },

    // check user online status
    *checkUserOnline({ payload: { dispatch } }: any) {
      const { imAccount } = getUserSession();
      let timer: any = null;
      timer = loopToInterval(
        () =>
          new Promise((resolve, reject) => {
            dispatch({
              type: 'sendLoginUserHB',
              payload: {
                params: {
                  memberid: imAccount,
                },
                onSuccess: {
                  operate: () => resolve(true),
                },
                onError: {
                  operate: () => reject(false),
                },
              },
            });
          }),
        timer,
        8 * 1000
      );
    },

    // 发送登录用户心跳维持登录态
    *sendLoginUserHB({ payload }: any, { call }: any) {
      yield call(sendLoginHeartBeat, payload);
    },

    // check and load sdk ,this rtcClient is provide local during app run
    *initRtcClient(
      { payload: { eventHandlers } }: InitRtcParams,
      { put, select }: any
    ) {
      const { rtcClient } = yield select((state: any) => state.system.toJS());
      const { userSig, imAccount } = getUserSession();
      if (!rtcClient) {
        // this trtc use during app running and had loged in im,whtch you can handle sth as messageReceived or other
        const client = new TrtcElectronVideocast({
          sdkAppId: SDK_APP_ID,
          userId: imAccount,
          imLogin: true,
          userSig,
        });
        const {
          tim: { KICKED_OUT },
        } = EVENT;

        // web已开启多端登录，该账号剔除功能只会在跨端登录时候接收响应，同端登录需通过发送login heartBeat实现登录剔除功能
        client.on(KICKED_OUT, () => {
          OFweekLog.info('user has been knicked out from other platform:');

          const { KICKED_OUT: knickOut } = RENDERER_CODE;
          rendererSend(RENDERER_EVENT.RENDERER_SEND_CODE, {
            code: knickOut,
          });
        });

        yield put({
          type: 'save',
          payload: {
            rtcClient: client,
          },
        });

        // bind event after inited trtc when setted eventHandlers
        if (eventHandlers) {
          Object.entries(eventHandlers).forEach(([eventName, handler]) => {
            client.on(eventName, handler);
          });
        }
      }
    },
    // bind event of system-rtcClient
    *bindRtcEvent({ payload }: any) {
      const { target, eventName, handler } = payload;
      target.on(eventName, handler);
    },
    // bind event of system-rtcClient
    *unBindRtcEvent({ payload }: any) {
      const { target, eventName, handler } = payload;
      target.off(eventName, handler);
    },
    // 自动拉取表格数据
    *getTableData({ payload }: any, { call, put, select }: any) {
      const {
        data: { data, total },
      } = yield call(getTableData, payload);
      // @ts-ignore
      const { table } = yield select((state: any) => state.system.toJS());
      // @ts-ignore
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
    },
  },

  reducers: {
    save(state: any, { payload }: any) {
      return state.merge(payload);
    },
  },
};
