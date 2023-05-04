const setWith = require("lodash.setwith")
const traverse = require("./traverse")

module.exports = (obj, keyModifier) =>
  traverse(obj, (o) => {
    if (typeof o !== "object" || o === null || Array.isArray(o)) {
      return o
    }
    for (const [k, val] of Object.entries(o)) {
      delete o[k]
      let key = k
      if (keyModifier) {
        key = keyModifier(key)
      }
      setWith(o, key, val, Object)
    }
    return o
  })
