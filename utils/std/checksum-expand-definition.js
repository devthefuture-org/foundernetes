const checksumType = require("./checksum-type")

module.exports = (checksum) => {
  if (typeof checksum === "string") {
    checksum = { hash: checksum }
  }
  if (checksum?.hash && !checksum.algo) {
    checksum.algo = checksumType(checksum.hash)
  }
  return checksum
}
