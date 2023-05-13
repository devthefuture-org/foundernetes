module.exports = {
  // ...require("@foundernetes/linux/plays"),
  gohash: require("./gohash"),
  sync: require("./sync"),
  upload: require("./upload"),
  mkdir: require("./mkdir"),
  uploadDir: require("./upload-dir"),
  uploadFile: require("./upload-file"),
  fileMode: require("./file-mode"),
  fileUid: require("./file-uid"),
  fileGid: require("./file-gid"),
  deleteUnlisted: require("./delete-unlisted"),
  command: require("./command"),
  commandWithCheck: require("./command-with-check"),
  commandWithoutCheck: require("./command-without-check"),
}