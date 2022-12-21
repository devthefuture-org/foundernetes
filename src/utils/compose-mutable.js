const composeReducer =
  (f, g) =>
  async (...args) => {
    let result = await g(...args)
    if (result === undefined) {
      result = args
    }
    return f(...result)
  }
module.exports = (...fns) => fns.reduce(composeReducer)
