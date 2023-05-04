module.exports = (arr) => {
  if (!Array.isArray(arr)) {
    return arr
  }
  return async (...args) => {
    for (const item of arr) {
      const result = await item(...args)
      if (result === false) {
        return false
      }
    }
  }
}
