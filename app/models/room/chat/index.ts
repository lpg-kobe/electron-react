/**
 * @desc 直播间聊天互动模块model
 * @author pika
 */
import immutable from 'immutable';
// @ts-ignore
import { getChatList, sendMsg, groupDelmsg, forbitChat, shotOff } from '@/services/room';


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
    // 文本框内容
    inputValue: '',
    // 文本禁用状态
    inputDisabled: false,
    // 互动区聊天列表
    list: [],
    // 是否更多数据
    hasMore: false,
    // 聊天窗口滚动触发条件，触发滚动时只需改变:前后缀内容即可，值取:后缀，否则会被hooks忽略
    chatScrollTop: 'scroll:0'
})
export default {
    namespace: 'chat',
    state: inititalState,
    reducers: {
        save(state: StateType, { payload }: ActionType) {
            return state.merge(payload);
        }
    },
    effects: {
        // 获取互动区聊天数据
        *getChatList({ payload }: ActionType, { call, put, select }: YieldType) {
            let { status, data: { data } } = yield call(getChatList, payload)
            if (status) {
                data = data.reverse()
                const { list, chatScrollTop } = yield select((state: StateType) => state.chat.toJS())
                yield put({
                    type: 'save',
                    payload: {
                        list: data.concat(list),
                        hasMore: data.length >= payload.params.size,
                        // 初始化数据时滚动到底部
                        chatScrollTop: typeof (payload.isInit) !== 'undefined' ? 'scroll:bottom' : chatScrollTop
                    }
                })
            }
        },

        // 发送一条新消息
        *sendMsg({ payload }: ActionType, { call }: YieldType) {
            yield call(sendMsg, payload)
        },

        // 删除群聊消息
        *deleteMsg({ payload }: ActionType, { call }: YieldType) {
            yield call(groupDelmsg, payload)
        },

        // 禁言用户
        *forbitChat({ payload }: ActionType, { call }: YieldType) {
            yield call(forbitChat, payload)
        },

        // 踢出直播间用户
        *kickOutUser({ payload }: ActionType, { call }: YieldType) {
            yield call(shotOff, payload)
        },
    },
    subscriptions: {}
}