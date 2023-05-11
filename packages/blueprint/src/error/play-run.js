const FoundernetesError = require("./foundernetes")

module.exports = class FoundernetesPlayRunError extends FoundernetesError {
  constructor(msg = "FoundernetesPlayRunError", data = {}) {
    super(msg)
    this.data = data
  }

  output() {
    return [
      this.toString(),
      {
        ...(this.data || {}),
      },
    ]
  }
}
