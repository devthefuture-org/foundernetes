const mergeWith = require("lodash/mergeWith")

module.exports = (objValue, ...srcValues) =>
  mergeWith(objValue, ...srcValues, (oValue, srcValue) => {
    if (Array.isArray(oValue)) {
      return srcValue
    }
  })
