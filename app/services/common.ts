/**
 * @desc api services of common
 */

import request from '@/utils/request';
import qs from 'qs';

// get list of table
export function getTableData({ url, tableId, ...params }: any): any {
  return request(`${url}?${qs.stringify(params)}`, { method: 'get' });
}

// 发送房间用户心跳
export function sendHeartBeat({ params, ...handler }: any): any {
  return request('/web/member/heartbeat', {
    method: 'post',
    body: JSON.stringify(params)
  }, handler)
}

// 发送登录用户心跳
export function sendLoginHeartBeat({ params, ...handler }: any): any {
  return request(`/web/member/loginheartbeat?${qs.stringify(params)}`, {}, handler)
}

// ip获取所属地区语言
export function getLanguage({ params, ...handler }: any): any {
  return request(`/web/sysdict/getrequestlang?${qs.stringify(params)}`, {}, handler)
}
