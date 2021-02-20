/**
 * @desc 直播间演讲稿相关modal
 * @author pika
 */
import immutable from 'immutable';

// @ts-ignore
import { getSpeechList, getSpeechInfo, closeSpeech, turnSpeechPage } from '@/services/room';

type ActionType = {
  payload: any;
};

type StateType = {
  [key: string]: any;
};

type YieldType = {
  call(payload?: any, params?: any): void,
  put(action: any): void,
  select(fn?: any): void,
  take(): void
};

const initialState: StateType = {
  list: [],
  speechInfo: {},
  speechPageIndex: 1,
  speechPageLoading: true,
  speechFullScreen: false,
  speechModalShow: false
};
export default {
  namespace: 'speech',

  state: immutable.fromJS(initialState),

  reducers: {
    save(state: StateType, { payload }: ActionType) {
      return state.merge(payload);
    }
  },

  effects: {
    // 获取演讲稿
    *getList({ payload }: ActionType, { put, call }: YieldType) {
      const { status, data: { data } } = yield call(getSpeechList, payload);
      if (status) {
        yield put({
          type: 'save',
          payload: {
            list: data
          }
        })
      }
    },

    // 演讲稿详情
    *getInfo({ payload }: ActionType, { put, call, select }: YieldType) {
      const { status, data: { data } } = yield call(getSpeechInfo, payload);
      const { speechInfo } = yield select(({ speech }: any) => speech.toJS())
      if (status) {
        const { params: { speechid } } = payload
        yield put({
          type: 'save',
          payload: {
            speechPageLoading: false,
            speechInfo: {
              ...speechInfo,
              id: speechid,
              ...data
            }
          }
        })
      }
    },

    // 演讲稿翻页
    *turnPage({ payload }: ActionType, { put, call }: YieldType) {
      const { status } = yield call(turnSpeechPage, payload);
      if (status) {
        yield put({
          type: 'save',
          payload: {
            speechPageLoading: false
          }
        })
      }
    },

    // 结束演讲稿
    *closeSpeech({ payload }: ActionType, { put, call }: YieldType) {
      const { status } = yield call(closeSpeech, payload);
      if (status) {
        yield put({
          type: 'room/save',
          payload: {
            roomOpenSpeech: false,
            roomOpenSpeechOther: false
          }
        })
      }
    }
  },

  subscriptions: {

  }
}
