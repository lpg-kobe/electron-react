/**
 * @desc api services of room info page
 * @description 仅房间内所有接口需要设置Accept-Language请求头且权重 < 用户设置userConfig.language，房间语言来源于api-entryroom
 */

import request from '@/utils/request';
import qs from 'qs';

// 获取直播间信息
export function getRoomInfo({ params, headers, ...handler }: any): any {
  return request(
    `/web/room/getroom?${qs.stringify(params)}`,
    {
      method: 'get',
      headers
    },
    handler
  );
}

// 获取用户进入直播间时的信息
export function getUserStatusInRoom({ params, ...handler }: any): any {
  return request(
    `/web/room/entryroom?${qs.stringify(params)}`,
    {
      method: 'get'
    },
    handler
  );
}

// 尝试进房间
export function tryToEnterRoom({ params, headers, ...handler }: any): any {
  return request(
    `/web/member/checkuserisshotoff?${qs.stringify(params)}`,
    {
      method: 'get',
      headers
    },
    handler
  );
}

// 离开直播间
export function leaveRoom({ params, headers, ...handler }: any): any {
  return request(
    `/web/room/leaveroom?${qs.stringify(params)}`,
    {
      method: 'get',
      headers
    },
    handler
  );
}

// 获取直播间活动介绍
export function getRoomIntroduce({ params, headers, ...handler }: any): any {
  return request(`/web/room/getroomsummary?${qs.stringify(params)}`, {
    method: 'get',
    headers,
  }, handler);
}

// 获取进入直播间秘钥
export function getRoomPrivateKey({ params, headers, ...handler }: any): any {
  return request(
    `/web/room/gettrtcprivatesig?${qs.stringify(params)}`,
    {
      method: 'get',
      headers
    },
    handler
  );
}

// 发送一条群消息
export function sendMsg({ params, headers, ...handler }: any): any {
  return request(
    '/web/group/sendmsg',
    {
      method: 'post',
      headers,
      body: JSON.stringify(params),
    },
    handler
  );
}

// 删除发送过的消息，返回发送消息的状态
export function groupDelmsg({ params, headers, ...handler }: any): any {
  return request(
    '/web/group/deletegroupmsg',
    {
      method: 'post',
      headers,
      body: JSON.stringify(params),
    },
    handler
  );
}

// 禁言或者取消禁言接口
export function forbitChat({ params, headers, ...handler }: any): any {
  return request(
    '/web/member/forbitchat',
    {
      method: 'post',
      headers,
      body: JSON.stringify(params),
    },
    handler
  );
}

// 获取所有禁言用户
export function getRoomForbits({ params, headers, ...handler }: any): any {
  return request(
    `/web/member/getforbitchatlist?${qs.stringify(params)}`,
    {
      headers
    },
    handler
  );
}

// 踢出直播间用户接口
export function shotOff({ params, headers, ...handler }: any): any {
  return request(
    '/web/member/shotoff',
    {
      method: 'post',
      headers,
      body: JSON.stringify(params),
    },
    handler
  );
}

// 拉取聊天信息
// data {
// msgId: 当前显示最后一条消息的消息id(不填就从后台最后一条开始),
// roomId: 直播间id,
// size: 消息条数(默认20) }
export function getChatList({ params, headers, ...handler }: any): any {
  return request(
    '/web/group/getmoremsg',
    {
      method: 'post',
      headers,
      body: JSON.stringify(params),
    },
    handler
  );
}

// 拉取直播间问答信息
export function getQaaList({ params, headers, ...handler }: any): any {
  return request(
    '/web/room/question/getmoremsg',
    {
      method: 'post',
      headers,
      body: JSON.stringify(params),
    },
    handler
  );
}

// 删除直播间问答消息
export function delQaaMsg({ params, headers, ...handler }: any): any {
  return request(
    '/web/room/question/deletemsg',
    {
      method: 'post',
      headers,
      body: JSON.stringify(params),
    },
    handler
  );
}

// 发送问答消息
export function sendQaaMsg({ params, headers, ...handler }: any): any {
  return request(
    '/web/room/question/sendmsg',
    {
      method: 'post',
      headers,
      body: JSON.stringify(params),
    },
    handler
  );
}

// 更新问答消息
export function updateQaaMsg({ params, headers, ...handler }: any): any {
  return request(
    '/web/room/question/updateanswer',
    {
      method: 'post',
      headers,
      body: JSON.stringify(params),
    },
    handler
  );
}

// 获取直播间成员
export function getMemberList({ params, headers, ...handler }: any): any {
  return request(
    `/web/member/getroomuserlist?${qs.stringify(params)}`,
    {
      headers
    },
    handler
  );
}

// 开始直播
export function onLine({ params, headers, ...handler }: any): any {
  return request(`/web/room/startroom?${qs.stringify(params)}`, {
    headers
  }, handler);
}

// 下麦
export function offLine({ params, headers, ...handler }: any): any {
  return request(`/web/room/overroom?${qs.stringify(params)}`, {
    headers
  }, handler);
}

