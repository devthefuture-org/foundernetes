const { Writable } = require("node:stream")

class StreamCombiner extends Writable {
  constructor(...streams) {
    super()
    this.streams = streams
  }

  _write(data, _enc, cb) {
    const promises = []
    for (const stream of this.streams) {
      promises.push(
        new Promise((resolve) => {
          stream.write(data, resolve)
        })
      )
    }
    Promise.all(promises).then(() => cb())
  }
}

module.exports = (...args) => new StreamCombiner(...args)
