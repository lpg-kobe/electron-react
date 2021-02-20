/**
 * @desc 活动介绍描述
 */
'use strict'
import React, { useState, useEffect } from 'react';
import { connect } from 'dva';
import { withRouter } from 'dva/router';
// @ts-ignore
import BreakWord from '@/components/breakWord'

type PropsType = {
    room: any,
    match: any,
    dispatch: any
}

const DescTab = (props: PropsType) => {
    const {
        room: { roomIntroduce }
    } = props

    const [imgError, setImgError]: any = useState({
        company: false,
        avatar: [],
        gift: []
    })

    useEffect(() => {
        // 初始化待处理损坏图片图片数组
        if (!roomIntroduce.showMemberList || !roomIntroduce.showMemberList.length || roomIntroduce.showMemberList.length === imgError['avatar'].length) {
            return
        }
        setImgError({
            ...imgError,
            avatar: (() => {
                let count = 0
                roomIntroduce.showMemberList.forEach((ele: any) => {
                    count += ele.memberList.length
                })
                return new Array(count).fill(false)
            })(),
            gift: new Array(roomIntroduce.roomPrizeDtoList.length).fill(false)
        })
    }, [roomIntroduce.showMemberList]);

    /** handle error of img */
    function handleImgError(event: any, key: string, value: any) {
        event.target.onerror = null
        setImgError({
            ...imgError,
            [key]: value
        })
    }

    return (roomIntroduce ? <div className="tab-container desc">
        <div className="wrap-item time">
            <div className="item-l">
                {
                    imgError['company'] ? null :
                        <img
                            src={roomIntroduce.companyLogoUrl}
                            onError={(event) => handleImgError(event, 'company', true)}
                        />
                }
            </div>
            <div className="item-r">
                <h1>{roomIntroduce.roomName}</h1>
                <div className="tag-box">
                    <p>举办时间：{roomIntroduce.time}</p>
                    <p>举办单位：{roomIntroduce.companyName || '--'}</p>
                </div>
            </div>
        </div>
        {
            roomIntroduce.description && <div className="wrap-item desc">
                <h2>内容简介</h2>
                <BreakWord
                    options={{ text: roomIntroduce.description }} />
            </div>
        }
        {
            roomIntroduce.showMemberList && roomIntroduce.showMemberList.filter((member: any) => member.identity !== '主播').length ? <div className="wrap-item member">
                <ul>
                    {
                        roomIntroduce.showMemberList && roomIntroduce.showMemberList.map((item: any) => item.identity !== '主播' ? <li className="member-line" key={Math.random()}>
                            <h2>{item.identity}</h2>
                            {
                                item.memberList.map((member: any, i: number) => <dl key={Math.random()}>
                                    <dt>
                                        {
                                            imgError['avatar'][i] ? null :
                                                <img src={member.memberLogoUrl} onError={(event) =>
                                                    handleImgError(event, 'avatar', (() => {
                                                        const errs: any = [...imgError['avatar']]
                                                        errs[i] = true
                                                        return errs
                                                    })())} />
                                        }
                                    </dt>
                                    <dd>
                                        <h3>{member.memberName} - {member.memberCompany} / {member.memberJob}</h3>
                                        <BreakWord
                                            options={{ text: member.memberSummary }} />
                                    </dd>
                                </dl>)
                            }
                        </li> : null)
                    }
                </ul>
            </div> : null
        }
        {
            roomIntroduce.roomPrizeDtoList && roomIntroduce.roomPrizeDtoList.length ? <div className="wrap-item gift">
                <h2>参与有奖</h2>
                <div className="gift-area">
                    {roomIntroduce.roomPrizeDtoList.map((gift: any, i: number) => <dl key={Math.random()} className="gift-item">
                        <dt>
                            {
                                imgError['gift'][i] ? null :
                                    <img
                                        src={gift.prizeImageUrl}
                                        onError={(event) =>
                                            handleImgError(event, 'gift', (() => {
                                                const errs: any = [...imgError['gift']]
                                                errs[i] = true
                                                return errs
                                            })())}
                                        alt="奖品封面"
                                    />
                            }
                        </dt>
                        <dd>
                            <p>
                                <label>奖品名称：</label>
                                <span>{gift.prizeName}</span>
                            </p>
                            <p>
                                <label>奖品描述：</label>
                                <BreakWord
                                    options={{
                                        text: gift.prizeSummary,
                                        container: 'span'
                                    }} />
                            </p>
                            <p>
                                <label>中奖名单：</label>
                                <span>{gift.winners}</span>
                            </p>
                        </dd>
                    </dl>)
                    }
                </div>
            </div> : null
        }
        {
            roomIntroduce.companySummary && <div className="wrap-item introduct">
                <h2>公司介绍</h2>
                <BreakWord
                    options={{
                        text: roomIntroduce.companySummary
                    }} />
            </div>
        }
    </div > : null // you can add loading here before component loaded
    )
}
export default withRouter(connect(({ room }: any) => ({
    room: room.toJS(),
}))(DescTab));