// 发送摄像头改变广播
export function broatRoomCamera({ params, headers, ...handler }: any): any {
  return request(
    `/web/room/broatroomcamera?${qs.stringify(params)}`,
    {
      headers
    },
    handler
  );
}

// 主播邀请上麦直播
export function inviteJoinRoom({ params, headers, ...handler }: any): any {
  return request(`/web/room/invitelive?${qs.stringify(params)}`, {
    headers
  }, handler);
}

// 嘉宾处理直播邀请
export function handleRoomInvite({ params, headers, ...handler }: any): any {
  return request(
    `/web/room/guestauditlive?${qs.stringify(params)}`,
    {
      headers
    },
    handler
  );
}

// 嘉宾申请上麦直播
export function applyJoinRoom({ params, headers, ...handler }: any): any {
  return request(`/web/room/auditlive?${qs.stringify(params)}`, {
    headers
  }, handler);
}

// 主播处理上麦申请
export function handleJoinApply({ params, headers, ...handler }: any): any {
  return request(
    `/web/room/adminauditlive?${qs.stringify(params)}`,
    {
      headers
    },
    handler
  );
}

// 获取图文直播数据
export function getImgTextList({ params, headers, ...handler }: any): any {
  return request(
    '/web/room/imagetext/getmoremsg',
    {
      method: 'post',
      headers,
      body: JSON.stringify(params),
    },
    handler
  );
}

// 发送图文消息
export function sendImgText({ params, headers, ...handler }: any): any {
  return request(
    '/web/room/imagetext/sendmsg',
    {
      method: 'post',
      headers,
      body: JSON.stringify(params),
    },
    handler
  );
}

// 更新图文消息
export function updateImgText({ params, headers, ...handler }: any): any {
  return request(
    '/web/room/imagetext/updateimagetext',
    {
      method: 'post',
      headers,
      body: JSON.stringify(params),
    },
    handler
  );
}

// 删除图文消息
export function delImgText({ params, headers, ...handler }: any): any {
  return request(
    '/web/room/imagetext/deletemsg',
    {
      method: 'post',
      headers,
      body: JSON.stringify(params),
    },
    handler
  );
}

// 获取直播间回放视频
export function getReviewVideos({ params, headers, ...handler }: any): any {
  return request(
    `/web/room/video/getreviewlist?${qs.stringify(params)}`,
    {
      headers
    },
    handler
  );
}

// 获取直播间所有插播视频
export function getInsertVideos({ params, headers, ...handler }: any): any {
  return request(
    `/web/room/getroominsatallvideolist?${qs.stringify(params)}`,
    {
      headers
    },
    handler
  );
}

// 获取直播间正在插播的视频信息
export function getInsertVideo({ params, headers, ...handler }: any): any {
  return request(
    `/web/room/getroominstallvideo?${qs.stringify(params)}`,
    {
      headers
    },
    handler
  );
}

// 开启直播间插播视频
export function playInsertVideo({ params, headers, ...handler }: any): any {
  return request(
    `/web/room/playinstallvideo?${qs.stringify(params)}`,
    {
      method: 'post',
      headers,
      body: JSON.stringify(params),
    },
    handler
  );
}

// 关闭直播间插播视频
export function closeInsertVideo({ params, headers, ...handler }: any): any {
  return request(
    `/web/room/stopinstallvideo?${qs.stringify(params)}`,
    {
      method: 'post',
      headers,
      body: JSON.stringify(params),
    },
    handler
  );
}

// 获取直播间问卷调查
export function getQuestionnaire({ params, headers, ...handler }: any): any {
  return request(
    `/web/room/questionnaire/getroomquestionnairelist?${qs.stringify(params)}`,
    {
      headers
    },
    handler
  );
}

// 发送直播间问卷
export function sendQuestionnaire({ params, headers, ...handler }: any): any {
  return request(
    `/web/room/questionnaire/sendquestionnaire?${qs.stringify(params)}`,
    {
      headers
    },
    handler
  );
}

// 获取直播间演讲稿
export function getSpeechList({ params, headers, ...handler }: any): any {
  return request(
    `/web/room/speech/getlist?${qs.stringify(params)}`,
    {
      headers
    },
    handler
  );
}

// 获取演讲稿详情
export function getSpeechInfo({ params, headers, ...handler }: any): any {
  return request(
    `/web/room/speech/getdetail?${qs.stringify(params)}`,
    {
      headers
    },
    handler
  );
}

// 结束播放演讲稿
export function closeSpeech({ params, headers, ...handler }: any): any {
  return request(`/web/room/stopspeech?${qs.stringify(params)}`, {
    headers
  }, handler);
}

// 演讲稿翻页
export function turnSpeechPage({ params, headers, ...handler }: any): any {
  return request(
    '/web/room/turnspeech',
    {
      method: 'post',
      headers,
      body: JSON.stringify(params),
    },
    handler
  );
}
