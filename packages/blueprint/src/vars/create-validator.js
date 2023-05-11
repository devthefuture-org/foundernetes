// https://ajv.js.org/json-schema.html#draft-2020-12
// https://json-schema.org/understanding-json-schema/structuring.html
const Ajv2020 = require("ajv/dist/2020")

module.exports = async (schema, options = {}) => {
  const ajv = new Ajv2020({
    verbose: true,
    allErrors: true,
    useDefaults: true,
    coerceTypes: true,
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

  ajv.addKeyword({
    keyword: "validator",
    compile: (schm, parentSchema) =>
      function validate(data) {
        if (typeof schm === "function") {
          const valid = schm(data)
          if (!valid) {
            validate.errors = [
              {
                keyword: "validate",
                message: `: ${data} should pass custom validation`,
                params: { keyword: "validate" },
              },
            ]
          }
          return valid
        }

        if (
          typeof schm === "object" &&
          Array.isArray(schm) &&
          schm.every((f) => typeof f === "function")
        ) {
          const [f, errorMessage] = schm
          const valid = f(data)
          if (!valid) {
            validate.errors = [
              {
                keyword: "validate",
                message: `: ${errorMessage(schm, parentSchema, data)}`,
                params: { keyword: "validate" },
              },
            ]
          }
          return valid
        }

        throw new Error("Invalid definition for custom validator")
      },
    errors: true,
  })

  const validate = options.loadSchema
    ? await ajv.compileAsync(schema)
    : ajv.compile(schema)

  return validate
}
