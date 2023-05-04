/* eslint-disable no-bitwise */
module.exports = (value) => {
  if (Number.isNaN(value)) {
    return false
  }
  const x = parseFloat(value)
  return (x | 0) === x
}
