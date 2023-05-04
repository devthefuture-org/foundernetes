const { createComposer } = require("@foundernetes/blueprint")

module.exports = async ({ children }) =>
  createComposer(async (vars) => {
    const { enable, level } = vars
    await children.enable({ enable })
    await children.level({ level })
  })

Object.assign(module.exports, {
  enable: require("./enable"),
  level: require("./level"),
})
