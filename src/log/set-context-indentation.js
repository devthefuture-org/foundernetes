const ctx = require("~/ctx")

const incr = (i = 1) => {
  ctx.replace("indentation", (indent = -1) => indent + i)
}
const decr = () => incr(-1)

module.exports = {
  incr,
  decr,
}
