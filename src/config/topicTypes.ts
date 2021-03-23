/*
 * @FilePath: \linkup-ts\src\config\topicTypes.ts
 * @Description: topicTypes
 * @Author: humandetail
 * @Date: 2021-03-18 23:52:52
 * @LastEditors: humandetail
 * @LastEditTime: 2021-03-22 23:18:29
 */

// export default {
//   // 元素更新
//   'UPDATED_ELEMENT': 'UPDATED_ELEMENT',

//   // 元素比较
//   'COMPARE_ELEMENT': 'COMPARE_ELEMENT'
// };

enum TopicTypes {
  // 游戏开始
  START,
  // 元素更新
  UPDATED_ELEMENT,
  // 元素选择
  PICK_ELEMENT,
  // 空元素
  ELEMENT_IS_EMPTY,
  // 元素比较
  COMPARE_ELEMENT,
  // 元素连接失败
  CONNECT_FAIL,
  // 元素连接成功
  CONNECT_SUCCESS,
  // 元素连接成功动画完成
  CONNECT_FINISHED,
  // 游戏结束
  GAME_OVER
}

export default TopicTypes;
