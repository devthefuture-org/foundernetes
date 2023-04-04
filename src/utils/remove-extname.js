const path = require("path")
const removeSuffix = require("~/utils/remove-suffix")

module.exports = (filePath) => removeSuffix(filePath, path.extname(filePath))
