/**
 * @desc modal of room list
 * @author pika
 */
import immutable from 'immutable';
// @ts-ignore
import { getList } from '@/services/home';
// @ts-ignore
import {
    saveUserSession,
    getUserSession,
    removeUserSession,
    // @ts-ignore
} from '@/utils/session';

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
        *getList({ payload }: ActionType, { call }: YieldType) {
            yield call(getList, payload);
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
