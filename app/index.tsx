// import React, { Fragment } from 'react';
// import { render } from 'react-dom';
// import { AppContainer as ReactHotAppContainer } from 'react-hot-loader';
// import { history, configuredStore } from './store';
import dva from 'dva'
import './app.global.css';

// const store = configuredStore();

// const AppContainer = process.env.PLAIN_HMR ? Fragment : ReactHotAppContainer;

document.addEventListener('DOMContentLoaded', () => {
  const dvaOpts = {}
  const app = dva(dvaOpts)
  app.router(require('./Routes').default)
  // app.use()
  // app.model(require('@/models/system').default)
  app.start('#root')
  // eslint-disable-next-line global-require
  // const Root = require('./containers/Root').default;
  // render(
  //   <AppContainer>
  //     <Root store={store} history={history} />
  //   </AppContainer>,
  //   document.getElementById('root')
  // );
});
