# Analog-IC-Visualizations
Interactive visualizations for Analog and Power Management IC design concepts

## 📖 关于本项目 (About)
在模拟集成电路（Analog IC）与电源管理集成电路（PMIC）设计中，理解底层的半导体物理效应与电路的瞬态响应是重中之重。本项目旨在建立一个个人的、开源的交互式知识库。

通过将复杂的微积分方程和器件物理特性转化为浏览器中可实时交互的图表与动画，本项目为工程师和研究人员提供了一个直观的“沙盒”。在这里，你可以动态调整电路参数（如 $R_g$, $C_{gd}$, 补偿电容等），并无延迟地观察波形变化，从而建立起深厚的工程直觉。

## 🗺️ 项目模块与路线图 (Modules & Roadmap)

本项目采用单体仓库（Monorepo）结构，按独立的物理效应或电路模块进行划分：

### 🟢 已完成 (Completed)
* **[`/01_Miller_Plateau`](./01_Miller_Plateau/) - MOSFET 开关米勒效应可视化**
  * 交互式演示 MOSFET 开启与关断过程中的 $V_{gs}$ 钳位与 $V_{ds}$ 瞬态。
  * 实时计算米勒平台电压、充放电时间与开关损耗。

### ⏳ 开发中 / 计划中 (WIP / Planned)
* **[`/02_LDO_Transient_Response`](#) - LDO 负载瞬态响应分析**
  * 针对 Two-Stage LDO 稳压器，可视化负载电流阶跃跳变（Load Transient）时的输出电压下冲/过冲（Undershoot/Overshoot）。
  * 动态演示主极点、非主极点以及 ESR 零点对系统相位裕度（Phase Margin）和建立时间的影响。
* **[`/03_Sigma_Delta_ADC_Modeling`](#) - 连续时间 Sigma-Delta ADC 行为级建模**
  * 二阶 Continuous-Time $\Sigma-\Delta$ 调制器的时域波形与频域噪声整形（Noise Shaping）过程可视化。
* **[`/04_DCDC_Control_Loops`](#) - DC-DC 转换器控制环路**
  * 直观对比 Voltage-Mode 与 Current-Mode 控制下的瞬态响应与占空比调节过程。

## 🚀 运行说明 (How to Run)
本仓库内的所有可视化工具均为纯前端实现（HTML5 / CSS3 / JavaScript），无需安装任何复杂的后端依赖或仿真器。

1. 将本仓库克隆至本地：
   ```bash
   git clone [https://github.com/YourUsername/Analog-IC-Visualizations.git](https://github.com/YourUsername/Analog-IC-Visualizations.git)
