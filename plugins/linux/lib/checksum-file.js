const fs = require("fs")
const crypto = require("crypto")

// https://nodejs.org/api/crypto.html#cryptocreatehashalgorithm-options
const recommendedChecksumAlgos = ["md5", "sha1", "sha256", "sha512"]

module.exports = (algo, file) =>
  new Promise((resolve, reject) => {
    let hash
    try {
      hash = crypto.createHash(algo)
    } catch (e) {
      reject(
        new Error(
          `unknown digest algo "${algo}", try one of the recommended ${recommendedChecksumAlgos.join(
            ", "
          )}, original error: ${e}`
        )
      )
    }
    fs.createReadStream(file)
      .on("error", reject)
      .on("end", () => {
        hash.end()
        resolve(hash.digest("hex"))
      })
      .pipe(hash)
  })
