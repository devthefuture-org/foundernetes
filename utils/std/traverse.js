module.exports = function traverse(
  value,
  callback,
  desc = false,
  parentObj = null,
  parentKey = null,
  scope = [],
  rootObj = value
) {
  if (typeof value !== "object" || value === null) {
    return callback(value, parentObj, parentKey, scope, rootObj)
  }
  for (const key of Object.keys(value)) {
    const childScope = [...scope, key]
    if (desc) {
      value[key] = callback(value[key], value, key, childScope, rootObj)
    }
    value[key] = traverse(
      value[key],
      callback,
      desc,
      value,
      key,
      childScope,
      rootObj
    )
    if (!desc) {
      value[key] = callback(value[key], value, key, childScope, rootObj)
    }
  }
  return value
}
