/**
 * @desc 直播间聊天互动&问答&成员模块model
 * @author pika
 */
import immutable from 'immutable';
// @ts-ignore
import { getChatList, sendMsg, groupDelmsg, forbitChat, shotOff, getQaaList, delQaaMsg, sendQaaMsg, updateQaaMsg, getMemberList, inviteJoinRoom, onLine, offLine, handleRoomInvite, applyJoinRoom } from '@/services/room';


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
    // 互动文本框内容
    inputValue: '',
    // 互动区聊天列表
    list: [],
    // 互动区是否有更多数据
    hasMore: false,
    // 互动区聊天窗口滚动触发条件，触发滚动时只需改变:前后缀内容即可，值取:后缀，否则会被hooks忽略
    chatScrollTop: 'scroll:0',
    // 问答区聊天窗口滚动触发条件，触发滚动时只需改变:前后缀内容即可，值取:后缀，否则会被hooks忽略
    qaaScrollTop: 'scroll:0',
    // 问答区列表
    qaaList: [],
    // 问答区是否有更多数据
    qaaHasMore: false,
    // 直播間成員列表
    memberList: []
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

        // 获取直播间问答列表
        *getQaaList({ payload }: ActionType, { put, call, select }: YieldType) {
            let { status, data: { data } } = yield call(getQaaList, payload)
            if (status) {
                data = data.reverse()
                const { qaaList, qaaScrollTop } = yield select((state: StateType) => state.chat.toJS())
                yield put({
                    type: 'save',
                    payload: {
                        qaaList: data.concat(qaaList),
                        qaaHasMore: data.length >= payload.params.size,
                        // 初始化数据时滚动到底部
                        qaaScrollTop: typeof (payload.isInit) !== 'undefined' ? 'scroll:bottom' : qaaScrollTop
                    }
                })
            }
        },

        // 删除直播间问答消息
        *delQaaMsg({ payload }: ActionType, { call }: YieldType) {
            yield call(delQaaMsg, payload)
        },

        // 发送直播间问答消息
        *sendQaaMsg({ payload }: ActionType, { call }: YieldType) {
            yield call(sendQaaMsg, payload)
        },

        // 更新直播间问答消息
        *updateQaaMsg({ payload }: ActionType, { call }: YieldType) {
            yield call(updateQaaMsg, payload)
        },

        // 获取直播间用户列表
        *getMemberList({ payload }: ActionType, { call, put }: YieldType) {
            let { status, data: { data } } = yield call(getMemberList, payload)
            if (status) {
                yield put({
                    type: 'save',
                    payload: {
                        memberList: data
                    }
                })
            }
        },

        // 邀请上麦
        *inviteJoinRoom({ payload }: ActionType, { call }: YieldType) {
            yield call(inviteJoinRoom, payload)
        },
    },
    subscriptions: {}
}