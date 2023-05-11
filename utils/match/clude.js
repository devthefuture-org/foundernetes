const wildstring = require("wildstring")

module.exports = (term, { include = ["*"], exclude = [] } = {}) => {
  if (!Array.isArray(include)) {
    include = [include]
  }
  if (!Array.isArray(exclude)) {
    exclude = [exclude]
  }
  exclude = exclude.flatMap((m) => m).filter((m) => typeof m === "string")
  include = include.flatMap((m) => m).filter((m) => typeof m === "string")
  const included = include.some((m) => {
    if (typeof m === "function") {
      return m(term)
    }
    return wildstring.match(m, term)
  })
  if (!included) {
    return false
  }
  const excluded = exclude.some((m) => {
    if (typeof m === "function") {
      return m(term)
    }
    return wildstring.match(m, term)
  })
  if (excluded) {
    return false
  }
  return true
}
