module.exports = (func) => {
  const composeableFunc = async (...args) => func(...args)
  Object.assign(composeableFunc, func)
  composeableFunc.composable = true
  return composeableFunc
}
