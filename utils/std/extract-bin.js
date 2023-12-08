const path = require("path")
const fs = require("fs-extra")

const untildify = require("./untildify")
const syncDir = require("./sync-dir")

module.exports = async (extractBinPath, options = {}) => {
  const {
    pathUpdate = true,
    pathUpdateMode = "append",
    pathUpdateForce = false,
  } = options
  if (!Array.isArray(extractBinPath)) {
    extractBinPath = [extractBinPath]
  }
  const envPath = process.env.PATH.split(path.delimiter)
  for (let p of extractBinPath) {
    if (typeof p === "string") {
      p = { source: p }
    }
    const { source } = p
    if (!(await fs.pathExists(source))) {
      continue
    }
    let { target = "~/.foundernetes/bin" } = p
    target = untildify(target)
    await syncDir(source, target)
    if (!envPath.includes(target) || pathUpdateForce) {
      if (pathUpdateMode === "prepend") {
        envPath.unshift(target)
      } else {
        envPath.push(target)
      }
    }
  }
  if (pathUpdate) {
    process.env.PATH = envPath.join(path.delimiter)
  }
}
