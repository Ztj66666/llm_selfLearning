# React Hooks 简介

Hooks 是 React 16.8 的新增特性。它可以让你在不编写 class 的情况下使用 state 以及其他的 React 特性。

## 常用 Hooks

1.  `useState`: 用于在函数组件中添加状态。
2.  `useEffect`: 用于处理副作用（如数据获取、订阅、手动修改 DOM）。
3.  `useContext`: 用于在组件之间共享数据，避免 props drilling。
4.  `useReducer`: 用于处理复杂的状态逻辑。

## 规则

*   只能在函数最外层调用 Hook。不要在循环、条件判断或者子函数中调用。
*   只能在 React 的函数组件中调用 Hook。
