const { createComposer } = require("@foundernetes/blueprint")

module.exports = async ({ mod }) =>
  createComposer(async (vars) => {
    await mod.mount(vars)
    await mod.fstab(vars)
  })
