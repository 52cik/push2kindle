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

  require(key)(res => {
    if (res.length) {
      res.forEach(ret => sender(ret.title, ret.text, () => spinner.stop()))
    }
  })
})

/**
 * 发送邮件
 *
 * @param  {string}   title   标题
 * @param  {string}   content 内容
 * @param  {Function} cb      完成回调
 */
function sender(title, content, cb) {
  let options = {
    from: pkg.email.user,
    to: pkg.email.kindle,
    subject: 'Kindle New File',
    attachments: []
  }

  options.attachments.push({
    filename: title + '.html',
    content: makeHtml(title, content),
    contentType: 'text/html'
  })

  transporter.sendMail(options, function(error, info) {
    if (error) {
      // log.error(error.code + ': ' + JSON.stringify(error));
    } else {
      // log.info('send to kindle successfully: ' + JSON.stringify(info));
      spinner.text = '完成!'
      console.log(title, '- 发送完成!')
    }

    cb()
  })
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
