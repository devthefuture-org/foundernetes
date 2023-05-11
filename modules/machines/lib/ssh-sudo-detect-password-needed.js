module.exports = async (ssh) => {
  const { code } = await ssh.execCommand("sudo -n true")
  return code !== 0
}
