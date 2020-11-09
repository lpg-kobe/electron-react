import React, { useEffect } from 'react';
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
import './style.less';
import { remote } from 'electron'


function HomePage(props: any) {
  useEffect(() => {
    console.log(remote.getCurrentWindow().getSize())
    remote.getCurrentWindow().setSize(740, 406, true)
    return () => {

    };
  }, []);
  const {
    auth: { userInfo },
    home: { list, pagination },
  } = props;
  const [form] = Form.useForm()
  const { Option } = Select
  console.log(userInfo);
  const tableOptions = {
    grid: { gutter: 16, column: 4 },
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
                form
              },
              items: [{
                options: {
                  initialValue: ''
                },
                component: <Select placeholder="请选择">
                  <Option value="">全部</Option>
                  <Option value="0">预告</Option>
                  <Option value="1">直播</Option>
                  <Option value="2">结束</Option>
                </Select>
              }, {
                options: {},
                component: <div className="search-input">
                  <Input placeholder="输入搜索的内容" />
                  <Button onClick={handleSubmit} className="search-btn" shape="round" icon={<SearchOutlined />}></Button>
                </div>
              }]
            }
          }
        },

      }]
    },
    pagination: {
      ...pagination,
      onChange: (currPage: number, pageSize: number) =>
        console.log(currPage, pageSize),
    },
    locale: {
      emptyText: '您还没有直播间，请联系客服创建。客服电话：4009962228'
    },
    tableList: true,
    renderItem: (item: any) => <List.Item className="wrap-item">
      <div className="item-img">{item.name}</div>
      <div className="item-info"></div>
    </List.Item>,
    dataSource: list,
  };

  function handleSubmit() {
    form.validateFields().then(values => {
      console.log(values)
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
  connect(({ auth, home }: any) => ({
    auth: auth.toJS(),
    home: home.toJS(),
  }))(HomePage)
);
