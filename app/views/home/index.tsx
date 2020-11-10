import React from 'react';
import { connect } from 'dva';
// @ts-ignore
import { SDK_APP_ID, API_HOST } from '@/constants';
// @ts-ignore
import CommonHeader from '@/components/layout/header';
// @ts-ignore
import ATable from '@/components/table';
import { withRouter } from 'dva/router';
import { List, Form, Input, Select, Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons'
import { WindowInstance } from '../../main.dev'
import moment from 'moment'
import './style.less'


type RoomType = {
  id: number, // 房间Id
  status: number // 直播房间状态。1:进行中,2: 保留,3:新建,4: 保留,5: 保留,6:结束
}

function HomePage(props: any) {
  const {
    home: { list, pagination },
    dispatch
  } = props;
  const [form] = Form.useForm()
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
    renderItem: (item: any) => <List.Item className="wrap-item" onClick={(item: any) => handleGoRoom(item)}>
      <div className="item-img">
        <img src={item.expUrl} alt="封面" />
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

  function handleGoRoom({ id }: RoomType) {
    WindowInstance.createWindow('roomWindow', {
      url: `file://${__dirname}/app.html#/room/${id}`
    })
  }

  return (
    <>
      <CommonHeader />
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
