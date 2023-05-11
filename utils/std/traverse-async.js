module.exports = async function traverse(
  value,
  callback,
  desc = false,
  parentObj = null,
  parentKey = null,
  scope = [],
  rootObj = value,
  isRoot = true
) {
  if (typeof value !== "object" || value === null) {
    return callback(value, parentObj, parentKey, scope, rootObj)
  }
  if (isRoot && desc) {
    value = await callback(value, parentObj, parentKey, scope, rootObj)
    rootObj = value
  }
  for (const key of Object.keys(value)) {
    const childScope = [...scope, key]
    if (desc) {
      value[key] = await callback(value[key], value, key, childScope, rootObj)
    }
    value[key] = await traverse(
      value[key],
      callback,
      desc,
      value,
      key,
      childScope,
      rootObj,
      false
    )
    if (!desc) {
      value[key] = await callback(value[key], value, key, childScope, rootObj)
    }
  }
  if (isRoot && !desc) {
    value = await callback(value, parentObj, parentKey, scope, rootObj)
    rootObj = value
  }
  return value
}
