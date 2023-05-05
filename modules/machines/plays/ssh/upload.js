const fs = require("fs-extra")
const { createComposer } = require("@foundernetes/blueprint")

module.exports = async ({ mod }) => {
  return createComposer(async (vars) => {
    const { source } = vars
    if (source && (await fs.stat(source)).isDirectory()) {
      return mod.uploadDir(vars)
    }
    return mod.uploadFile(vars)
  })
}
