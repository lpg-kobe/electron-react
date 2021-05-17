/**
 * @desc common handler width ajax callback
 * @author pika
 */
import { message } from 'antd';
import i18n from 'i18next'
import logger from './log'


const OFweekLog = logger('______Api Response______')

interface ReactType {
  login: () => void;
  operate: () => void;
  upload: () => void;
  [key: string]: any;
};

interface handleType {
  onSuccess?: any;
  onError?: any;
};

/**
 * @desc handle width ajax success
 * @param {Object} handler handler after request
 * @param {Object} data callback data of request
 */
export function handleSuccess(handler: handleType, data?: any): any {
  Object.entries(handler.onSuccess).forEach(([key, value]) => {
    const keyReact: ReactType = {
      login: () => {
        message.success({
          content: i18n.t('登录成功'),
          duration: 0.5,
        });
      },
      search: () => {
        message.success({
          content: i18n.t('查询成功'),
          duration: 0.5,
        });
      },
      onLine: () => {
        message.success({
          content: i18n.t('上麦成功'),
          duration: 0.5,
        });
      },
      offLine: () => {
        message.success({
          content: i18n.t('下麦成功'),
          duration: 0.5,
        });
      },
      sms: () => {
        message.success({
          content: i18n.t('验证码已发送'),
          duration: 0.5,
        });
      },
      operate: () => {
        message.success({
          content: i18n.t('操作成功'),
          duration: 0.5,
        });
      },
      delete: () => {
        message.success({
          content: i18n.t('删除成功'),
          duration: 0.5,
        });
      },
      upload: () => {
        message.success({
          content: i18n.t('上传成功'),
          duration: 0.5,
        });
      },
    };
    keyReact[key] && typeof value === 'function' ? value(data) : keyReact[key]?.();
  });
}

// handle width ajax error
export function handleError(handler: handleType, data?: any): any {
  OFweekLog.info('Error of api:', data)

  if (handler?.onError) {
    Object.entries(handler.onError).forEach(([key, value]) => {
      const keyReact: ReactType = {
        login: () => {
          message.error({
            content: i18n.t('登录失败'),
            duration: 0.5,
          });
        },
        operate: () => {
          message.error({
            content: i18n.t('操作失败'),
            duration: 0.5,
          });
        },
        onLine: () => {
          message.success({
            content: i18n.t('上麦出现异常'),
            duration: 0.5,
          });
        },
        offLine: () => {
          message.success({
            content: i18n.t('下麦出现异常'),
            duration: 0.5,
          });
        },
        delete: () => {
          message.error({
            content: i18n.t('删除失败'),
            duration: 0.5,
          });
        },
        upload: () => {
          message.error({
            content: i18n.t('上传失败'),
            duration: 0.5,
          });
        },
      };
      keyReact[key] && typeof value === 'function'
        ? value(data)
        : keyReact[key]?.();
    });
  } else {
    message.error(data.message);
  }
}
