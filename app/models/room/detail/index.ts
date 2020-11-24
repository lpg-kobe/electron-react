/**
 * @desc 直播间视频下方详情 => 活动介绍&图文直播&文件下载&产品展示modal
 * @author pika
 */
import immutable from 'immutable';
// @ts-ignore

import { getImgTextList } from '@/services/room';

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

const inititalState = immutable.fromJS({
    // 图文直播列表
    imgTextList: [],
    // 图文直播是否更多
    imgTextHasMore: true
})

export default {
    namespace: 'detail',
    state: inititalState,
    reducers: {
        save(state: StateType, { payload }: ActionType) {
            return state.merge(payload);
        }
    },
    effects: {
        // 获取互动区聊天数据
        *getImgTextList({ payload }: ActionType, { call, put }: YieldType) {
            let { status, data: { data } } = yield call(getImgTextList, payload)
            if (status) {
                console.log(data)
                yield put({

                })
            }
        },
    },
    subscriptions: {}
}