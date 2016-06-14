'use strict'

const ora = require('ora')
const pkg = require('../package.json')
const nodemailer = require('nodemailer')

const spinner = ora('加载爬虫...').start()
const spiders = Object.keys(pkg.dependencies).filter(key => key.indexOf('kindle-spider') > -1)

const transporter = nodemailer.createTransport({
  service: pkg.email.service,
  auth: {
    user: pkg.email.user,
    pass: pkg.email.pass
  }
})

spiders.forEach(key => {
  spinner.text = '爬虫 [' + key + '] 爬行中...'

  require(key)(res => sender(res, (err, res) => {
    spinner.stop()

    if (err) {
      console.log('>', err.msg, '\n')
    } else {
      res.map(x => console.log('>', x.title, '- 发送完成!'))
      console.log()
    }
  }))
})

/**
 * 发送邮件
 *
 * @param  {string}   title   标题
 * @param  {string}   content 内容
 * @param  {Function} cb      完成回调
 */
function sender(res, cb) {
  if (!res.length) {
    cb({err: 1, msg: '没有可发送的内容!'})
    return false
  }

  let options = {
    from: pkg.email.user,
    to: pkg.email.kindle,
    subject: 'push to kindle.',
    text: 'push to kindle.',
    attachments: attachments(res)
  }

  transporter.sendMail(options, (error, info) => {
    if (error) {
      cb({err: error, msg: '推送失败!'})
    } else {
      cb(false, res)
    }
  })
}


function attachments(arr) {
  let ret = [];
  arr.forEach(file => {
    ret.push({
      filename: file.title + '.html',
      content: makeHtml(file.title, file.text),
      contentType: 'text/html'
    })
  })

  return ret
}

/**
 * 生成kindle可读html
 *
 * @param  {string} title   标题
 * @param  {string} content 内容
 * @return {string}
 */
function makeHtml(title, content) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta http-equiv="Content-Type" content="text/html;charset=UTF-8">
    <title>${title}</title>
  </head>
  <body>
    <h2>${title}</h2>

    <hr>
    <br>
    ${content}
    <hr>
    <br>

  </body>
</html>`
}
