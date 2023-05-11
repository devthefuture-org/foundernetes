const cloneDeep = require("lodash/cloneDeep")

const { createLoader } = require("@foundernetes/blueprint")

const { render } = require("@foundernetes/eta")
const traverseAsync = require("@foundernetes/std/traverse-async")
const deepUnflattenCamelcase = require("@foundernetes/std/deep-unflatten-camelcase")

module.exports = (config = {}) =>
  createLoader({
    load: async (options = {}) => {
      let { data } = options
      const {
        defaultVars = config.defaultVars || {},
        vars = config.vars || {},
        selfRef = config.selfRef !== undefined ? config.selfRef : false,
      } = options

      const { unflatCamelcase = false } = options
      if (unflatCamelcase) {
        data = deepUnflattenCamelcase(data)
      }

      for (const item of Object.values(data)) {
        const itemTemplateVars = cloneDeep(defaultVars)
        if (selfRef) {
          Object.assign(itemTemplateVars, cloneDeep(item))
        }
        Object.assign(itemTemplateVars, vars)
        await traverseAsync(item, async (value) =>
          typeof value !== "string" ? value : render(value, itemTemplateVars)
        )
      }

      return data
    },
  })
