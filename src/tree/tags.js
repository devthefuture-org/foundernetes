const symbols = require("~/tree/symbols")

module.exports = (func, prefix = "f10n") => {
  const tags = []
  if (func && func[symbols.scope]) {
    const scope = func[symbols.scope]
    tags.push([...(prefix ? [prefix] : []), ...scope].join(":"))
  }
  return tags
}
