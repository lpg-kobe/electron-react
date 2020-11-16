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

// 拉取聊天信息
// data {
// msgId: 当前显示最后一条消息的消息id(不填就从后台最后一条开始),
// roomId: 直播间id,
// size: 消息条数(默认20) }
export function getChatList({ params, ...handler }: ParamType): any {
    return request('/group/getmoremsg', {
        method: 'post',
        body: JSON.stringify(params)
    }, handler)
}

