const { createPlay } = require("@foundernetes/blueprint")
const ctx = require("@foundernetes/ctx")
const removeSuffix = require("@foundernetes/std/remove-suffix")

module.exports = async () => {
  const getRemoteFiles = async (dir) => {
    const ssh = ctx.require("ssh")
    const sftp = await ssh.requestSFTP()
    dir = removeSuffix(dir, "/")
    const list = await new Promise((resolve, reject) => {
      sftp.readdir(dir, (err, ls) => {
        if (err) {
          reject(err)
        } else {
          resolve(ls)
        }
      })
    })
    return list.map(({ filename }) => `${dir}/${filename}`)
  }

  const normalizeFile = (file) => {
    return removeSuffix(file, "/")
  }
  const isExpectedFile = (file, files) => {
    return files.map(normalizeFile).includes(normalizeFile(file))
  }

  return createPlay({
    async check({ files, dir }) {
      const remoteFiles = await getRemoteFiles(dir)
      return remoteFiles.every((remoteFile) =>
        isExpectedFile(remoteFile, files)
      )
    },
    async run({ dir, files }) {
      const remoteFiles = await getRemoteFiles(dir)
      const ssh = ctx.require("ssh")
      const deleteFiles = remoteFiles.filter(
        (remoteFile) => !isExpectedFile(remoteFile, files)
      )
      for (const deleteFile of deleteFiles) {
        const isDir = deleteFile.endsWith("/")
        ssh.execCommand(`rm ${isDir ? "-rf" : ""} ${deleteFile}`)
      }
    },
  })
}
