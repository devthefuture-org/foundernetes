const upperCase = require("lodash/upperCase")

module.exports = (str) => upperCase(str).replaceAll(" ", "_")
