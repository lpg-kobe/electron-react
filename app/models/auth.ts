/**
 * @desc common model by auth in all page
 * @description user auth model, config user login status or permission
 */

import immutable from 'immutable';
// @ts-ignore
import { login, sendSms, smsLogin } from '@/services/auth';
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

    *logout() {
      removeUserSession();
      window.location.replace('/login');
    },
  },

  reducers: {
    save(state: any, { payload }: any) {
      return state.merge(payload);
    },
  },
};
