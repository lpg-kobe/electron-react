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
        `/web/room/getroom?${qs.stringify(params)}`,
        { method: 'get' }
    );
}

// 获取用户进入直播间时的信息
export function getUserStatusInRoom(params: ParamType): any {
    return request(
        `/web/room/entryroom?${qs.stringify(params)}`,
        { method: 'get' }
    );
}

// 获取直播间活动介绍
export function getRoomIntroduce(params: ParamType): any {
    return request(
        `/web/room/getroomsummary?${qs.stringify(params)}`,
        { method: 'get' }
    );
}

// 发送一条群消息
export function sendMsg({ params, ...handler }: ParamType): any {
    return request(
        '/web/group/sendmsg',
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
        '/web/group/deletegroupmsg',
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
        '/web/member/forbitchat',
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
        '/web/member/shotoff',
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
    return request('/web/group/getmoremsg', {
        method: 'post',
        body: JSON.stringify(params)
    }, handler)
}


// 拉取直播间问答信息
export function getQaaList({ params, ...handler }: ParamType): any {
    return request('/web/room/question/getmoremsg', {
        method: 'post',
        body: JSON.stringify(params)
    }, handler)
}

// 删除直播间问答消息
export function delQaaMsg({ params, ...handler }: ParamType): any {
    return request('/web/room/question/deletemsg', {
        method: 'post',
        body: JSON.stringify(params)
    }, handler)
}

// 发送问答消息
export function sendQaaMsg({ params, ...handler }: ParamType): any {
    return request('/web/room/question/sendmsg', {
        method: 'post',
        body: JSON.stringify(params)
    }, handler)
}

// 更新问答消息
export function updateQaaMsg({ params, ...handler }: ParamType): any {
    return request('/web/room/question/updateanswer', {
        method: 'post',
        body: JSON.stringify(params)
    }, handler)
}

// 获取直播间成员
export function getMemberList({ params, ...handler }: ParamType): any {
    return request(`/web/member/getroomuserlist?${qs.stringify(params)}`, {
    }, handler)
}

// 开始直播
export function onLine({ params, ...handler }: ParamType): any {
    return request('/web/room/startroom', {
        method: 'post',
        body: JSON.stringify(params)
    }, handler)
}

// 下麦
export function offLine({ params, ...handler }: ParamType): any {
    return request(`/web/room/overroom?${qs.stringify(params)}`, {
    }, handler)
}

// 主播邀请上麦直播
export function inviteJoinRoom({ params, ...handler }: ParamType): any {
    return request(`/web/room/invitelive?${qs.stringify(params)}`, {
    }, handler)
}

// 嘉宾处理直播邀请
export function handleRoomInvite({ params, ...handler }: ParamType): any {
    return request(`/web/room/guestauditlive?${qs.stringify(params)}`, {
    }, handler)
}

// 嘉宾申请直播
export function applyJoinRoom({ params, ...handler }: ParamType): any {
    return request(`/web/room/auditlive?${qs.stringify(params)}`, {
    }, handler)
}

// 获取图文直播数据
export function getImgTextList({ params, ...handler }: ParamType): any {
    return request('/web/room/imagetext/getmoremsg', {
        method: 'post',
        body: JSON.stringify(params)
    }, handler)
}

// 发送图文消息
export function sendImgText({ params, ...handler }: ParamType): any {
    return request('/web/room/imagetext/sendmsg', {
        method: 'post',
        body: JSON.stringify(params)
    }, handler)
}

// 更新图文消息
export function updateImgText({ params, ...handler }: ParamType): any {
    return request('/web/room/imagetext/updateimagetext', {
        method: 'post',
        body: JSON.stringify(params)
    }, handler)
}

// 删除图文消息
export function delImgText({ params, ...handler }: ParamType): any {
    return request('/web/room/imagetext/deletemsg', {
        method: 'post',
        body: JSON.stringify(params)
    }, handler)
}



