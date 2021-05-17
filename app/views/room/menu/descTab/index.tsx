/**
 * @desc 活动介绍描述
 */

import React, { memo } from 'react';
import immutable from 'immutable';
import { useTranslation } from 'react-i18next';
import BreakWord from '@/components/breakWord';
import Img from '@/components/img';

const DescTab = (props: any) => {
  const {
    room: { roomIntroduce },
  } = props;
  const { t } = useTranslation();

  return roomIntroduce ? (
    <div className="tab-container desc">
      <div className="wrap-item time">
        <div className="item-l">
          <Img
            options={{
              src: roomIntroduce.companyLogoUrl,
              alt: 'company logo',
            }}
          />
        </div>
        <div className="item-r">
          <h1>{roomIntroduce.roomName}</h1>
          <div className="tag-box">
            <p>
              {t('举办时间')}：{roomIntroduce.time}
            </p>
            <p>
              {t('举办单位')}：{roomIntroduce.companyName || '--'}
            </p>
          </div>
        </div>
      </div>
      {roomIntroduce.description && (
        <div className="wrap-item desc">
          <h2>{t('内容简介')}</h2>
          <BreakWord options={{ text: roomIntroduce.description }} />
        </div>
      )}
      {roomIntroduce.showMemberList?.filter(
        (member: any) => member.identity !== '主播'
      ).length ? (
        <div className="wrap-item member">
          <ul>
            {roomIntroduce.showMemberList?.map((item: any) =>
              item.identity !== '主播' ? (
                <li className="member-line" key={Math.random()}>
                  <h2>{t(item.identity)}</h2>
                  {item.memberList.map((member: any) => (
                    <dl key={Math.random()}>
                      <dt>
                        <Img
                          options={{
                            src: member.memberLogoUrl,
                            alt: 'avatar of member',
                          }}
                        />
                      </dt>
                      <dd>
                        <h3>
                          {member.memberName} - {member.memberCompany} /{' '}
                          {member.memberJob}
                        </h3>
                        <BreakWord options={{ text: member.memberSummary }} />
                      </dd>
                    </dl>
                  ))}
                </li>
              ) : null
            )}
          </ul>
        </div>
      ) : null}
      {roomIntroduce.roomPrizeDtoList?.length ? (
        <div className="wrap-item gift">
          <h2>{t('参与有奖')}</h2>
          <div className="gift-area">
            {roomIntroduce.roomPrizeDtoList?.map((gift: any) => (
              <dl key={Math.random()} className="gift-item">
                <dt>
                  <Img
                    options={{
                      src: gift.prizeImageUrl,
                      alt: 'cover of gift',
                    }}
                  />
                </dt>
                <dd>
                  <p>
                    <label>{t('奖品名称')}：</label>
                    <span>{gift.prizeName}</span>
                  </p>
                  <p>
                    <label>{t('奖品描述')}：</label>
                    <BreakWord
                      options={{
                        text: gift.prizeSummary,
                        container: 'span',
                      }}
                    />
                  </p>
                </dd>
              </dl>
            ))}
          </div>
        </div>
      ) : null}
      {roomIntroduce?.companySummary && (
        <div className="wrap-item introduct">
          <h2>{t('公司介绍')}</h2>
          <BreakWord
            options={{
              text: roomIntroduce.companySummary,
            }}
          />
        </div>
      )}
    </div>
  ) : null; // you can add loading here before component loaded
};

export default memo(DescTab, (prevProps, nextProps) => {
  const prevMap = immutable.fromJS({
    roomIntroduce: prevProps.room.roomIntroduce,
  });
  const nextMap = immutable.fromJS({
    roomIntroduce: nextProps.room.roomIntroduce,
  });
  return immutable.is(prevMap, nextMap);
});
