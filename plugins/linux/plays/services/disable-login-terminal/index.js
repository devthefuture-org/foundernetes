const { createComposer } = require("@foundernetes/blueprint")

// see https://superuser.com/a/1480488

module.exports = async ({ children }) => {
  return createComposer(async () => {
    await children.logindConf()

    await children.disableTty1Service()

    await children.stopTty1()

    await children.consoleblank()
    await children.settermBlank()
  })
}

Object.assign(module.exports, {
  logindConf: require("./logind-conf"),
  disableTty1Service: require("./disable-tty1-service"),
  stopTty1: require("./stop-tty1"),
  settermBlank: require("./setterm-blank"),
  consoleblank: require("./consoleblank"),
})
