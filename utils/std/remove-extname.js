const path = require("path")
const removeSuffix = require("@foundernetes/std/remove-suffix")

module.exports = (filePath) => removeSuffix(filePath, path.extname(filePath))
