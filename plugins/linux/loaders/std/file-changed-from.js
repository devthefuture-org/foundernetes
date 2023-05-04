const path = require("path")

const async = require("@foundernetes/async")
const fs = require("fs-extra")
const micromatch = require("micromatch")
const dayjs = require("dayjs")

module.exports = async () => {
  return async (vars) => {
    const { recursive = true, exclude = [] } = vars

    let { file } = vars
    if (!Array.isArray(file)) {
      file = [file]
    }

    let { date } = vars
    if (!(date instanceof Date)) {
      date = dayjs(date).toDate()
    }
    date = new Date(date)
    date.setSeconds(date.getSeconds() + 1)

    const compareFileLastModified = async (f, depth = 0) => {
      const stat = await fs.stat(f)
      const { mtime, ctime } = stat
      const lastModified = mtime || ctime
      if (lastModified > date) {
        return true
      }
      if (stat.isDirectory() && recursive) {
        const excludePattern = [
          ...exclude,
          ...(depth === 0 ? exclude.map((p) => path.join(file, p)) : []),
        ]

        const files = (await fs.readdir(f))
          .map((child) => `${f}/${child}`)
          .filter((p) => !micromatch.isMatch(p, excludePattern))

        if (
          await async.some(files, async (p) =>
            compareFileLastModified(p, depth + 1)
          )
        ) {
          return true
        }
      }
      return false
    }
    const changed = await async.some(file, async (f) => {
      if (await compareFileLastModified(f)) {
        return true
      }
    })
    return changed
  }
}
