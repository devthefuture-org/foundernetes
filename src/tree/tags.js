const symbols = require("~/tree/symbols")

module.exports = (func, prefix = "f8s") => {
  const tags = []
  if (func && func[symbols.scope]) {
    const scope = func[symbols.scope]
    const tag = [...(prefix ? [prefix] : []), ...scope].join(":")
    tags.push(tag)
  }
  return tags
}
