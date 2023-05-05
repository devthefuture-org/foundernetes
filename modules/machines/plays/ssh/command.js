const { createComposer } = require("@foundernetes/blueprint")

module.exports = async ({ mod }) => {
  return createComposer(async (vars) => {
    if (vars.check) {
      return mod.commandWithCheck(vars)
    }
    return mod.commandWithoutCheck(vars)
  })
}
