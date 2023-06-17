const ctx = require("@foundernetes/ctx")
const { createComposer } = require("@foundernetes/blueprint")

module.exports = async ({ children }) =>
  createComposer(async (vars = {}) => {
    const { disks } = vars
    const iterator = ctx.require("iterator")
    await iterator.eachSeries(disks, (disk) => children.disk(disk), "disk")
  })

Object.assign(module.exports, {
  disk: require("./disk"),
  mount: require("./mount"),
  fstab: require("./fstab"),
})
