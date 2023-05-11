const os = require("os")
const matchClude = require("@foundernetes/match/clude")

module.exports =
  ({ include = ["*"], exclude = [] } = {}) =>
  () => {
    const hostname = os.hostname()
    return matchClude(hostname, { include, exclude })
  }
