const got = require('got')
const core = require('@actions/core')
const github = require('@actions/github')
const wakatimeKey = core.getInput("WAKATIME_API_KEY")
const token = core.getInput("GH_TOKEN");
const octokit = github.getOctokit(token);
const wakaUrl = 'https://wakatime.com/api/v1/users/current/stats/last_7_days?api_key=' + wakatimeKey
const compose = function (handles) {
  return handles.reduceRight((prev, next) => {
    return prev.then(next)
  }, Promise.resolve())
}
console.log('wakatimeKey', wakatimeKey)
console.log('token', token)
const getReadme = () => octokit.rest.repos.getReadme({
  owner: github.user,
  repo: github.user,
}).then(res => res.data.sha)
const updateReadme = ({sha, content}) => octokit.rest.repos.createOrUpdateFileContents({
  owner: github.user,
  repo: github.user,
  path: 'README.md',
  message: 'update readme by script fourth',
  content: Buffer.from(content).toString('base64'),
  sha
})
const generateContent = sha => got(wakaUrl, { responseType: 'json' }).then(res => {
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
    content
  }
}).catch(err => {
  console.log(err)
})

compose([updateReadme, generateContent, getReadme]).then(res => {
  console.log('更新readme成功',res)
})
