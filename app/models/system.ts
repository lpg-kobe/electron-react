/**
 * @desc system modal during app, base in react-redux and redux-saga
 */
import immutable from 'immutable';
// @ts-ignore
import TRTCCloud from 'trtc-electron-sdk';

export default {
  namespace: 'system',
  state: immutable.fromJS({
    system: {
      TRTCCloud,
    },
  }),
  subscriptions: {
    setup() {},
  },
  effects: {
    *fetch({ payload }: any, { call, put }: any) {
      yield call();
      yield put({
        type: 'save',
        payload,
      });
    },
  },

  reducers: {
    save(state: any, { payload }: any) {
      return state.merge(payload);
    },
  },
};
