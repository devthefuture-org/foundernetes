const ctx = require("@foundernetes/ctx")

module.exports = (error, logger = ctx.getLogger()) => {
  const url = error.request?.res?.responseUrl
  if (error.response) {
    logger.error(
      {
        status: error.response.status,
        statusText: error.response.statusText,
        url,
      },
      "request error"
    )
    if (error.response.data.msg) {
      logger.error({ errorMessage: error.response.data.msg }, "request error")
    }
  } else {
    logger.error({ errorMessage: error.message, url }, "request error")
  }
}
