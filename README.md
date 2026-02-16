# 🀄 南昌麻将记分器

移动端适用的南昌麻将番数计算工具。

## 功能

- 番数计算（屁胡、碰碰胡、清一色、七对等）
- 赖子数量统计
- 庄家/闲家设置
- 分数实时计算
- 一键复制战绩

## 使用方法

1. 选择胡牌牌型（可多选）
2. 设置赖子数量
3. 选择庄家/闲家
4. 查看实时计算的分数

## 部署

本项目已配置 GitHub Actions，自动部署到 GitHub Pages。

```bash
# 推送到 GitHub
git add .
git commit -m "feat: 南昌麻将记分器"
git remote add origin https://github.com/你的用户名/nanchang-majiang.git
git push -u origin main
```

访问 `https://你的用户名.github.io/nanchang-majiang/`

## 技术栈

- 纯 HTML/CSS/JS
- PWA 支持
- 移动端响应式设计
