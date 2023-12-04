const wildstring = require("wildstring")
const ctx = require("@foundernetes/ctx")
const FoundernetesBeakpointError = require("~/error/breakpoint")

module.exports = (breakpoint) => {
  const config = ctx.getConfig()
  if (wildstring.match(config.breakpoint, breakpoint)) {
    throw new FoundernetesBeakpointError(breakpoint)
  }
}
