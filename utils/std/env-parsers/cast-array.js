const castArray = require("../cast-array")

module.exports = (str) => castArray(str, { recursive: true })
