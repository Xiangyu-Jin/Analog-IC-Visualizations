# ⚡ MOSFET Miller Plateau Interactive Viewer

> 一个用于直观演示 MOSFET 开关瞬态与米勒效应 (Miller Effect) 的纯前端交互式可视化工具。

## 📖 简介 (Introduction)
在电力电子和模拟集成电路 (Analog IC) 设计中，理解 MOSFET 的开关瞬态——尤其是米勒平台 (Miller Plateau) ——对于评估开关损耗和设计栅极驱动电路至关重要。

本项目提供了一个基于 Web 的交互式面板，允许用户动态调整电路参数（如栅极电阻 $R_g$、驱动电压 $V_{drv}$、寄生电容 $C_{gd}$ 等），并实时观察这些参数对栅源电压 $V_{gs}$ 和漏源电压 $V_{ds}$ 波形的影响。本项目旨在将抽象的半导体物理过程转化为直观、可操作的视觉反馈。

本项目是 **Analog IC Visualizations** (模拟集成电路物理效应可视化) 系列的第一个模块。

## ✨ 核心特性 (Features)
* **实时物理模型拟合:** 基于 MOSFET 在饱和区/恒流区的转移特性，实时计算平台电压与开关时间。
* **交互式参数调节:** 提供多个核心参数的滑动控制面板，调整后波形图无延迟平滑重绘。
* **开通与关断全景:** 对比展示 Turn-on 和 Turn-off 过程中的电荷流动与电压 $\frac{dv}{dt}$ 变化差异。
* **工程视角解读:** 面板底部实时输出物理计算结果，包括米勒平台持续时间估算、栅极平台电流以及基础的开关损耗评估。

## 🚀 如何运行 (How to Run)
本项目为纯前端（HTML/CSS/JS）实现，完全在浏览器端运行，无需配置 Node.js、Python 等复杂的本地后端环境。

1. 克隆本仓库到本地:
   ```bash
   git clone [https://github.com/你的用户名/你的仓库名.git](https://github.com/你的用户名/你的仓库名.git)
