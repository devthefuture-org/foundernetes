const os = require("os")

const { Password } = require("enquirer")

module.exports = async (options = {}) => {
  const { username } = os.userInfo()

  const { prompt = `[sudo] password for ${username}: ` } = options

  const promptPassword = new Password({
    name: "password",
    message: prompt,
  })

  const password = await promptPassword.run()

  return password
}
