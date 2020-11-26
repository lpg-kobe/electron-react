import React, { useState } from 'react';
import { connect } from 'dva';
// @ts-ignore
import { SDK_APP_ID, API_HOST, DEFAULT_WINDOW_SIZE } from '@/constants';
// @ts-ignore
import CommonHeader from '@/components/layout/header';
// @ts-ignore
import ATable from '@/components/table';
import { withRouter } from 'dva/router';
import { List, Form, Input, Select, Button } from 'antd';
// @ts-ignore
import { MAIN_EVENT, rendererInvoke } from '@/utils/ipc'
import { SearchOutlined } from '@ant-design/icons'
import moment from 'moment'
import './style.less'


type RoomType = {
  id: number, // 房间Id
  role: number,// 房间角色 1主播 2嘉宾
  name: number, // 房间名称
  expUrl: string, // 房间封面
  startTime: any, // 房间开始时间
  status: number // 直播房间状态。1:进行中,2: 保留,3:新建,4: 保留,5: 保留,6:结束
}

function HomePage(props: any) {
  const {
    home: { list, pagination },
    dispatch
  } = props;
  const [form] = Form.useForm()
  const [imgError, setImgError] = useState(false)
  const { Option } = Select
  const tableOptions = {
    grid: { gutter: 16, column: 5 },
    searchForm: {
      items: [{
        options: {},
        component: <><h2>直播列表</h2></>
      }, {
        options: {
          extra: {
            form: {
              options: {
                name: 'searchForm',
                form,
                initialValues: {
                  status: ''
                }
              },
              items: [{
                options: {
                  name: 'status'
                },
                component: <Select placeholder="请选择">
                  <Option value="">全部</Option>
                  <Option value="3">预告</Option>
                  <Option value="1">直播</Option>
                  <Option value="6">结束</Option>
                </Select>
              }, {
                options: {
                  name: 'name'
                },
                component: <div className="search-input">
                  <Input placeholder="输入搜索的内容" />
                  <Button onClick={handleSubmit} type="primary" className="search-btn" shape="round" icon={<SearchOutlined />}></Button>
                </div>
              }]
            }
          }
        },

      }]
    },
    pagination: {
      ...pagination,
      onChange: (currPage: number, pageSize: number) => {
        dispatch({
          type: 'home/getList',
          payload: {
            pagenum: currPage,
            pageSize
          }
        })
      }
    },
    locale: {
      emptyText: '您还没有直播间，请联系客服创建。客服电话：4009962228'
    },
    tableList: true,
    renderItem: (item: RoomType) => <List.Item className="wrap-item" onClick={() => handleGoRoom(item)}>
      <div className="item-img">
        <img src={item.expUrl} alt="封面" data-img={imgError ? 'unloaded' : 'loaded'} onError={() => setImgError(true)} />
        <span className="status">
          {['', '直播', '预告', '', '', '', '结束'][item.status]}
        </span>
      </div>
      <div className="item-info">
        <h1>{item.name}</h1>
        <p className="time">
          {moment(item.startTime).format('YYYY-MM-DD HH:mm')}
        </p>
      </div>
      <div className={`user-box ${item.role === 1 ? 'anchor' : ''}`}>
        {['', '主播', '嘉宾'][item.role]}
      </div>
    </List.Item>,
    dataSource: list,
  };

  function handleSubmit() {
    const { current, pageSize } = pagination
    form.validateFields().then(values => {
      dispatch({
        type: 'home/getList',
        payload: {
          ...values,
          pagenum: current,
          pageSize
        }
      })
    })
  }

  // open new window to room detail
  function handleGoRoom({ id }: any) {
    rendererInvoke(MAIN_EVENT.MAIN_OPEN_PAGE, {
      ...DEFAULT_WINDOW_SIZE.MAIN,
      namespace: 'roomWindow',
      url: `file://${__dirname}/app.html#/room/${id}`,
    }, () => { })
  }

  return (
    <>
      <CommonHeader headerProps={[{ key: 'avatar' }]} />
      <main className="home-page-container clearfix main-container" data-tid="home-page-container">
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
