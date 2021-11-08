const got = require('got')
const core = require('@actions/core')
const github = require('@actions/github')
const wakatimeKey = core.getInput("WAKATIME_API_KEY")
const token = core.getInput("GH_TOKEN");
const octokit = github.getOctokit(token);
const wakaUrl = 'https://wakatime.com/api/v1/users/current/stats/last_7_days?api_key=' + wakatimeKey
// compose 组合函数
const compose = function (handles) {
  return handles.reduceRight((prev, next) => {
    return prev.then(next)
  }, Promise.resolve())
}
// 获取当前的用户名
const getUsername = () => octokit.rest.users.getAuthenticated().then(res => res.data.login)
// 获取历史的readme内容
const getReadme = username => octokit.rest.repos.getReadme({
  owner: username,
  repo: username,
}).then(res => ({sha: res.data.sha, username }))
// 更新readme
const updateReadme = ({sha, content, username}) => octokit.rest.repos.createOrUpdateFileContents({
  owner: username,
  repo: username,
  path: 'README.md',
  message: 'update readme by script fourth',
  content: Buffer.from(content).toString('base64'),
  sha
})
// 生成新的readme内容
const generateContent = ({sha, username}) => got(wakaUrl, { responseType: 'json' }).then(res => {
  const { editors, languages, projects } = res.body.data
  const tempStr = obj => `* ${obj.name}/${obj.percent}`
  const content = `
## 编辑器情况:
${editors.map(item => tempStr(item)).join('\n')}
## 语言情况: 
${languages.map(item => tempStr(item)).join('\n')}
## 项目情况: 
${projects.map(item => tempStr(item)).join('\n')}
`
  return {
    sha,
    content,
    username
  }
}).catch(err => {
  console.log(err)
})

compose([updateReadme, generateContent, getReadme, getUsername]).then(res => {
  console.log('更新readme成功',res)
}).catch(e => {
  console.log(e)
})
