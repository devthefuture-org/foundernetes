const composeReducer =
  (f, g) =>
  async (...args) => {
    const result = await g(...args)
    return f(...result)
  }
module.exports = (...fns) => fns.reduce(composeReducer)
