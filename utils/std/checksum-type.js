module.exports = (hash) => {
  switch (hash.length) {
    case 128:
      return "sha512"
    case 64:
      return "sha256"
    case 40:
      return "sha1"
    case 32:
      return "md5"
    default:
      throw new Error(`unable to determine checksum algorithm for ${hash}`)
  }
}
