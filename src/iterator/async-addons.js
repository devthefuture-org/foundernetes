const async = require("async")

// see https://github.com/caolan/async/issues/1631

async.mapOf = (coll, iteratee, callback) =>
  async.map(
    coll.map((val, idx) => [val, idx]),
    ([val, idx], cb) => iteratee(val, idx, cb),
    callback
  )

async.mapOfSeries = (coll, iteratee, callback) =>
  async.mapSeries(
    coll.map((val, idx) => [val, idx]),
    ([val, idx], cb) => iteratee(val, idx, cb),
    callback
  )

async.mapOfLimit = (coll, limit, iteratee, callback) =>
  async.mapLimit(
    coll.map((val, idx) => [val, idx]),
    limit,
    ([val, idx], cb) => iteratee(val, idx, cb),
    callback
  )

async.filterOf = (coll, iteratee, callback) =>
  async.filter(
    coll.map((val, idx) => [val, idx]),
    ([val, idx], cb) => iteratee(val, idx, cb),
    callback
  )

async.filterOfSeries = (coll, iteratee, callback) =>
  async.filterSeries(
    coll.map((val, idx) => [val, idx]),
    ([val, idx], cb) => iteratee(val, idx, cb),
    callback
  )

async.filterOfLimit = (coll, limit, iteratee, callback) =>
  async.filterLimit(
    coll.map((val, idx) => [val, idx]),
    limit,
    ([val, idx], cb) => iteratee(val, idx, cb),
    callback
  )

module.exports = async
