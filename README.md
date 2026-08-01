# 网易云音乐 API · Netlify 一键部署

基于 [NeteaseCloudMusicApi](https://gitlab.com/Binaryify/neteasecloudmusicapi)（npm 包）的极简部署模板。

**部署到你自己的 Netlify 账号**，网易云请求只发往你自己的实例。

**为什么选 Netlify：** `vercel.app`、`pages.dev` 等默认域名在大陆被墙（实测直连超时），而 Netlify 的默认域名 `xxx.netlify.app` 大陆可直接访问（实测正常响应），**无需挂代理**。

## 一键部署

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/luyi90720-sys/netease-cloud-music-api-netlify)

点击上方按钮 → 用 GitHub 登录 Netlify → 直接 Deploy，无需任何配置。

部署完成后会得到一个形如 `https://xxx.netlify.app` 的地址。

## 在插件中使用

1. 复制部署完成后的 `https://xxx.netlify.app` 地址
2. 打开插件「设置」页 → 「网易云 API 地址」输入框 → 粘贴 → 保存设置
3. 粘贴网易云 Cookie（`MUSIC_U=值; __csrf=值`）→ 保存

之后网易云搜索、每日推荐、歌单、歌词、播放全部请求你自己的实例。

## 接口清单（本模板已覆盖插件所需）

| 功能 | 接口 |
|---|---|
| 搜索 | `/search?keywords=xx&type=1&limit=20` |
| 歌曲详情（封面） | `/song/detail?ids=1,2`（逗号分隔） |
| 歌词 | `/lyric?id=xx` |
| 每日推荐 | `/recommend/songs` |
| 用户歌单 | `/user/playlist?uid=xx` |
| 歌单详情 | `/playlist/detail?id=xx` |
| 播放链接 | `/song/url?id=xx&br=xx&cookie=xx` |
| 用户信息 | `/user/account` |

登录态通过 `cookie` 参数透传（浏览器跨域环境无法设置 Cookie 头，NCM 原生支持 cookie 参数）。

## 注意事项

- **播放链接（`/song/url`）必须携带登录 Cookie**：网易云对未登录请求返回 `code:404`（版权限制），这是网易云服务端行为，与部署无关。搜索、详情、歌词无需 Cookie 即可使用。
- 免费 Netlify 账号即可使用，无需绑定信用卡
- 首次部署后请求需 "冷启动" 约几秒，之后正常
- Netlify 函数单次执行上限 10 秒，网易云接口绝大多数请求在此范围内
- 如遇网易云风控（接口报错），稍后重试或刷新 Cookie 即可
