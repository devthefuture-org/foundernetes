const ctx = require("@foundernetes/ctx")
const { createComposer } = require("@foundernetes/blueprint")

module.exports = async ({ plays }) =>
  createComposer(async (vars = {}) => {
    const { dns = ["1.1.1.1", "1.0.0.1", "8.8.8.8", "8.8.4.4"] } = vars
    const iterator = ctx.require("iterator")
    await iterator.eachSeries([...dns].reverse(), async (dnsIp) => {
      return plays.std.lineInFile({
        file: "/etc/resolv.conf",
        line: `nameserver ${dnsIp}`,
        create: true,
        addLineOnTop: true,
        sudoWrite: true,
      })
    })
  })
