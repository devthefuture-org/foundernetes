const wildstring = require("wildstring")

module.exports = (actual, expected, options = {}) => {
  const { defaultKey = "equal" } = options
  if (typeof expected !== "object" || Array.isArray(expected)) {
    expected = { [defaultKey]: expected }
  }
  if (expected.equal !== undefined && actual === expected.equal) {
    return true
  }
  if (expected.contain && actual.includes(expected.contain)) {
    return true
  }
  if (expected.regex && new RegExp(expected.regex).match(actual)) {
    return true
  }
  let { match } = expected
  if (match) {
    if (!Array.isArray(match)) {
      match = [match]
    }
    if (match.some((m) => wildstring.match(m, actual))) {
      return true
    }
  }
  return false
}
