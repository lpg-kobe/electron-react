/* eslint-disable */
import immutable from 'immutable'

export default {
  namespace: 'system',
  state: immutable.fromJS({
    system: {}
  }),
  subscriptions: {
    setup() { }
  },
  effects: {
    *fetch({ payload }, { call, put }: any) {// eslint-disable-line
      yield call()
      yield put({
        type: 'save',
        payload: {}
      });
    }
  },

  reducers: {
    save(state: any, { payload }) {// eslint-disable-line
      return state.merge(payload)
    },
  },
}
/* eslint-enable */
