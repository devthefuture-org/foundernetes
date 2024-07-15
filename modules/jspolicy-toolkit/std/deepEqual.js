module.exports = function deepEqual(obj1, obj2) {
  if (obj1 === obj2) {
    return true
  }
  if (
    typeof obj1 !== "object" ||
    obj1 === null ||
    typeof obj2 !== "object" ||
    obj2 === null
  ) {
    return false
  }
  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)
  if (keys1.length !== keys2.length) {
    return false
  }
  for (const key of keys1) {
    if (!keys2.includes(key)) {
      return false // obj2 does not have a key that obj1 has
    }

    if (!deepEqual(obj1[key], obj2[key])) {
      return false // Recursive call to check the values
    }
  }
  return true
}
