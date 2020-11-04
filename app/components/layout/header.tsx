import React from 'react'
import { connect } from 'dva'
import { Layout } from 'antd'

type AuthType = {
    [key: string]: any
}
const CommonFooter = () => {
    const { Header } = Layout
    return (
        <Header id="common-header">
            <div className="header-l"></div>
            <div className="header-r"></div>
        </Header>
    )
}
export default connect(({ auth }: AuthType) => ({ auth: auth.toJS() }))(CommonFooter)