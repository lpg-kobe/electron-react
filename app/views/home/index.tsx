import React from 'react';
import { connect } from 'dva';
// @ts-ignore
import { SDK_APP_ID, API_HOST } from '@/constants';
// @ts-ignore
import CommonHeader from '@/components/layout/header';
// @ts-ignore
import ATable from '@/components/table';
import { withRouter } from 'dva/router';
import { List } from 'antd';
import './style.less';

function HomePage(props: any) {
  const {
    auth: { userInfo },
    home: { list, pagination },
  } = props;
  console.log(userInfo);
  const tableOptions = {
    grid: { gutter: 16, column: 4 },
    searchForm: {},
    pagination: {
      ...pagination,
      onChange: (currPage: number, pageSize: number) =>
        console.log(currPage, pageSize),
    },
    tableList: true,
    renderItem: (item: any) => <List.Item />,
    dataSource: list,
  };

  return (
    <>
      <CommonHeader />
      <main className="home-page-container" data-tid="home-page-container">
        <section>
          <ATable {...tableOptions} />
        </section>
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
