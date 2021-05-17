/**
 * @desc common model by auth in all page
 * @description user auth model, config user login status or permission
 */

import immutable from 'immutable';
import { login, logout, sendSms, smsLogin } from '../services/auth';
import { rendererSend, RENDERER_EVENT, RENDERER_CODE } from '../utils/ipc';
import {
  getUserSession,
  removeUserSession,
} from '../utils/session';

const initialState = {
  userInfo: getUserSession(),
};

export default {
  namespace: 'auth',

  state: immutable.fromJS(initialState),

  subscriptions: {
    // setup({ history, dispatch }: SetUpType) {
    //     return history.listen(({ pathname }: LocationType) => {
    //     });
    // },
  },

  effects: {
    // 账号密码登录
    *login({ payload }: any, { call }: any) {
      yield call(login, payload);
    },

    // 验证码登录
    *smsLogin({ payload }: any, { call }: any) {
      yield call(smsLogin, payload);
    },

    *sendSms({ payload }: any, { call }: any) {
      yield call(sendSms, payload);
    },

    *logout({ payload }: any, { call }: any) {
      const { CLOSE_PAGE } = RENDERER_CODE
      yield call(logout, payload);
      removeUserSession();
      // send close event to all pages and handle by hooks,so you can do sth before close page
      rendererSend(RENDERER_EVENT.RENDERER_SEND_CODE, {
        code: CLOSE_PAGE
      })
    },
  },

  reducers: {
    save(state: any, { payload }: any) {
      return state.merge(payload);
    },
  },
};
