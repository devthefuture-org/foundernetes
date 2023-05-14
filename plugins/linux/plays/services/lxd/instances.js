const path = require("path")
const fs = require("fs-extra")

const ctx = require("@foundernetes/ctx")
const yaml = require("@foundernetes/std/yaml")
const deepmerge = require("@foundernetes/std/deepmerge")
const { createComposer } = require("@foundernetes/blueprint")

module.exports = async ({ mod }) => {
  return createComposer(async (vars) => {
    const iterator = ctx.require("iterator")
    const { instances: userInstances = {} } = vars
    const defaultInstancesYaml = await fs.readFile(
      path.join(__dirname, "instances.yaml"),
      { encoding: "utf-8" }
    )
    const defaultInstances = yaml.load(defaultInstancesYaml)

    const instances = deepmerge({}, defaultInstances, userInstances)

    await iterator.eachOfSeries(instances.nodes, async (instance, name) => {
      return mod.instance(
        deepmerge({}, instances.default, {
          name,
          ...instance,
        })
      )
    })
  })
}
