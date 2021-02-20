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
    // 编辑器内容，用于动态修改编辑器内容，不会同步input.onchange事件，设定数组确保每次修改都会触发hooks useEffect
    editorValue: [''],
    // 互动区聊天列表
    list: [],
    // 互动区loading
    chatLoading: true,
    // 互动区是否拉取过数据
    chatHavedFetch: false,
    // 互动区是否有更多数据
    hasMore: false,
    // 互动区聊天窗口滚动触发条件，触发滚动时只需改变:前后缀内容即可，值取:后缀，否则会被hooks忽略
    chatScrollTop: 'scroll:0',
    // 问答区聊天窗口滚动触发条件，触发滚动时只需改变:前后缀内容即可，值取:后缀，否则会被hooks忽略
    qaaScrollTop: 'scroll:0',
    // 问答区列表
    qaaList: [],
    // 问答区loading
    qaaLoading: true,
    // 问答区是否拉取过数据
    qaaHavedFetch: false,
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
        // get latest value of state by key
        *getLatestState({ payload }: ActionType, { select }: YieldType) {
            const { callback, params: { stateKey } } = payload
            const latestState = yield select(({ chat }: any) => chat.toJS())
            callback && callback(latestState[stateKey])
        },

        // 获取互动区聊天数据
        *getChatList({ payload }: ActionType, { call, put, select }: YieldType) {
            let { status, data: { data } } = yield call(getChatList, payload)
            if (status) {
                data = data.reverse()
                const { list } = yield select((state: StateType) => state.chat.toJS())
                yield put({
                    type: 'save',
                    payload: {
                        chatLoading: false,
                        chatHavedFetch: true,
                        list: data.concat(list),
                        hasMore: data.length >= payload.params.size
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
                const { qaaList } = yield select((state: StateType) => state.chat.toJS())
                yield put({
                    type: 'save',
                    payload: {
                        qaaLoading: false,
                        qaaHavedFetch: true,
                        qaaList: data.concat(qaaList),
                        qaaHasMore: data.length >= payload.params.size
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
        *getMemberList({ payload }: ActionType, { put, call, select }: YieldType) {
            let { status, data: { data: members } } = yield call(getMemberList, payload)

            if (status) {
                const {
                    roomInfo: { liveAnthorIds }
                } = yield select(({ room }: any) => room.toJS())

                // 根据正在上麦用户初始化上麦状态
                members = members.map((mem: any) => ({
                    ...mem,
                    isLive: liveAnthorIds.some((id: any) => String(id) === String(mem.memberId))
                }))

                // 成员列表排序
                yield put({
                    type: 'room/sortMember',
                    payload: {
                        list: members
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