const loaderFactory = require("~/loader/factory")
const create = require("./create")

module.exports = (...args) => create(loaderFactory(...args))
