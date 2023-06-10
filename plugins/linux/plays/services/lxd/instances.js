const ctx = require("@foundernetes/ctx")
const deepmerge = require("@foundernetes/std/deepmerge")
const { createComposer } = require("@foundernetes/blueprint")

module.exports = async ({ mod }) => {
  return createComposer(async (vars) => {
    const iterator = ctx.require("iterator")
    const { instances } = vars

    let index = 0
    await iterator.eachOfSeries(instances.nodes, async (instance, name) => {
      index++

      const instanceVars = deepmerge({}, instances.default, {
        name,
        index,
        ...instance,
      })

      return mod.instance(instanceVars)
    })
  })
}
