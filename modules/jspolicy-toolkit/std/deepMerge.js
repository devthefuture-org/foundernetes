const mergeWith = require("lodash/mergeWith")

module.exports = function deepMerge(objValue, ...srcValues) {
  return mergeWith(objValue, ...srcValues, (oValue, srcValue) => {
    if (Array.isArray(oValue)) {
      return srcValue
    }
  })
}
