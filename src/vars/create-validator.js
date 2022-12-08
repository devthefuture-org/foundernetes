const Ajv = require("ajv")

module.exports = async (schema, options = {}) => {
  const ajv = new Ajv({
    verbose: true,
    allErrors: true,
    // logger: {
    //   log: console.log.bind(console),
    //   warn: function warn(...arguments) {
    //     console.warn(...arguments)
    //   },
    //   error: function error(...arguments) {
    //     console.error(...arguments)
    //   },
    // },
    ...options,
  })
  const validate = options.loadSchema
    ? await ajv.compileAsync(schema)
    : ajv.compile(schema)

  return validate
}
