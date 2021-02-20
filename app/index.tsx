/**
 * @desc main entry of app, use dva
 * @author pika
 */

import dva from 'dva';
import './assets/style/global.less';

const routes = require('./routes').default;
const systemModal = require('./models/system').default;
const authModal = require('./models/auth').default;

document.addEventListener('DOMContentLoaded', () => {
  const dvaOpts = {};
  const app = dva(dvaOpts);
  app.router(routes);
  // app.use()
  app.model(systemModal);
  app.model(authModal);
  app.start('#root');
});
