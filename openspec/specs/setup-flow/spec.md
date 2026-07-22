# setup-flow Specification

## Purpose

定义 GitHub Blogger 初始化与配置流程的行为契约，包括命令入口、多步配置收集、步骤顺序维护、共享常量边界、配置持久化和仓库初始化结果。

## Requirements

### Requirement: 初始化流程入口

扩展 SHALL 暴露一个初始化流程；当配置命令被触发，或者打开命令执行时缺少必要配置，该流程都可以启动。

#### Scenario: 打开命令缺少配置

- **WHEN** 用户触发打开命令且必要配置不完整
- **THEN** 扩展 SHALL 启动初始化流程，而不是打开编辑器

#### Scenario: 配置命令

- **WHEN** 用户触发配置命令
- **THEN** 扩展 SHALL 启动初始化流程

### Requirement: 按顺序收集配置

初始化流程 SHALL 按顺序收集用户名、GitHub Token、仓库名、分支名和颜色模式，并且 SHALL 允许用户在流程中返回上一步或取消。

#### Scenario: 完整配置流程

- **WHEN** 用户按顺序完成每个输入步骤
- **THEN** 流程 SHALL 在继续之前收集完所有必需值

#### Scenario: 返回上一步

- **WHEN** 用户在流程中选择返回操作
- **THEN** 流程 SHALL 回到上一步

#### Scenario: 取消流程

- **WHEN** 用户取消流程
- **THEN** 流程 SHALL 停止，且不保存新的配置

### Requirement: 步骤顺序可配置

初始化流程 SHALL 通过一个可调整顺序的步骤定义来驱动执行；当仅调整步骤顺序时，开发者 SHALL 只需要修改步骤定义的顺序，而不需要改动执行器逻辑。

#### Scenario: 调整步骤顺序

- **WHEN** 开发者交换两个步骤的定义顺序
- **THEN** 初始化流程 SHALL 按新的定义顺序执行
- **AND** 执行器逻辑 SHALL 保持不变

### Requirement: 共享常量与类型边界

扩展端和客户端共用的运行时常量 SHALL 定义在 `shared/constants.ts`；`shared/types/` 目录 SHALL 只保存类型定义，相关类型可以从共享常量派生，但 SHALL NOT 在类型文件中定义运行时常量。

#### Scenario: 配置项常量

- **WHEN** 初始化流程需要引用扩展配置项 key
- **THEN** 流程 SHALL 使用 `shared/constants.ts` 中定义的配置项常量
- **AND** `shared/types/` 中对应的配置项类型 SHALL 从该常量派生

### Requirement: 持久化并初始化配置

初始化流程 SHALL 在完成后全局保存收集到的配置、使缓存失效，并尝试创建目标仓库。

#### Scenario: 新仓库

- **WHEN** 收集到的仓库不存在
- **THEN** 扩展 SHALL 创建该仓库并显示成功消息

#### Scenario: 已存在仓库

- **WHEN** 收集到的仓库已经存在
- **THEN** 扩展 SHALL 跳过创建并仍然显示成功消息

#### Scenario: 初始化失败

- **WHEN** 仓库创建因其他原因失败
- **THEN** 扩展 SHALL 显示包含失败原因的错误消息
