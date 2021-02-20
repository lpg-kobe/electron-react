/**
 * @desc api services of common
 */

// @ts-ignore
import request from '@/utils/request';
// @ts-ignore
import qs from 'qs';

type ParamType = {
  [key: string]: any;
};

// get list of table
export function getTableData({ url, tableId, ...params }: ParamType): any {
  return request(`${url}?${qs.stringify(params)}`, { method: 'get' });
}

// 发送房间用户心跳
export function sendHeartBeat({ params, ...handler }: ParamType): any {
  return request('/web/member/heartbeat', {
    method: 'post',
    body: JSON.stringify(params)
  }, handler)
}

// 发送登录用户心跳
export function sendLoginHeartBeat({ params, ...handler }: ParamType): any {
  return request(`/web/member/loginheartbeat?${qs.stringify(params)}`, {}, handler)
}