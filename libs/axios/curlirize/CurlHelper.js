module.exports = class CurlHelper {
  constructor(config) {
    this.request = config
  }

  getHeaders() {
    let { headers } = this.request
    let curlHeaders = ""

    // get the headers concerning the appropriate method (defined in the global axios instance)
    if (Object.prototype.hasOwnProperty.call(headers, "common")) {
      headers = this.request.headers[this.request.method]
    }

    // add any custom headers (defined upon calling methods like .get(), .post(), etc.)
    for (const property in this.request.headers) {
      if (
        !["common", "delete", "get", "head", "patch", "post", "put"].includes(
          property
        )
      ) {
        headers[property] = this.request.headers[property]
      }
    }

    for (const property in headers) {
      if ({}.hasOwnProperty.call(headers, property)) {
        const header = `${property}:${headers[property]}`
        curlHeaders = `${curlHeaders} -H '${header}'`
      }
    }

    return curlHeaders.trim()
  }

  getMethod() {
    return `-X ${this.request.method.toUpperCase()}`
  }

  getBody() {
    if (
      typeof this.request.data !== "undefined" &&
      this.request.data !== "" &&
      this.request.data !== null &&
      this.request.method.toUpperCase() !== "GET"
    ) {
      const data =
        typeof this.request.data === "object" ||
        Object.prototype.toString.call(this.request.data) === "[object Array]"
          ? JSON.stringify(this.request.data)
          : this.request.data
      return `--data '${data}'`.trim()
    }
    return ""
  }

  getUrl() {
    if (this.request.baseURL) {
      const baseUrl = this.request.baseURL
      const { url } = this.request
      const finalUrl = `${baseUrl}/${url}`
      return finalUrl
        .replace(/\/{2,}/g, "/")
        .replace("http:/", "http://")
        .replace("https:/", "https://")
    }
    return this.request.url
  }

  getQueryString() {
    if (this.request.paramsSerializer) {
      const params = this.request.paramsSerializer(this.request.params)
      if (!params || params.length === 0) return ""
      if (params.startsWith("?")) return params
      return `?${params}`
    }
    let params = ""
    let i = 0

    for (const param in this.request.params) {
      if ({}.hasOwnProperty.call(this.request.params, param)) {
        const value = this.request.params[param]
        if (value === undefined) {
          continue
        }
        params += i !== 0 ? `&${param}=${value}` : `?${param}=${value}`
        i++
      }
    }

    return params
  }

  getBuiltURL() {
    let url = this.getUrl()

    if (this.getQueryString() !== "") {
      url += this.getQueryString()
    }

    return url.trim()
  }

  generateCommand() {
    return `curl ${this.getMethod()} "${this.getBuiltURL()}" ${this.getHeaders()} ${this.getBody()}`
      .trim()
      .replace(/\s{2,}/g, " ")
  }
}
