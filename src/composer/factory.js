const factoryOfFactory = require("~/std/factory-of-factory")
const create = require("./create")

module.exports = factoryOfFactory(create)
