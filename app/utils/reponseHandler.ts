/**
 * @desc common handler width ajax callback
 * @author pika
 */
import { message } from 'antd';

type ReactType = {
  login(): void;
  operate(): void;
  upload(): void;
  [key: string]: any;
};

type handleType = {
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
          content: '登录成功',
          duration: 0.5,
        });
      },
      sms: () => {
        message.success({
          content: '验证码已发送',
          duration: 0.5,
        });
      },
      operate: () => {
        message.success({
          content: '操作成功',
          duration: 0.5,
        });
      },
      upload: () => {
        message.success({
          content: '上传成功',
          duration: 0.5,
        });
      },
    };
    keyReact[key] && typeof value === 'function' ? value(data) : keyReact[key]?.();
  });
}

// handle width ajax error
export function handleError(handler: handleType): any {
  if (handler && handler.onError) {
    Object.entries(handler.onError).forEach(([key, value]) => {
      const keyReact: ReactType = {
        login: () => {
          message.success({
            content: '登录失败',
            duration: 0.5,
          });
        },
        operate: () => {
          message.success({
            content: '操作失败',
            duration: 0.5,
          });
        },
        upload: () => {
          message.success({
            content: '上传失败',
            duration: 0.5,
          });
        },
      };
      keyReact[key] && typeof value === 'function'
        ? value()
        : keyReact[key]?.();
    });
  } else {
    message.error('未知异常');
  }
}
