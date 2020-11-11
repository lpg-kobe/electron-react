/**
 * @desc modal of room info
 * @author pika
 */
import immutable from 'immutable';
import pathToRegexp from 'path-to-regexp'
// @ts-ignore
import { getRoomInfo } from '@/services/room';

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

const initialState = {
  // 当前房间信息
  roomInfo: {}
};
export default {
  namespace: 'room',
  state: immutable.fromJS(initialState),
  reducers: {
    save(state: StateType, { payload }: ActionType) {
      return state.merge(payload);
    },
  },
  effects: {
    *getRoomInfo({ payload }: ActionType, { call, put }: YieldType) {
      debugger
      const { status, data: { data } } = yield call(getRoomInfo, payload);
      if (status) {
        yield put({
          type: 'save',
          payload: {
            roomInfo: data
          }
        })
      }
    },
  },
  subscriptions: {
    setup({ history, dispatch }: SetUpType) {
      return history.listen(({ pathname }: LocationType) => {
        const locationMatch = pathToRegexp('/room/:id').exec(pathname)
        debugger
        if (locationMatch) {
          dispatch({
            type: 'getRoomInfo',
            payload: {
              id: locationMatch[1]
            },
          });
        }
      });
    },
  },
};
