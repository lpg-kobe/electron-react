/**
 * @desc main entry of app, use dva
 * @author pika
 */
import dva from 'dva';
import './global.less';

import * as trtc_namespace from 'trtc-electron-sdk';

const TRTCCloud = require('trtc-electron-sdk');

const rtcCloud: trtc_namespace.TRTCCloud = new TRTCCloud();
// 获取 SDK 版本号
rtcCloud.getSDKVersion();

document.addEventListener('DOMContentLoaded', () => {
    const dvaOpts = {};
    const app = dva(dvaOpts);
    app.router(require('./routes').default);
    // app.use()
    app.model(require('./models/system').default);
    app.start('#root');
});
