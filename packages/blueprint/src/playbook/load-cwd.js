const path = require("path")

const fs = require("fs-extra")

const playbookKey = require("@foundernetes/std/playbook-key")
const ctx = require("@foundernetes/ctx")

const exts = [".js"]

const getList = async (playbooksPath) => {
  const ls = await fs.readdir(playbooksPath)
  return ls.sort()
}

const getPlaybookSet = async () => {
  const playbooks = {}

  const config = ctx.getConfig()
  const { cwd, playbooksDir } = config
  const playbooksPath = `${cwd}/${playbooksDir}`

  let index

  const ls = await getList(playbooksPath)
  for (const f of ls) {
    let key
    const playbookInc = `${playbooksPath}/${f}`
    if ((await fs.stat(playbookInc)).isDirectory()) {
      if (!(await fs.pathExists(`${playbookInc}/index.js`))) {
        continue
      }
      key = f
    } else {
      const ext = path.extname(f)
      if (!exts.includes(ext)) {
        continue
      }
      key = f.substring(0, f.length - ext.length)
    }
    const playbookCallback = require(playbookInc)
    if (key === "index") {
      index = playbookCallback
      continue
    }
    key = playbookKey(key)
    playbooks[key] = playbookCallback
  }

  return { index, playbooks }
}

module.exports = {
  getPlaybookSet,
}
