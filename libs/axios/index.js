const axios = require("axios")
const axiosRetry = require("axios-retry")
const curlirize = require("./curlirize")

const client = axios.create({
  headers: { "User-Agent": `foundernetes` },
  family: 4,
})

axiosRetry(client, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
})

if (process.env.DEBUG_AXIOS) {
  curlirize(client)
}

client.curlirize = curlirize
client.axiosRetry = axiosRetry

module.exports = client
