/**
 * @desc 直播间互动区
 */
import React, { useState, useEffect, useLayoutEffect } from 'react';
import { connect } from 'dva';
import { withRouter } from 'dva/router';
// @ts-ignore
import List from 'react-virtualized/dist/commonjs/List';
// @ts-ignore
import InfiniteLoader from 'react-virtualized/dist/commonjs/InfiniteLoader';
// @ts-ignore
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
// @ts-ignore
import WindowScroller from 'react-virtualized/dist/commonjs/WindowScroller';

type PropsType = {
    room: any,
    chat: any,
    match: any,
    dispatch(action: any): void
}

type RowType = {
    index: number,
    isScrolling: boolean,
    isVisible: boolean,
    key: any,
    parent: any,// Reference to the parent List (instance)
    style: any
}

type ChildRowType = {
    onRowsRendered(): void,// callback after children loaded
    registerChild(): void // dom element to get children
}

function ActiveInfo(props: PropsType) {
    const [msgId, setMsgId] = useState('')
    const { room: { chatList }, dispatch, match: { params: { id } } } = props

    useLayoutEffect(() => {
        dispatch({
            type: 'room/getChatList',
            payload: {
                params: {
                    roomId: id,
                    msgId,
                    size: 50
                }
            }
        })
    }, [])

    useEffect(() => {
        chatList[0] && setMsgId(chatList[0].msgId)
    }, [chatList])

    function renderItem({ index, key }: RowType) {
        const rowItem = chatList[index]
        return <div className="wrap-item" key={key}>
            <label> {rowItem.nick}{`[${rowItem.identity}]`}</label>
            <p>{rowItem.content.replace(/\n/g, '<br>')}</p>
        </div>
    }

    function loadMoreRows({ startIndex, stopIndex }: any) {
        console.log('ready to load more...', startIndex, stopIndex)
        // issue? this can not be caused after scroll  bottom or top,so i use scroll listen of list to handle load more
    }

    function handleScroll({ scrollTop }: any) {
        console.log(scrollTop)
    }

    function noListRender() {
        return <h3>暂时无人发言，快来抢占沙发~</h3>
    }
    return <div className="tab-container interactive">
        <InfiniteLoader
            isRowLoaded={({ index }: RowType) => !!chatList[index]}
            loadMoreRows={loadMoreRows}
            rowCount={chatList.length}
        >
            {({ onRowsRendered, registerChild }: ChildRowType) =>
                <div className="chat-panel">
                    <AutoSizer disableHeight>
                        {
                            ({ width }: any) => <List
                                width={width}
                                height={300}
                                onRowsRendered={onRowsRendered}
                                rowCount={chatList.length}
                                ref={registerChild}
                                rowHeight={20}
                                rowRenderer={renderItem}
                                noRowsRenderer={noListRender}
                                overscanRowCount={0}
                                tabIndex={chatList.length - 1}
                                onScroll={handleScroll}
                            />
                        }
                    </AutoSizer>
                </div>
            }
        </InfiniteLoader>
        <div className="operate-panel"></div>
    </div>
}
export default withRouter(connect(({ room }: any) => ({
    room: room.toJS(),
}))(ActiveInfo))
