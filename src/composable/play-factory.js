const create = require("~/play/create")
const factoryOfFactory = require("~/std/factory-of-factory")

module.exports = factoryOfFactory(create, { composable: true })
