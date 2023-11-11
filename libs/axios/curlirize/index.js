const CurlHelper = require("./CurlHelper")

function defaultLogCallback(curlResult, err) {
  const { command } = curlResult
  if (err) {
    process.stderr.write(`${err.toString()}\n`)
  } else {
    process.stderr.write(`${command}\n`)
  }
}

module.exports = (instance, callback = defaultLogCallback) => {
  instance.interceptors.request.use((req) => {
    try {
      const curl = new CurlHelper(req)
      req.curlObject = curl
      req.curlCommand = curl.generateCommand()
      req.clearCurl = () => {
        delete req.curlObject
        delete req.curlCommand
        delete req.clearCurl
      }
    } catch (err) {
      // Even if the axios middleware is stopped, no error should occur outside.
      callback(null, err)
    } finally {
      if (req.curlirize !== false) {
        callback({
          command: req.curlCommand,
          object: req.curlObject,
        })
      }
      // eslint-disable-next-line no-unsafe-finally
      return req
    }
  })
}
