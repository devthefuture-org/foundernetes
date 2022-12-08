const createValidator = require("./create-validator")

module.exports = async (schema, data, options = {}) => {
  const validate = await createValidator(schema, options)
  return validate(data)
}
