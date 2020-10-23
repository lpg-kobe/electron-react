/* eslint react/jsx-props-no-spreading: off */
import React from 'react';
import { Switch, Router, Route } from 'react-router-dom';
import routes from './constants/routes.json';
import App from './containers/App';
import HomePage from './containers/HomePage';
import CounterPage from './containers/CounterPage';

// Lazily load routes and code split with webpack
// const LazyCounterPage = React.lazy(() =>
//   import(/* webpackChunkName: "CounterPage" */ './containers/CounterPage')
// );

// const CounterPage = (props: Record<string, any>) => (
//   <React.Suspense fallback={<h1>Loading...</h1>}>
//     <LazyCounterPage {...props} />
//   </React.Suspense>
// );

export default function Routes({ history }) {
  return (
    <Router history={history}>
      <Switch>
        <App>
          <Route path={routes.COUNTER} component={CounterPage} />
          <Route path={routes.HOME} component={HomePage} />
        </App>
      </Switch>
    </Router>
  );
}
