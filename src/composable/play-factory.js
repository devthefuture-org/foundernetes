const playFactory = require("~/play/factory")
const create = require("./create")

module.exports = (...args) => create(playFactory(...args))
