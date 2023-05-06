const Context = require("nctx")

class FoundernetesContext extends Context {
  constructor() {
    super(Symbol("@foundernetes"))
  }

  getLogger() {
    return this.proxyRequire.logger
  }

  getConfig() {
    return this.proxyRequire.logger
  }
}

module.exports = new FoundernetesContext()
module.exports.FoundernetesContext = FoundernetesContext
