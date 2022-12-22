const factoryOfFactory = require("~/common/factory-of-factory")
const create = require("./create")

module.exports = factoryOfFactory(create)
