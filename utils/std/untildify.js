const os = require("os")

const re = /^~(?=$|\/|\\)/

module.exports = (pathWithTilde, homeDirectory = os.homedir()) => {
  return homeDirectory
    ? pathWithTilde.replace(re, homeDirectory)
    : pathWithTilde
}
