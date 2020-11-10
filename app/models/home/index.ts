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
    pagination: {
        current: 1,
        pageSize: 10
    },
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
        *getList({ payload }: ActionType, { call, put, select }: YieldType) {
            const { status, data: { data: { total, items } } } = yield call(getList, payload);
            const pagination = yield select((state: any) => state.home.pagination)
            if (status) {
                yield put({
                    type: 'save',
                    payload: {
                        list: items,
                        pagination: {
                            ...pagination,
                            total,
                            current: payload.pagenum
                        }
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
                        payload: {
                            pagenum: 1,
                            pagesize: 10
                        },
                    });
                }
            });
        },
    },
};
