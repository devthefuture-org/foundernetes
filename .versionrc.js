const fs = require("fs-extra")

// package.json
const getDirectoriesSync = (source) =>
  fs
    .readdirSync(source, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory() || dirent.isSymbolicLink())
    .map((dirent) => dirent.name)

const bumpFiles = []

bumpFiles.push({ filename: "package.json", type: "json" })
const packageDirs = getDirectoriesSync("packages")
for (const dir of packageDirs) {
  const filename = `packages/${dir}/package.json`
  if (fs.pathExistsSync(filename)) {
    bumpFiles.push({ filename, type: "json" })
  }
}

// const chartsUpdater = "packages/dev-tools/lib/standard-version-chart-updater.js"

// bumpFiles.push({
//   filename: `Chart.yaml`,
//   updater: chartsUpdater,
// })

module.exports = {
  bumpFiles,
}
