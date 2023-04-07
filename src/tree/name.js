const symbols = require("./symbols")

module.exports = (func) => {
  if (!func[symbols.scope]) {
    return
  }
  const scope = func[symbols.scope]
  return scope[scope.length - 1]
}
