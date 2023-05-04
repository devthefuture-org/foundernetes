module.exports = class FoundernetesError extends Error {
  constructor(msg = "FoundernetesError") {
    super(msg)
  }

  getErrorLoggerParams() {
    let output
    if (typeof this.output === "function") {
      output = this.output()
    } else {
      output = this.toString()
    }
    if (!Array.isArray(output)) {
      output = [output]
    }
    return output
  }
}
