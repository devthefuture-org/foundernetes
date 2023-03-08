const ctx = require("~/ctx")

module.exports = () => {
  ctx.replace("indentation", (indent = -1) => ++indent)
}
