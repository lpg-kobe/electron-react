/**
 * @desc api services of home page
 */

// @ts-ignore
import request from '@/utils/request';
// @ts-ignore
import qs from 'qs';

type ParamType = {
  [key: string]: any;
};

// 获取直播列表
export function getList(params: ParamType): any {
  return request(
    `/web/room/pc/getroomindex?${qs.stringify(params)}`,
    { method: 'get' }
  );
}
