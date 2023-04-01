module.exports = async (conditions = [], runContext = {}) => {
  for (const condition of conditions) {
    if (condition === false) {
      return false
    }
    if (!(await condition(runContext))) {
      return false
    }
  }

  return true
}
