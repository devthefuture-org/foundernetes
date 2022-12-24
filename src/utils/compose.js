const composeReducer =
  (f, g) =>
  async (...args) => {
    const result = await g(...args)
    return f(...result)
  }
module.exports = (...fns) => {
  if (fns.length === 0) {
    fns.push((arg) => arg)
  }
  return fns.reduce(composeReducer)
}
