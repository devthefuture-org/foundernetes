module.exports = (line) => {
  return line
    .split(" ")
    .map((word) => word.trim())
    .join(" ")
}
