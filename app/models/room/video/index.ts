/**
 * @desc 直播间视频开播相关modal
 * @author pika
 */
import immutable from 'immutable';
// @ts-ignore

import { getReviewVideos, broatRoomCamera } from '@/services/room';

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

const inititalState = {
    // 回放视频列表
    videoReviewList: [],
    // 视频推流类型 camera摄像头 video摄像机
    videoStreamType: 'camera',
    // 视频推流播放地址，用于观众端
    videoStreamSrc: ''
}

export default {
    namespace: 'video',
    state: immutable.fromJS(inititalState),
    reducers: {
        save(state: StateType, { payload }: ActionType) {
            return state.merge(payload);
        }
    },
    effects: {
        // 获取直播间回顾视频
        *getReviewVideos({ payload }: ActionType, { call, put }: YieldType) {
            const { status, data: { data } } = yield call(getReviewVideos, payload)
            if (status) {
                yield put({
                    type: 'save',
                    payload: {
                        videoReviewList: data
                    }
                })
            }
        },

        // 主播发送摄像头改变广播
        *broatRoomCamera({ payload }: ActionType, { call }: YieldType) {
            yield call(broatRoomCamera, payload)
        }
    },
    subscriptions: {}
}