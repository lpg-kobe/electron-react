/**
 * @desc api services of room info page
 */

// @ts-ignore
import request from '@/utils/request';
// @ts-ignore
import qs from 'qs';

// 获取直播间信息
export function getRoomInfo({ params, ...handler }: any): any {
    return request(
        `/web/room/getroom?${qs.stringify(params)}`,
        { method: 'get' },
        handler
    );
}

// 获取用户进入直播间时的信息
export function getUserStatusInRoom({ params, ...handler }: any): any {
    return request(
        `/web/room/entryroom?${qs.stringify(params)}`,
        { method: 'get' },
        handler
    );
}

// 离开直播间
export function leaveRoom({ params, ...handler }: any): any {
    return request(
        `/web/room/leaveroom?${qs.stringify(params)}`,
        { method: 'get' },
        handler
    );
}

// 获取直播间活动介绍
export function getRoomIntroduce(params: any): any {
    return request(
        `/web/room/getroomsummary?${qs.stringify(params)}`,
        { method: 'get' }
    );
}

// 获取进入直播间秘钥
export function getRoomPrivateKey({ params, ...handler }: any): any {
    return request(
        `/web/room/gettrtcprivatesig?${qs.stringify(params)}`,
        { method: 'get' },
        handler
    );
}

// 发送一条群消息
export function sendMsg({ params, ...handler }: any): any {
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
export function groupDelmsg({ params, ...handler }: any): any {
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
export function forbitChat({ params, ...handler }: any): any {
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
export function shotOff({ params, ...handler }: any): any {
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
export function getChatList({ params, ...handler }: any): any {
    return request('/web/group/getmoremsg', {
        method: 'post',
        body: JSON.stringify(params)
    }, handler)
}


// 拉取直播间问答信息
export function getQaaList({ params, ...handler }: any): any {
    return request('/web/room/question/getmoremsg', {
        method: 'post',
        body: JSON.stringify(params)
    }, handler)
}

// 删除直播间问答消息
export function delQaaMsg({ params, ...handler }: any): any {
    return request('/web/room/question/deletemsg', {
        method: 'post',
        body: JSON.stringify(params)
    }, handler)
}

// 发送问答消息
export function sendQaaMsg({ params, ...handler }: any): any {
    return request('/web/room/question/sendmsg', {
        method: 'post',
        body: JSON.stringify(params)
    }, handler)
}

// 更新问答消息
export function updateQaaMsg({ params, ...handler }: any): any {
    return request('/web/room/question/updateanswer', {
        method: 'post',
        body: JSON.stringify(params)
    }, handler)
}

// 获取直播间成员
export function getMemberList({ params, ...handler }: any): any {
    return request(`/web/member/getroomuserlist?${qs.stringify(params)}`, {
    }, handler)
}

// 开始直播
export function onLine({ params, ...handler }: any): any {
    return request(`/web/room/startroom?${qs.stringify(params)}`, {
    }, handler)
}

// 下麦
export function offLine({ params, ...handler }: any): any {
    return request(`/web/room/overroom?${qs.stringify(params)}`, {
    }, handler)
}

// 发送摄像头改变广播
export function broatRoomCamera({ params, ...handler }: any): any {
    return request(`/web/room/broatroomcamera?${qs.stringify(params)}`, {
    }, handler)
}

// 主播邀请上麦直播
export function inviteJoinRoom({ params, ...handler }: any): any {
    return request(`/web/room/invitelive?${qs.stringify(params)}`, {
    }, handler)
}

// 嘉宾处理直播邀请
export function handleRoomInvite({ params, ...handler }: any): any {
    return request(`/web/room/guestauditlive?${qs.stringify(params)}`, {
    }, handler)
}

// 嘉宾申请上麦直播
export function applyJoinRoom({ params, ...handler }: any): any {
    return request(`/web/room/auditlive?${qs.stringify(params)}`, {
    }, handler)
}

// 主播处理上麦申请
export function handleJoinApply({ params, ...handler }: any): any {
    return request(`/web/room/adminauditlive?${qs.stringify(params)}`, {
    }, handler)
}

// 获取图文直播数据
export function getImgTextList({ params, ...handler }: any): any {
    return request('/web/room/imagetext/getmoremsg', {
        method: 'post',
        body: JSON.stringify(params)
    }, handler)
}

// 发送图文消息
export function sendImgText({ params, ...handler }: any): any {
    return request('/web/room/imagetext/sendmsg', {
        method: 'post',
        body: JSON.stringify(params)
    }, handler)
}

// 更新图文消息
export function updateImgText({ params, ...handler }: any): any {
    return request('/web/room/imagetext/updateimagetext', {
        method: 'post',
        body: JSON.stringify(params)
    }, handler)
}

// 删除图文消息
export function delImgText({ params, ...handler }: any): any {
    return request('/web/room/imagetext/deletemsg', {
        method: 'post',
        body: JSON.stringify(params)
    }, handler)
}

// 获取直播间回放视频
export function getReviewVideos({ params, ...handler }: any): any {
    return request(`/web/room/video/getreviewlist?${qs.stringify(params)}`, {}, handler)
}

// 获取直播间问卷调查
export function getQuestionnaire({ params, ...handler }: any): any {
    return request(`/web/room/questionnaire/getroomquestionnairelist?${qs.stringify(params)}`, {}, handler)
}

// 发送直播间问卷
export function sendQuestionnaire({ params, ...handler }: any): any {
    return request(`/web/room/questionnaire/sendquestionnaire?${qs.stringify(params)}`, {}, handler)
}

// 获取直播间演讲稿
export function getSpeechList({ params, ...handler }: any): any {
    return request(`/web/room/speech/getlist?${qs.stringify(params)}`, {}, handler)
}

// 获取演讲稿详情
export function getSpeechInfo({ params, ...handler }: any): any {
    return request(`/web/room/speech/getdetail?${qs.stringify(params)}`, {}, handler)
}

// 结束播放演讲稿
export function closeSpeech({ params, ...handler }: any): any {
    return request(`/web/room/stopspeech?${qs.stringify(params)}`, {}, handler)
}

// 演讲稿翻页
export function turnSpeechPage({ params, ...handler }: any): any {
    return request('/web/room/turnspeech', {
        method: 'post',
        body: JSON.stringify(params)
    }, handler)
}



