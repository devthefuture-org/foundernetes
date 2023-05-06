const path = require("path")
const omit = require("lodash/omit")
const { createComposer } = require("@foundernetes/blueprint")
const listFilesRecursive = require("@foundernetes/std/list-files-recursive")
const ctx = require("~/ctx")

module.exports = async ({ mod }) => {
  return createComposer(async (vars) => {
    const { target } = vars
    let { source } = vars
    source = path.resolve(source)

    const options = omit(vars, ["target", "source"])

    const files = await listFilesRecursive(source, true)

    const iterator = ctx.getIterator()

    const relativeFiles = files.map((file) => file.slice(source.length + 1))

    await iterator.eachSeries(relativeFiles, async (file) => {
      const isDir = file.endsWith("/")
      if (isDir) {
        await mod.mkdir({ ...options, target: `${target}/${file}` })
      } else {
        await mod.uploadFile({
          ...options,
          source: `${source}/${file}`,
          target: `${target}/${file}`,
        })
      }
    })
  })
}
