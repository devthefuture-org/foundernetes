const fs = require("fs-extra")
const compareFile = require("./compare-file")

module.exports = async (source, target, copyOptions = {}) =>
  fs.copy(source, target, {
    ...copyOptions,
    async filter(src, dest) {
      if ((await fs.stat(src)).isDirectory()) {
        return true
      }
      if (!(await fs.pathExists(dest))) {
        return true
      }
      return !(await compareFile(src, dest))
    },
  })
