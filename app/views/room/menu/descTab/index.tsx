/**
 * @desc 活动介绍描述
 */
'use strict'
import React, { useEffect } from 'react';
import { connect } from 'dva';
import { withRouter } from 'dva/router';

type PropsType = {
    room: any,
    match: any,
    dispatch: any
}

const DescTab = (props: PropsType) => {
    const { room: { roomIntroduce }, dispatch, match: { params: { id } } } = props
    useEffect(() => {
        dispatch({
            type: 'home/getRoomIntroduce',
            payload: {
                roomid: id
            }
        })
    }, [])
    return (roomIntroduce ? <div className="tab-container desc">
        <div className="wrap-item time">
            <div className="logo">
                <img src={roomIntroduce.companyLogoUrl} alt="logo" />
            </div>
            <div className="title">
                <h1>{roomIntroduce.roomName}</h1>
                <p>举办时间：{roomIntroduce.time}</p>
                <p>举办单位：{roomIntroduce.companyName}</p>
            </div>
        </div>
        <div className="wrap-item desc">
            <h2>内容简介</h2>
            <p>{roomIntroduce.description}</p>
        </div>
        <div className="wrap-item member">
            <ul>
                {
                    roomIntroduce.showMemberList && roomIntroduce.showMemberList.map((item: any, index: number) => item.identity !== '主播' ? <li className="member-line" key={index}>
                        <h2>{item.identity}</h2>
                        {
                            item.memberList.map((member: any) => <dl key={member.memberLogoUrl}>
                                <dt>
                                    <img src={member.memberLogoUrl} alt="用户头像" />
                                </dt>
                                <dd>
                                    <h3>{member.memberName} - {member.memberCompany} / {member.memberJob}</h3>
                                    <p>{member.memberSummary}</p>
                                </dd>
                            </dl>)
                        }
                    </li> : null)
                }
            </ul>
        </div>
        <div className="wrap-item gift">
            <h2>参与有奖</h2>
            <div className="gift-area">
                {
                    roomIntroduce.roomPrizeDtoList && roomIntroduce.roomPrizeDtoList.map((gift: any) => <dl className="gift-item">
                        <dt>
                            <img src={gift.prizeImageUrl} alt="奖品封面" />
                        </dt>
                        <dd>
                            <p>
                                <label>奖品名称：</label>
                                <span>{gift.prizeName}</span>
                            </p>
                            <p>
                                <label>奖品描述：</label>
                                <span>{gift.prizeSummary}</span>
                            </p>
                            <p>
                                <label>中奖名单：</label>
                                <span>{gift.winners}</span>
                            </p>
                        </dd>
                    </dl>)
                }
            </div>
        </div>
        <div className="wrap-item introduct">
            <h2>公司介绍</h2>
            <p>{roomIntroduce.companySummary}</p>
        </div>
    </div > : null // you can add loading here before component loaded
    )
}
export default withRouter(connect(({ room }: any) => ({
    room: room.toJS(),
}))(DescTab));