const std = require("./std")

const toolkit = std.createToolkit(request)

module.exports = {
  ...std,
  ...toolkit,
  plugins: require("./plugins"),
}
