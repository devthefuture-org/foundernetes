const symbols = require("./symbols")

module.exports = (o) => {
  const result = {}
  for (const symbol of Object.values(symbols)) {
    result[symbol] = o[symbol]
  }
  return result
}
