/**
 * @desc all route will be registered by this file
 * @author pika
 */
import dynamic from 'dva/dynamic';
import { RouteConfigsType } from './utils/type'
import Loading from './components/loading'
// set default loading before component load
dynamic.setDefaultLoadingComponent(Loading)
const RouteArrs: RouteConfigsType = [
  {
    path: '/',
    pathname: '首页',
    initTrtc: true,
    heartBeat: true,
    component: (app: any) =>
      dynamic({
        // @ts-ignore
        app,
        component: () => import('./views/home/index'),
        // @ts-ignore
        models: () => [
          import('./models/home'),
          import('./models/room')
        ]
      }),
  },
  // 启动页面
  {
    path: '/launch',
    pathname: '启动页',
    initTrtc: false,
    heartBeat: false,
    component: (app: any) =>
      dynamic({
        // @ts-ignore
        app,
        // @ts-ignore
        component: () => import('./middleware/launch'),
        models: () => []
      }),
  },
  {
    path: '/login',
    pathname: '登录',
    initTrtc: false,
    heartBeat: false,
    component: (app: any) =>
      dynamic({
        // @ts-ignore
        app,
        // @ts-ignore
        component: () => import('./views/auth/login'),
        models: () => [import('./models/room')]
      }),
  },
  {
    path: '/room/:id',
    pathname: '直播间',
    initTrtc: false,
    heartBeat: false,
    component: (app: any) =>
      dynamic({
        // @ts-ignore
        app,
        // @ts-ignore
        component: () => import('./views/room/index'),
        // @ts-ignore
        models: () => [
          import('./models/room'),
          import('./models/room/detail'),
          import('./models/room/chat'),
          import('./models/room/video'),
          import('./models/room/speech')
        ],
      }),
  },
  // demo
  {
    path: '/demo',
    pathname: 'Demo',
    initTrtc: false,
    heartBeat: false,
    component: (app: any) =>
      dynamic({
        app,
        component: () => import('./views/demo'),
        models: () => [import('./models/room')]
      }),
  },
]

export default RouteArrs;
