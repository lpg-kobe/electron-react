/**
 * @desc common model by auth in all page
 * @description user auth model, config user login status or permission
 */

import immutable from 'immutable';
// @ts-ignore
import { login } from '@/services/auth';
// @ts-ignore
import { getUserSession, removeUserSession } from '@/utils/session';

type ActionType = {
  [key: string]: any;
};

type StateType = {
  [key: string]: any;
};

type YieldType = {
  [key: string]: any;
};

type LocationType = {
  pathname: string;
};

type SetUpType = {
  history: any;
  dispatch: any;
};

export default {
  namespace: 'auth',

  state: immutable.fromJS({
    userInfo: getUserSession(),
  }),

  subscriptions: {
    setup({ history, dispatch }: SetUpType) {
      return history.listen(({ pathname }: LocationType) => {
        console.log(dispatch, pathname);
      });
    },
  },

  effects: {
    *login({ payload }: ActionType, { call }: YieldType) {
      const { data } = yield call(login, payload);
      console.log(data);
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
