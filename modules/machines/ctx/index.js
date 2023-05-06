const ctx = require("@foundernetes/ctx")

const { FoundernetesContext } = ctx

class FoundernetesMachinesContext extends FoundernetesContext {
  constructor() {
    super(Symbol("@foundernetes/machines"))
    this.follow(ctx)
    this.fallback(ctx)
  }

  getSSH() {
    return this.proxyRequire.ssh
  }

  getIterator() {
    return this.proxyRequire.iterator
  }
}

module.exports = new FoundernetesMachinesContext()
module.exports.FoundernetesMachinesContext = FoundernetesMachinesContext
