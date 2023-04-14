const os = require("os")

const passwd = require("./passwd")

module.exports = async (search) => {
  if (search === undefined || search === null) {
    const userInfos = await os.userInfo()
    search = userInfos.username
  }
  const users = await passwd()
  return users.find(
    (user) => user.username === search || user.uid === search.toString()
  )
}
