const fs = require("fs")

const getTreeDirSync = (source) =>
  fs
    .readdirSync(source, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory() || dirent.isSymbolicLink())
    .map((dirent) => dirent.name)

const workspaces = ["packages", "modules"]

const bumpFiles = [
  { filename: "package.json", type: "json" },
  ...workspaces.reduce((acc, dir) => {
    acc.push(
      ...getTreeDirSync(dir).map((subdir) => ({
        filename: `${dir}/${subdir}/package.json`,
        type: "json",
      }))
    )
    return acc
  }, []),
]

module.exports = {
  bumpFiles,
}
