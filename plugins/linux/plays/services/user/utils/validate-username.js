const validateUsernameRegex = /^([a-z_][a-z0-9_-]{0,30})$/
module.exports = (username) => validateUsernameRegex.test(username)
