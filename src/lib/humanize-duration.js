const humanizeDuration = require("humanize-duration")

const shortEnglishHumanizer = humanizeDuration.humanizer({
  language: "shortEn",
  languages: {
    shortEn: {
      y: () => "y",
      mo: () => "mo",
      w: () => "w",
      d: () => "d",
      h: () => "h",
      m: () => "m",
      s: () => "s",
      ms: () => "ms",
    },
  },
})

module.exports = (ms, options = {}) =>
  shortEnglishHumanizer(ms, {
    maxDecimalPoints: 1,
    spacer: "",
    ...options,
  })
