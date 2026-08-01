// Netlify Functions 入口：包装 NeteaseCloudMusicApi（npm 包）
// 部署到使用者自己的 Netlify 账号后，网易云请求只发往使用者自己的实例
const os = require('os')
const fs = require('fs')
const path = require('path')
const serverless = require('serverless-http')

// 必须在 require NeteaseCloudMusicApi 之前创建 anonymous_token 文件：
// 该包在模块加载时同步读取 tmp/anonymous_token（util/request.js），serverless 干净环境
// 没有此文件会直接 ENOENT 崩溃。创建空文件即可绕过（带登录 Cookie 的请求用用户自己的
// MUSIC_U，不受影响；搜索/详情/歌词等接口无需该 token 即可用）。
try {
  const p = path.resolve(os.tmpdir(), 'anonymous_token')
  if (!fs.existsSync(p)) fs.writeFileSync(p, '')
} catch (e) {}

// serverless 环境不允许监听端口：NCM 的 serveNcmApi() 内部会调用 app.listen(port)，
// 会导致函数调用失败。把 listen 置为 no-op，Netlify 平台负责接收请求，App 直接处理 req/res。
try {
  const expressApp = require('express').application
  if (!expressApp.__ncmNoListenPatched) {
    expressApp.__ncmNoListenPatched = true
    expressApp.listen = function () {
      // 返回一个假的 server 对象，保持接口兼容
      return { on: function () {}, close: function () {}, listening: true }
    }
  }
} catch (e) {}

const { serveNcmApi } = require('NeteaseCloudMusicApi/server')

let appPromise = null

function getApp() {
  if (!appPromise) {
    appPromise = serveNcmApi({
      port: 3000,
      checkVersion: false,
    }).then(function (app) {
      return app
    }).catch(function (err) {
      console.error('[ncm-api] 初始化失败', err && err.message || err)
      throw err
    })
  }
  return appPromise
}

let handler = null

exports.handler = async function (event, context) {
  // CORS 预检请求直接放行
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, cookie',
        'Access-Control-Max-Age': '86400',
      },
      body: '',
    }
  }
  if (!handler) {
    const app = await getApp()
    handler = serverless(app)
  }
  // Netlify 重写（/* → 本函数）后 event.path 可能被替换为函数路径，
  // 用 rawUrl（Netlify 特有字段，含完整原始地址）还原真实请求路径。
  try {
    if (event.rawUrl) {
      const u = new URL(event.rawUrl)
      event.path = u.pathname
    }
  } catch (e) {}
  return handler(event, context)
}
