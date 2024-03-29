const path = require("path")
const fs = require("fs-extra")
const yaml = require("@foundernetes/std/yaml")
const deepmerge = require("@foundernetes/std/deepmerge")

const { createComposer } = require("@foundernetes/blueprint")

module.exports = async ({ children }) =>
  createComposer(
    async (vars = {}) => {
      const { instances: userInstances = {} } = vars
      const defaultInstancesYaml = await fs.readFile(
        path.join(__dirname, "instances.yaml"),
        { encoding: "utf-8" }
      )
      const defaultInstances = yaml.load(defaultInstancesYaml)
      const instances = deepmerge({}, defaultInstances, userInstances)

      await children.host({}, { tags: ["lxd"] })
      const { preseed } = vars
      await children.user({}, { tags: ["lxd"] })
      await children.init({ preseed }, { tags: ["lxd"] })
      await children.instances({ instances }, { tags: ["lxd"] })
    },
    { tags: ["lxd"] }
  )

Object.assign(module.exports, {
  init: require("./init"),
  host: require("./host"),
  user: require("./user"),
  instance: require("./instance"),
  instances: require("./instances"),
})
