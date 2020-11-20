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

// 获取用户进入直播间时的信息
export function getUserStatusInRoom(params: ParamType): any {
    return request(
        `/room/entryroom?${qs.stringify(params)}`,
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

// 发送一条群消息
export function sendMsg({ params, ...handler }: ParamType): any {
    return request(
        '/group/sendmsg',
        {
            method: 'post',
            body: JSON.stringify(params)
        },
        handler
    );
}

// 删除发送过的消息，返回发送消息的状态
export function groupDelmsg({ params, ...handler }: ParamType): any {
    return request(
        '/group/deletegroupmsg',
        {
            method: 'post',
            body: JSON.stringify(params)
        },
        handler
    )
}

// 禁言或者取消禁言接口
export function forbitChat({ params, ...handler }: ParamType): any {
    return request(
        '/member/forbitchat',
        {
            method: 'post',
            body: JSON.stringify(params)
        },
        handler
    )
}

// 踢出直播间用户接口
export function shotOff({ params, ...handler }: ParamType): any {
    return request(
        '/member/shotoff',
        {
            method: 'post',
            body: JSON.stringify(params)
        },
        handler
    )
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


// 拉取直播间问答信息
export function getQaaList({ params, ...handler }: ParamType): any {
    return request('/room/question/getmoremsg', {
        method: 'post',
        body: JSON.stringify(params)
    }, handler)
}

