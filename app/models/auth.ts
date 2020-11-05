/**
 * @desc common model by auth in all page
 * @description user auth model, config user login status or permission
 */

import immutable from 'immutable';
// @ts-ignore
import { login, sendSms, smsLogin } from '@/services/auth';
// @ts-ignore
import {
  saveUserSession,
  getUserSession,
  removeUserSession,
  // @ts-ignore
} from '@/utils/session';

type ActionType = {
  [key: string]: any;
};

type StateType = {
  [key: string]: any;
};

type YieldType = {
  [key: string]: any;
};

// type LocationType = {
//     pathname: string;
// };

// type SetUpType = {
//     history: any;
//     dispatch: any;
// };

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
    *login({ payload }: ActionType, { call }: YieldType) {
      const {
        status,
        data: { data },
      } = yield call(login, payload);
      if (status) {
        saveUserSession(data);
      }
    },

    // 验证码登录
    *smsLogin({ payload }: ActionType, { call }: YieldType) {
      const {
        status,
        data: { data },
      } = yield call(smsLogin, payload);
      if (status) {
        saveUserSession(data);
      }
    },

    *sendSms({ payload }: ActionType, { call }: YieldType) {
      yield call(sendSms, payload);
    },

    *logout() {
      removeUserSession();
      window.location.replace('/login');
    },
  },

  reducers: {
    save(state: StateType, { payload }: ActionType) {
      return state.merge(payload);
    },
  },
};
