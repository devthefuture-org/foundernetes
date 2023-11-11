const axios = require("axios")
const axiosRetry = require("axios-retry")
const curlirize = require("./curlirize")

const client = axios.create({
  headers: { "User-Agent": `foundernetes` },
})

axiosRetry(client, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
})

if (process.env.DEBUG_AXIOS) {
  curlirize(client)
}

module.exports = client
