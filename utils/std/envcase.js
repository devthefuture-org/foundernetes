const uppercase = require("lodash.uppercase")

module.exports = (str) => uppercase(str).replaceAll(" ", "_")
