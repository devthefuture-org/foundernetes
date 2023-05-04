/* eslint-disable no-shadow */
// inspired by https://github.com/rook2pawn/node-filecompare

const { open } = require("node:fs/promises")
const assert = require("assert")

const fileBufferObject = async (path, bufferSize) => {
  const fd = await open(path, "r")
  const b = Buffer.alloc(bufferSize)
  const { size } = await fd.stat(path)
  return { fd, b, pos: 0, size }
}

// beautiful construct from https://lowrey.me/while-loop-with-es6-promises/
const promiseWhile = (data, condition, action) => {
  const whilst = (d) =>
    condition(d) ? action(d).then(whilst) : Promise.resolve(d)
  return whilst(data)
}

const doCompare = async (f1, f2, cb, step, bufferSize) => {
  assert(step <= bufferSize)
  if (f1.size !== f2.size) {
    await Promise.all([f1.fd?.close(), f2.fd?.close()])
    return cb(false)
  }
  let isDone = false

  const condition = function (data) {
    const { f1, f2 } = data
    const isEqual = f1.b.equals(f2.b)
    const isEnd = f1.pos === f1.size || f2.pos === f2.size
    if (isEqual && isEnd) {
      isDone = true
      return false
    }
    return f1.b.equals(f2.b)
  }

  const action = function (data) {
    const { f1, f2 } = data
    const p1 = f1.fd.read(f1.b, 0, step, f1.pos)
    const p2 = f2.fd.read(f2.b, 0, step, f2.pos)
    const p3 = Promise.all([p1, p2]).then((obj) => {
      f1.pos += obj[0].bytesRead
      f2.pos += obj[1].bytesRead
      return { f1: data.f1, f2: data.f2 }
    })
    return p3
  }

  const p1 = f1.fd.read(f1.b, 0, step, f1.pos)
  const p2 = f2.fd.read(f2.b, 0, step, f2.pos)
  const obj = await Promise.all([p1, p2])
  f1.pos += obj[0].bytesRead
  f2.pos += obj[1].bytesRead
  if (f1.pos === f1.size || f2.pos === f2.size) {
    if (!f1.b.equals(f2.b)) {
      return cb(false)
    }
  }
  const data = { f1, f2 }
  try {
    const res = await promiseWhile(data, condition, action).then(
      async (_obj) => {
        await Promise.all([f1.fd?.close(), f2.fd?.close()])
        return cb(isDone)
      }
    )
    return res
  } catch (err) {
    await Promise.all([f1.fd?.close(), f2.fd?.close()])
    return cb(false)
  }
}

module.exports = async (path1, path2, step, bufferSize) => {
  step = step || 8192
  bufferSize = bufferSize || 8192
  const [f1, f2] = await Promise.all([
    fileBufferObject(path1, bufferSize),
    fileBufferObject(path2, bufferSize),
  ])
  return new Promise(async (resolve, reject) => {
    try {
      await doCompare(f1, f2, resolve, step, bufferSize)
    } catch (err) {
      reject(err)
    }
  })
}
