/**
 * @desc ts公用导出type
 */

// 单个窗口按钮
export type TitleMenuType = {
    type: string,
    click?: any
}

// 窗口按钮菜单集群
export type TitleMenusType = Array<TitleMenuType>

// layout头部单个按钮
export type HeaderBtnType = {
    key: string,
    value: string
}

// layout头部按钮集群
export type HeaderBtnsType = Array<HeaderBtnType>

// sidebar 左侧菜单栏
export type SidebarType = {
    key: string,
    value: any
}

export type SidebarsType = Array<SidebarType>