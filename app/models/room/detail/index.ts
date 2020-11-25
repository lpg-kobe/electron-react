/**
 * @desc 直播间视频下方详情 => 活动介绍&图文直播&文件下载&产品展示modal
 * @author pika
 */
import immutable from 'immutable';
// @ts-ignore

import { getImgTextList, sendImgText, updateImgText, delImgText } from '@/services/room';

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
    // 图文直播列表
    imgTextList: [],
    // 图文直播是否更多
    imgTextHasMore: true,
    // 图文loading
    imgTextLoading: true
}

export default {
    namespace: 'detail',
    state: immutable.fromJS(inititalState),
    reducers: {
        save(state: StateType, { payload }: ActionType) {
            return state.merge(payload);
        }
    },
    effects: {
        // 获取直播间
        *getImgTextList({ payload }: ActionType, { call, put, select }: YieldType) {
            let { status, data: { data } } = yield call(getImgTextList, payload)
            const { imgTextList } = yield select(({ detail }: StateType) => detail.toJS())
            if (status) {
                yield put({
                    type: 'save',
                    payload: {
                        imgTextList: [...imgTextList, ...data],
                        imgTextHasMore: data.length >= payload.size
                    }
                })
            }
        },

        // 发布图文消息
        *sendImgTextMsg({ payload }: ActionType, { call }: YieldType) {
            yield call(sendImgText, payload)
        },

        // 修改图文消息
        *updateImgTextMsg({ payload }: ActionType, { call }: YieldType) {
            yield call(updateImgText, payload)
        },

        // 删除图文消息
        *delImgTextMsg({ payload }: ActionType, { call }: YieldType) {
            yield call(delImgText, payload)
        },
    },
    subscriptions: {}
}