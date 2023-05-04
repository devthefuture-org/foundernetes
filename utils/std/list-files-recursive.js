const { join } = require("path")
const { readdir } = require("fs/promises")

const walk = async (dirPath, includeDirs) =>
  Promise.all(
    await readdir(dirPath, { withFileTypes: true }).then((entries) =>
      entries.map(async (entry) => {
        const childPath = join(dirPath, entry.name)
        if (!entry.isDirectory()) {
          return childPath
        }
        return [
          ...(includeDirs ? [`${childPath}/`] : []),
          ...(await walk(childPath, includeDirs)),
        ]
      })
    )
  )

module.exports = async (dir, includeDirs = false) => {
  const allFiles = await walk(dir, includeDirs)
  return allFiles.flat(Number.POSITIVE_INFINITY)
}
