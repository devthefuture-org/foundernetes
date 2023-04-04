const { Writable } = require("node:stream")

class StreamTransformer extends Writable {
  constructor(stream, transformer) {
    super()
    this.stream = stream
    this.transformer = transformer
  }

  _write(data, enc, cb) {
    data = this.transformer(data, enc)
    this.stream.write(Buffer.from(data), cb)
  }
}

module.exports = (...args) => new StreamTransformer(...args)
