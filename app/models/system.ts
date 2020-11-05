/**
 * @desc system modal during app, base in react-redux and redux-saga
 */
import immutable from 'immutable';
// @ts-ignore
import TRTCElectronVideoCast from '@/sdk/trtc-electron-videocast';
// @ts-ignore
import { getTableData } from '@/services/common';

const initialState = {
  TRTCCloud: TRTCElectronVideoCast,
  // system table contain all table in route component
  table: {},
  // set tableId in order to update after Table change
  updateTableId: '',
};

export default {
  namespace: 'system',
  state: immutable.fromJS(initialState),
  subscriptions: {
    setup() {},
  },
  effects: {
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
  },

  reducers: {
    save(state: any, { payload }: any) {
      return state.merge(payload);
    },
  },
};
