const re = /^~(?=$|\/|\\)/

module.exports = (pathWithTilde) => {
  return re.test(pathWithTilde)
}
