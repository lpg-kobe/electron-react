import React, { useState, useEffect } from 'react';
import { connect } from 'dva';
import { useTranslation } from 'react-i18next';
// @ts-ignore
import { SDK_APP_ID, API_HOST, DEFAULT_WINDOW_SIZE } from '@/constants';
import CommonHeader from '../../components/layout/header';
import Menu from '../../components/layout/menu';
import ATable from '../../components/table';
import Img from '../../components/img';
import { withRouter } from 'dva/router';
import { List, Form, Input, Select, Button } from 'antd';
import {
  MAIN_EVENT,
  RENDERER_EVENT,
  RENDERER_CODE,
  rendererInvoke,
  rendererListen,
  rendererOffListen,
  rendererSend,
  closeWindow,
} from '../../utils/ipc';
import { judgeRouterUrl } from '../../utils/tool';
import { RendererCode } from '../../utils/type';
import logger from '../../utils/log';
import {
  SearchOutlined,
  ReloadOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import './style.less';

const OFweekLog = logger('______Home Page______');

interface RoomType {
  id: number; // 房间Id
  role: number; // 房间角色 1主播 2嘉宾
  name: number; // 房间名称
  expUrl: string; // 房间封面
  startTime: any; // 房间开始时间
  status: number; // 直播房间状态。1:进行中,2: 保留,3:新建,4: 保留,5: 保留,6:结束
}

function HomePage(props: any) {
  const {
    home: { list, pagination },
    dispatch,
  } = props;

  const [form] = Form.useForm();
  const { t, i18n } = useTranslation();
  const [emptyText, setEmptyText] = useState(
    t('您还没有直播间，请联系客服创建。客服电话：4009962228')
  );

  useEffect(() => {
    // register operate code msg from main process
    rendererListen(RENDERER_EVENT.RENDERER_SEND_CODE, onRendererCode);
    return () => {
      rendererOffListen(RENDERER_EVENT.RENDERER_SEND_CODE, onRendererCode);
    };
  }, []);

  const { Option } = Select;
  const tableOptions = {
    grid: { gutter: 16, column: 5 },
    searchForm: {
      items: [
        {
          options: {},
          component: <h2>{t('直播列表')}</h2>,
        },
        {
          options: {
            extra: {
              form: {
                options: {
                  name: 'searchForm',
                  form,
                  initialValues: {
                    status: '',
                  },
                },
                items: [
                  {
                    options: {
                      name: 'status',
                    },
                    component: (
                      <Select placeholder={t('请选择')} onChange={handleSubmit}>
                        <Option value="">{t('全部')}</Option>
                        <Option value="3">{t('预告')}</Option>
                        <Option value="1">{t('直播')}</Option>
                        <Option value="6">{t('结束')}</Option>
                      </Select>
                    ),
                  },
                  {
                    options: {
                      name: 'name',
                    },
                    component: (
                      <div className="search-input">
                        <Input placeholder={t('输入搜索的内容')} />
                        <Button
                          onClick={handleSubmit}
                          type="primary"
                          className="search-btn"
                          shape="round"
                          icon={<SearchOutlined />}
                        />
                      </div>
                    ),
                  },
                ],
              },
            },
          },
        },
      ],
    },
    pagination: {
      ...pagination,
      onChange: (currPage: number, pageSize: number) => {
        dispatch({
          type: 'home/getList',
          payload: {
            pagenum: currPage,
            pagesize: pageSize,
          },
        });
      },
    },
    locale: {
      emptyText,
    },
    tableList: true,
    renderItem: (item: RoomType) => (
      <List.Item className="wrap-item" onClick={() => handleGoRoom(item)}>
        <div className="item-img">
          <Img
            options={{
              src: item.expUrl,
              alt: t('封面'),
            }}
          />
          <span className="status">
            {t(['', '直播', '', '预告', '', '', '结束'][item.status])}
          </span>
        </div>
        <div className="item-info">
          <h1 title={String(item.name)}>{item.name}</h1>
          <p className="time">
            {moment(item.startTime).format('YYYY-MM-DD HH:mm')}
          </p>
        </div>
        <div className={`user-box ${item.role === 1 ? 'anchor' : ''}`}>
          {t(['', '主播', '嘉宾'][item.role])}
        </div>
      </List.Item>
    ),
    dataSource: list,
  };

  function handleSubmit() {
    OFweekLog.info('click of search data:');
    setEmptyText(t('暂无数据'));
    const { current, pageSize } = pagination;
    form.validateFields().then((values) => {
      dispatch({
        type: 'home/getList',
        payload: {
          ...values,
          pagenum: current,
          pagesize: pageSize,
        },
      });
    });
  }

  /** handle refresh of room list */
  function handleRefresh() {
    OFweekLog.info('click of refresh icon:');
    form.resetFields();
    dispatch({
      type: 'home/getList',
      payload: {
        pagenum: 1,
        pagesize: 10,
      },
    });
  }

  // open new window to room detail
  function handleGoRoom({ id }: any) {
    OFweekLog.info('click of item in live list:');
    const { OPEN_ROOM } = RENDERER_CODE;
    // send msg to other renderer that new room will be open
    rendererSend(RENDERER_EVENT.RENDERER_SEND_CODE, {
      code: OPEN_ROOM,
    });
    // try to enter room if user is not be knickOuted
    dispatch({
      type: 'room/tryToEnterRoom',
      payload: {
        params: {
          roomid: id,
        },
        onSuccess: {
          operate: () => {
            rendererInvoke(MAIN_EVENT.MAIN_OPEN_PAGE, {
              ...DEFAULT_WINDOW_SIZE.MAIN,
              x: 500,
              y: 50,
              namespace: 'roomWindow',
              url: judgeRouterUrl(`room/${id}`),
            });
          },
        },
      },
    });
  }

  /** listen operate code msg from main process */
  function onRendererCode(event: any, { code, data }: RendererCode) {
    OFweekLog.info('receive code from renderer in home page:', code);

    const { CLOSE_PAGE, CHANGE_SETTING } = RENDERER_CODE;

    const codeAction: any = {
      [CLOSE_PAGE]: () => {
        // open login window before close all window,this only used when handleClosePage happended
        rendererInvoke(
          MAIN_EVENT.MAIN_OPEN_PAGE,
          {
            ...DEFAULT_WINDOW_SIZE.LOGIN,
            namespace: 'loginWindow',
            url: judgeRouterUrl('login'),
          },
          () => {
            closeWindow();
          }
        );
      },
      // change setting of user not only language
      [CHANGE_SETTING]: () => {
        data?.value?.language && i18n.changeLanguage(data?.value?.language);
      },
    };

    codeAction[code]?.();
  }

  /** handle close event of menu */
  function handleClosePage() {
    OFweekLog.info('click of close window icon:');
    // send notice to main process to tell all renderer to close window, bug?=> ipcRenderer.send can`t send function to main process so do sth by onClosePage
    const { CLOSE_PAGE } = RENDERER_CODE;
    rendererSend(RENDERER_EVENT.RENDERER_SEND_CODE, {
      code: CLOSE_PAGE,
    });
  }

  return (
    <>
      <CommonHeader
        headerProps={[{ key: 'avatar' }]}
        titleBarProps={[
          {
            type: 'refresh',
            icon: (
              <ReloadOutlined
                key="refresh"
                className="icon icon-refresh"
                title={t('刷新')}
                onClick={handleRefresh}
              />
            ),
          },
          {
            type: 'menu',
            icon: (
              <Menu
                key="menu"
                menus={[
                  {
                    label: 'setting',
                    icon: <SettingOutlined />,
                    title: t('设置'),
                  },
                ]}
              />
            ),
          },
          {
            type: 'min',
            title: t('最小化'),
          },
          {
            type: 'close',
            title: t('关闭'),
            click: () => handleClosePage(),
          },
        ]}
      />
      <main
        className="home-page-container clearfix main-container"
        data-tid="home-page-container"
      >
        <ATable {...tableOptions} />
      </main>
    </>
  );
}
export default withRouter(
  connect(({ home }: any) => ({
    home: home.toJS(),
  }))(HomePage)
);
