const pipeReducer =
  (f, g) =>
  async (...args) => {
    let result = await g(...args)
    if (result === undefined) {
      result = args
    }
    return f(...result)
  }
module.exports = (...fns) => {
  if (fns.length === 0) {
    fns.push((arg) => arg)
  }
  return fns.reduce(pipeReducer)
}
