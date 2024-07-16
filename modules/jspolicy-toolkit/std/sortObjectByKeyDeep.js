module.exports = function sortObjectByKeyDeep(obj) {
  const sortedObj = {}
  const keys = Object.keys(obj).sort()

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const value = obj[key]

    if (typeof value === "object" && !Array.isArray(value)) {
      sortedObj[key] = sortObjectByKeyDeep(value)
    } else if (Array.isArray(value)) {
      sortedObj[key] = value.map((item) =>
        typeof item === "object" ? sortObjectByKeyDeep(item) : item
      )
    } else {
      sortedObj[key] = value
    }
  }

  return sortedObj
}
