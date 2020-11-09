/**
 * @desc modal of room list
 * @author pika
 */
import immutable from 'immutable';
// @ts-ignore
import { getList } from '@/services/home';

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
    // 直播列表
    list: [],
    // 直播分页
    pagination: {},
};
export default {
    namespace: 'home',
    state: immutable.fromJS(initialState),
    reducers: {
        save(state: StateType, { payload }: ActionType) {
            return state.merge(payload);
        },
    },
    effects: {
        *getList({ payload }: ActionType, { call, put }: YieldType) {
            const { status, data: { data } } = yield call(getList, payload);
            if (status) {
                yield put({
                    type: 'save',
                    payload: {
                        list: data
                    }
                })
            }
        },
    },
    subscriptions: {
        setup({ history, dispatch }: SetUpType) {
            return history.listen(({ pathname }: LocationType) => {
                if (pathname === '/') {
                    dispatch({
                        type: 'getList',
                        payload: {},
                    });
                }
            });
        },
    },
};
