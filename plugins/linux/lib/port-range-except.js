const castInt = require("@foundernetes/std/cast-int")

module.exports = (range = [], except = []) => {
  if (range === null) {
    range = []
  }
  if (typeof range === "string") {
    range = range.split(":")
  }
  let [min = 0, max = 65535] = range
  min = castInt(min, true)
  max = castInt(max, true)

  const rule = []
  let last = min
  for (let port of except) {
    port = castInt(port, true)
    if (port >= max) {
      break
    }
    rule.push([last, port - 1].join(":"))
    last = port + 1
  }
  rule.push([last, max].join(":"))

  return rule.join(",")
}
