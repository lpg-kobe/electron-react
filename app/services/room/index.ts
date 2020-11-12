/**
 * @desc api services of room info page
 */

// @ts-ignore
import request from '@/utils/request';
// @ts-ignore
import qs from 'qs';

type ParamType = {
    [key: string]: any;
};

// 获取直播间信息
export function getRoomInfo(params: ParamType): any {
    return request(
        `/room/getroom?${qs.stringify(params)}`,
        { method: 'get' }
    );
}

// 获取直播间活动介绍
export function getRoomIntroduce(params: ParamType): any {
    return request(
        `/room/getroomsummary?${qs.stringify(params)}`,
        { method: 'get' }
    );
}
