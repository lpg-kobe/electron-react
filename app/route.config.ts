/**
 * @desc all route will be registered by this file
 * @author pika
 */
import dynamic from 'dva/dynamic';
// set default loading before component load
// dynamic.setDefaultLoadingComponent(Loading)
export default [
  {
    path: '/',
    pathname: 'Home',
    component: (app: any) =>
      dynamic({
        // @ts-ignore
        app,
        component: () => import('./views/home/index'),
        models: () => [
          // import('./models/home/model'),
        ],
      }),
  },
  {
    path: '/login',
    pathname: 'Login',
    component: (app: any) =>
      dynamic({
        // @ts-ignore
        app,
        component: () => import('./views/auth/login'),
        models: () => [],
      }),
  },
  {
    path: '/list/:id',
    pathname: 'Video List',
    component: (app: any) =>
      dynamic({
        // @ts-ignore
        app,
        component: () => import('./views/counter/index'),
        models: () => [
          // import('./models/league/model'),
        ],
      }),
  },
];
