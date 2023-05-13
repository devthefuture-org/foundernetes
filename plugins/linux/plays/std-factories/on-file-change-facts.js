const path = require("path")

const fs = require("fs-extra")
const { ctx } = require("@foundernetes/blueprint")

const onFileChange = require("./on-file-change")

module.exports = async (deps) => {
  const { play } = deps

  const getChangedFile = (vars) => {
    const { file } = vars
    const config = ctx.getConfig()
    return path.join(config.factsPath, "changed", file)
  }
  const getDate = async (vars) => {
    const changedFile = getChangedFile(vars)
    if (!(await fs.pathExists(changedFile))) {
      return false
    }
    return fs.readFile(changedFile, { encoding: "utf-8" })
  }
  const fileChanged = async (vars) => {
    const changedFile = getChangedFile(vars)
    return fs.writeFile(changedFile, new Date())
  }

  return onFileChange({
    ...deps,
    ...play,
    getDate,
    async run(vars, common) {
      const result = await play.run(vars, common)
      if (result) {
        await fileChanged(vars)
      }
      return result
    },
    tags: [...(play.tags || []), "yolo-composable"],
  })
}
