/**
 * @desc 直播间视频相关modal
 * @author pika
 */
import immutable from 'immutable';
// @ts-ignore

import { getInsertVideo, getReviewVideos, broatRoomCamera, getInsertVideos, playInsertVideo, closeInsertVideo } from '@/services/room';

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
    videoStreamSrc: '',
    // 推流端摄像头缓冲loading
    videoLoading: false,
    // 直播间当前插播视频,key值用于useeffect比对决定插播视频重载
    videoInsertInfo: {
        key: ''
    },
    // list modal show of insert video list
    videoInsertShow: false,
    // insert video list of room
    videoInsertList: [],
    // default avatar of user/remote video when close camera
    videoAvatar: ''
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
        },

        // 获取直播间插播视频列表
        *getInsertVideos({ payload }: ActionType, { call, put }: YieldType) {
            const { status, data: { data } } = yield call(getInsertVideos, payload)
            if (status) {
                yield put({
                    type: 'save',
                    payload: {
                        videoInsertList: data
                    }
                })
            }
        },

        // 获取直播间正在插播的视频信息
        *getInsertVideo({ payload }: ActionType, { call, put }: YieldType) {
            const { status, data: { data } } = yield call(getInsertVideo, payload)
            if (status) {
                yield put({
                    type: 'save',
                    payload: {
                        videoInsertInfo: {
                            ...data,
                            key: new Date().getTime()
                        }
                    }
                })
            }
        },

        // 开启插播视频
        *openInsertVideo({ payload }: ActionType, { call }: YieldType) {
            yield call(playInsertVideo, payload)
        },

        // 关闭插播视频
        *closeInsertVideo({ payload }: ActionType, { call }: YieldType) {
            yield call(closeInsertVideo, payload)
        }
    },
    subscriptions: {}
}