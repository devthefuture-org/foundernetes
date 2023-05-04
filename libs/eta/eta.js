const eta = require("eta")

const config = {
  tags: ["${{", "}}"],
  parse: {
    exec: "#",
    interpolate: "",
    raw: "~",
  },
  autoEscape: false,
  autoTrim: false,
  varName: "$",
  useWith: true,
  async: true,
}

const render = (str, data, overrideConfig = {}) =>
  eta.render(str, data, { ...config, ...overrideConfig })

const compile = (str, data, overrideConfig = {}) =>
  eta.compile(str, data, {
    ...config,
    ...overrideConfig,
  })

module.exports = {
  config,
  render,
  compile,
}
