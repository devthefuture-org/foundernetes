const factoryOfFactory = require("~/std/factory-of-factory")

module.exports = factoryOfFactory(
  (deps, factoryDefaults) => async (func) => func(deps, factoryDefaults),
  {
    composable: true,
  }
)
