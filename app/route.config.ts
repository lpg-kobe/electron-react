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
        // @ts-ignore
        models: () => [import('./models/home')],
      }),
  },
  {
    path: '/login',
    pathname: 'Login',
    component: (app: any) =>
      dynamic({
        // @ts-ignore
        app,
        // @ts-ignore
        component: () => import('./views/auth/login'),
        models: () => [],
      }),
  },
  {
    path: '/list/:id',
    pathname: 'room-info',
    component: (app: any) =>
      dynamic({
        // @ts-ignore
        app,
        // @ts-ignore
        component: () => import('./views/room/index'),
        // @ts-ignore
        models: () => [import('./models/room')],
      }),
  },
];
