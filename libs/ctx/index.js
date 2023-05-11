const Context = require("nctx")

class FoundernetesContext extends Context {
  constructor() {
    super(Symbol("@foundernetes"))
  }

  setLogger(logger) {
    this.proxy.logger = logger
    return this
  }

  getLogger() {
    return this.proxyRequire.logger
  }

  setConfig(config) {
    this.proxy.config = config
    return this
  }

  getConfig() {
    return this.proxyRequire.config
  }
}

module.exports = new FoundernetesContext()
module.exports.FoundernetesContext = FoundernetesContext
