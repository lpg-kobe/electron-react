/**
 * @desc modal of room info
 * @author pika
 */
import immutable from 'immutable';
// @ts-ignore
import { getList, sendSms, smsLogin } from '@/services/auth';
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

type LocationType = {
  pathname: string;
};

type SetUpType = {
  history: any;
  dispatch: any;
};

const initialState = {};
export default {
  namespace: 'room',
  state: immutable.fromJS(initialState),
  reducers: {
    save(state: StateType, { payload }: ActionType) {
      return state.merge(payload);
    },
  },
  effects: {
    *getList({ payload }: ActionType, { call }: YieldType) {
      yield call(getList, payload);
    },
  },
  subscriptions: {
    setup({ history, dispatch }: SetUpType) {
      return history.listen(({ pathname }: LocationType) => {
        if (pathname === '/') {
          dispatch({
            type: 'getList',
            payload: {},
          });
        }
      });
    },
  },
};
