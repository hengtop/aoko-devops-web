---
name: react-functional-component-spec
description: 为 React 函数式组件生成统一的 TypeScript 代码规范。用于新增组件、重构组件或用户要求按规范生成 React 组件时，约束类型定义、Hooks 使用、事件函数和 Props 设计。
source: https://fiture.feishu.cn/wiki/OfZKwJiWUi7nk5kzjz9cgYqvnrG
synced_by: external-skill-loader
---

# react-functional-component-spec

为 React 函数式组件生成统一的 TypeScript 代码规范。用于新增组件、重构组件或用户要求按规范生成 React 组件时，约束类型定义、Hooks 使用、事件函数和 Props 设计。

## React 函数式组件生成规范

### 自动触发

当出现以下意图时使用本规范：

- 生成 React 组件
- 新增函数式组件
- 重构 TSX 组件
- 按规范定义 Props / Hooks / 事件函数

### 目标

生成可维护、强类型、可复用的 React 函数式组件，统一以下内容：

- 类型定义
- Hooks 使用
- 事件函数定义
- Props 使用方式

### 基础约束

- 新增代码必须使用 TypeScript（`.tsx`）
- 使用函数式组件，不使用 class 组件
- 默认导出一个组件（每个文件一个组件）
- 使用 2 空格缩进
- 不使用 `any`；无法精确定义时用 `unknown` + 类型收窄
- 所有导出的类型与组件命名清晰、语义化

### 1. 类型定义规范（强制）

#### 1.1 Props 类型

- 使用 `interface` 定义 Props，命名为 `XxxProps`
- 必选与可选字段明确区分（`?`）
- 回调函数类型必须显式声明参数与返回值
- `children` 仅在确实需要时声明：`children?: React.ReactNode`

#### 1.2 状态与派生数据

- `useState` 必须有明确泛型或可推导初始值
- 复杂对象优先定义独立类型（如 `UserInfo`、`FilterParams`）
- 派生数据优先 `useMemo` 或局部常量，不重复存储到 `state`

#### 1.3 API 与异步数据类型

- 请求参数、响应结构定义为独立类型：`XxxReq`、`XxxRes`
- 对可空值显式建模（如 `string | null`），禁止隐式假设

### 2. Hooks 使用规范（强制）

#### 2.1 调用位置

- Hooks 只能在组件顶层或自定义 Hook 顶层调用
- 禁止在条件、循环、嵌套函数中调用 Hooks

#### 2.2 useEffect

- 必须声明完整依赖数组
- Effect 内异步逻辑使用独立函数并处理异常
- 涉及订阅、定时器、监听器时必须返回清理函数

#### 2.3 useMemo / useCallback

- 仅在“稳定引用有收益”时使用，避免滥用
- 传给子组件的事件回调、昂贵计算结果优先考虑 memo 化
- 依赖项必须完整，禁止刻意漏依赖规避重渲染

#### 2.4 自定义 Hook

- 命名必须以 `use` 开头（如 `useUserProfile`）
- 返回值优先对象结构，便于扩展与按需解构

### 3. 事件函数定义规范（强制）

#### 3.1 命名

- 组件内事件处理函数统一 `handleXxx` 命名（如 `handleSubmit`）
- 透传给子组件的 Props 回调统一 `onXxx` 命名（如 `onSubmit`）

#### 3.2 类型

- DOM 事件使用 React 事件类型：
  - `React.MouseEvent<HTMLButtonElement>`
  - `React.ChangeEvent<HTMLInputElement>`
  - `React.FormEvent<HTMLFormElement>`
- 业务回调参数类型必须显式定义，避免 `any`

#### 3.3 行为约束

- 事件函数中优先早返回，降低嵌套层级
- 异步事件函数必须有错误处理（`try/catch` 或上抛并统一处理）
- 不在 JSX 内联复杂匿名函数逻辑，复杂逻辑提取到 `handleXxx`

### 4. Props 使用规范（强制）

#### 4.1 解构与默认值

- 在函数参数处解构 Props
- 可选 Props 默认值使用解构默认值，不使用 `defaultProps`
- 示例：`({ size = 'md', disabled = false }: ButtonProps)`

#### 4.2 单向数据流

- Props 只读，不得在组件内修改
- 状态提升优先通过 `onXxx` 回调通知父组件

#### 4.3 透传规则

- 控制 `...rest` 透传范围，仅在明确场景使用
- 避免把无关字段透传到原生 DOM，防止无效属性告警

#### 4.4 children 规范

- 需要插槽能力时再声明 `children`
- 不需要 `children` 的组件禁止声明 `children`

### 输出模板

```tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';

interface UserCardProps {
  userId: string;
  editable?: boolean;
  onSave?: (payload: { userId: string; nickname: string }) => Promise<void>;
  children?: React.ReactNode;
}

interface UserInfo {
  id: string;
  nickname: string;
}

export default function UserCard({
  userId,
  editable = false,
  onSave,
  children,
}: UserCardProps): JSX.Element {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [nickname, setNickname] = useState<string>('');

  useEffect(() => {
    let isActive = true;

    const fetchUser = async (): Promise<void> => {
      try {
        // TODO: replace with real request
        const data: UserInfo = { id: userId, nickname: 'guest' };
        if (isActive) {
          setUser(data);
          setNickname(data.nickname);
        }
      } catch (error) {
        // TODO: handle error consistently
      }
    };

    void fetchUser();

    return () => {
      isActive = false;
    };
  }, [userId]);

  const canSave = useMemo(() => {
    return editable && nickname.trim().length > 0;
  }, [editable, nickname]);

  const handleNicknameChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      setNickname(event.target.value);
    },
    [],
  );

  const handleSaveClick = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
      event.preventDefault();
      if (!canSave || !onSave || !user) {
        return;
      }

      try {
        await onSave({ userId: user.id, nickname: nickname.trim() });
      } catch (error) {
        // TODO: handle error consistently
      }
    },
    [canSave, nickname, onSave, user],
  );

  return (
    <section>
      <h3>User Card</h3>
      <input value={nickname} onChange={handleNicknameChange} />
      <button type="button" disabled={!canSave} onClick={handleSaveClick}>
        Save
      </button>
      {children}
    </section>
  );
}
```
