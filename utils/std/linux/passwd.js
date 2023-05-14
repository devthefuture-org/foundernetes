const fs = require("fs-extra")

module.exports = async () => {
  const passwd = await fs.readFile("/etc/passwd", { encoding: "utf-8" })
  const users = passwd
    .split("\n")
    .filter((user) => user.length > 0 && user[0] !== "#")
    .map((user) => {
      const fields = user.split(":")
      return {
        username: fields[0],
        password: fields[1],
        uid: fields[2],
        gid: fields[3],
        fullname: fields[4],
        homedir: fields[5],
        shell: fields[6],
      }
    })
  return users
}
