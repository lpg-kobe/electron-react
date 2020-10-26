/* eslint react/jsx-props-no-spreading: off */
import React from 'react';
import { Switch, Router, Route } from 'dva/router';
import routes from './constants/routes.json';
import Layout from './containers/App';
import HomePage from './containers/HomePage';
import CounterPage from './containers/CounterPage';
// const CounterPage = (props: Record<string, any>) => (
//   <React.Suspense fallback={<h1>Loading...</h1>}>
//     <LazyCounterPage {...props} />
//   </React.Suspense>
// );

export default function Routes({ history }) {// eslint-disable-line
  return (
    <Router history={history}>
      <Layout>
        <Switch>
          <Route path={routes.COUNTER} component={CounterPage} />
          <Route path={routes.HOME} component={HomePage} />
        </Switch>
      </Layout>
    </Router>
  );
}
