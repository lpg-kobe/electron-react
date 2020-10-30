/**
 * @desc common handler width ajax callback
 * @author pika
 */
import { message } from 'antd';

type ReactType = {
  login?: any;
  operate?: any;
  upload?: any;
};

type handleType = {
  onSuccess?: any;
  onError?: any;
};

// handle width ajax success
export function handleSuccess(handler: handleType): any {
  Object.entries(handler.onSuccess).forEach(([key, value]) => {
    const keyReact: ReactType = {
      login: () => {
        message.success({
          content: '登录成功',
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
    // @ts-ignore
    const result: any = keyReact[key];
    result && typeof value === 'function' ? value() : result?.();
  });
}

// handle width ajax error
export function handleError(handler: handleType): any {
  if (handler.onError) {
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
      // @ts-ignore
      const result: any = keyReact[key];
      result && typeof value === 'function' ? value() : result?.();
    });
  } else {
    message.error('未知异常');
  }
}
