const async = require("async")

// see https://github.com/caolan/async/issues/1631

const wrap = (coll) => coll.map((val, idx) => [val, idx])
const unwrap =
  (iteratee) =>
  async ([val, idx], cb) =>
    iteratee(val, idx, cb)

async.mapOf = (coll, iteratee, callback) =>
  async.map(wrap(coll), unwrap(iteratee), callback)

async.mapOfSeries = (coll, iteratee, callback) =>
  async.mapSeries(wrap(coll), unwrap(iteratee), callback)

async.mapOfLimit = (coll, limit, iteratee, callback) =>
  async.mapLimit(wrap(coll), limit, unwrap(iteratee), callback)

async.filterOf = (coll, iteratee, callback) =>
  async.filter(wrap(coll), unwrap(iteratee), callback)

async.filterOfSeries = (coll, iteratee, callback) =>
  async.filterSeries(wrap(coll), unwrap(iteratee), callback)

async.filterOfLimit = (coll, limit, iteratee, callback) =>
  async.filterLimit(wrap(coll), limit, unwrap(iteratee), callback)

module.exports = async
