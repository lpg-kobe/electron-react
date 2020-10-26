/* eslint-disable */
import immutable from 'immutable'

export default {
  namespace: 'system',
  state: immutable.fromJS({

  }),
  subscriptions: {
    setup() { }
  },
  effects: {
    *fetch({ payload }, { call, put }) {// eslint-disable-line
      yield call()
      yield put({
        type: 'save',
        payload: {}
      });
    }
  },

  reducers: {
    save(state, { payload }) {// eslint-disable-line
      return state.merge(payload)
    },
  },
}
/* eslint-enable */
