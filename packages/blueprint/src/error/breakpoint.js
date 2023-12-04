const FoundernetesError = require("./foundernetes")

module.exports = class FoundernetesBeakpointError extends FoundernetesError {
  constructor(breakpoint) {
    super(`🛑 breakpoint reached: ${breakpoint}`)
    this.breakpoint = breakpoint
  }
}
