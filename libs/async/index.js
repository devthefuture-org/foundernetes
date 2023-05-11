const async = require("async")

// see https://github.com/caolan/async/issues/1631
const wrap = (coll) => {
  if (Array.isArray(coll)) {
    return coll.map((val, idx) => [val, idx])
  }
  return Object.entries(coll).map((arr) => arr.reverse())
}
const unwrap = (iteratee, coll) => {
  if (Array.isArray(coll)) {
    return async ([val, idx], cb) => iteratee(val, idx, cb)
  }
  return async ([val, idx], cb) => iteratee(val, idx, cb)
}

async.mapOf = (coll, iteratee, callback) =>
  async.map(wrap(coll), unwrap(iteratee, coll), callback)

async.mapOfSeries = (coll, iteratee, callback) =>
  async.mapSeries(wrap(coll), unwrap(iteratee, coll), callback)

async.mapOfLimit = (coll, limit, iteratee, callback) =>
  async.mapLimit(wrap(coll), limit, unwrap(iteratee, coll), callback)

async.filterOf = (coll, iteratee, callback) =>
  async.filter(wrap(coll), unwrap(iteratee, coll), callback)

async.filterOfSeries = (coll, iteratee, callback) =>
  async.filterSeries(wrap(coll), unwrap(iteratee, coll), callback)

async.filterOfLimit = (coll, limit, iteratee, callback) =>
  async.filterLimit(wrap(coll), limit, unwrap(iteratee, coll), callback)

async.detectOf = (coll, iteratee, callback) =>
  async.detect(wrap(coll), unwrap(iteratee, coll), callback)

async.detectOfSeries = (coll, iteratee, callback) =>
  async.detectSeries(wrap(coll), unwrap(iteratee, coll), callback)

async.detectOfLimit = (coll, limit, iteratee, callback) =>
  async.detectLimit(wrap(coll), limit, unwrap(iteratee, coll), callback)

module.exports = async
