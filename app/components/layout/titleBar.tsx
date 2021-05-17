/**
 * @desc 公用标题栏组件
 */
import React, { ReactNode, useState } from 'react';
import {
  isWindowMax,
  maxWindow,
  unMaxWindow,
  minWindow,
  closeWindow,
  // @ts-ignore
} from '@/utils/ipc';
import { useTranslation } from 'react-i18next';
import { TitleMenusType } from '../../utils/type';

import './style.less';

interface PropsTypes {
  children?: ReactNode;
  titleBarProps?: TitleMenusType; // 要展示的窗口操作按钮
}

export default function TitleBar(props: PropsTypes) {
  const { t } = useTranslation();
  const [fullScreen, setFullScreen] = useState(isWindowMax());

  /**
   * @desc handle click of titlebar btn
   * @param {String} type event type
   * @param {Function} click callback of click
   */
  function handleBtnClick({ type, click }: any) {
    const btnReact: any = {
      refresh: () => location.reload(),
      min: () => minWindow(),
      max: () => {
        fullScreen ? unMaxWindow() : maxWindow();
        setFullScreen(!fullScreen);
      },
      close: () => closeWindow(),
    };
    click ? click(type) : btnReact[type]?.();
  }

  const {
    // @ts-ignore
    titleBarProps = titleBarProps || [
      {
        type: 'min',
        title: '最小化',
      },
      {
        type: 'close',
        title: '关闭',
      },
    ],
  } = props;

  return (
    <div className="title-bar-container">
      <div className="bar-l">{props.children}</div>
      <div className="bar-r">
        {titleBarProps?.map((btn: any, index: number) =>
          btn.icon ? (
            btn.icon
          ) : (
            <i
              key={index}
              title={t(btn.title)}
              className={`icon icon-${btn.type}-win`}
              onClick={() => handleBtnClick(btn)}
            />
          )
        )}
      </div>
    </div>
  );
}
