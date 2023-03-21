const castArray = (mixed, options = {}) => {
  if (Array.isArray(mixed)) {
    const { recursive = false } = options
    if (recursive) {
      for (let i = 0; i < mixed.length; i++) {
        mixed.splice(i, 1, ...castArray(mixed[i], options))
      }
    }
    return mixed
  }
  if (mixed === undefined || mixed === null || mixed === "") {
    return []
  }
  if (typeof mixed === "string") {
    const { json = true } = options
    if (json && mixed.startsWith("[")) {
      return JSON.parse(mixed)
    }
    let { separator = "," } = options
    if (separator) {
      if (Array.isArray(separator)) {
        separator = separator.find((sep) => mixed.includes(sep))
      }
      if (separator) {
        return mixed.split(separator)
      }
    }
  }
  return [mixed]
}
module.exports = castArray
