module.exports = (mixed, throwErrorOnNaN = false) => {
  if (typeof mixed === "string") {
    const tmp = parseInt(mixed, 10)
    if (throwErrorOnNaN && Number.isNaN(tmp)) {
      throw Error(`isNaN ${mixed}`)
    }
    mixed = tmp
  }
  return mixed
}
