const { createLoader } = require("@foundernetes/blueprint")
const dayjs = require("dayjs")
const { $ } = require("@foundernetes/blueprint")

module.exports = ({ loaders }) =>
  createLoader({
    load: async (vars) => {
      const { name } = vars

      const stateTimestamp = await loaders.services.serviceInfos({
        name,
        field: "StateChangeTimestamp",
      })
      const [, day, time, tz] = stateTimestamp.split(" ")
      const dateFromSystemCtl = new Date(`${day} ${time} (${tz})`)

      const { stdout: journalstdout } = await $(
        `journalctl -u ${name} --no-pager -o short-iso -xe`,
        {
          sudo: true,
          logStdout: false,
        }
      )
      const lastRestartLine = journalstdout
        .split("\n")
        .reverse()
        .find((line) => line.includes("Starting") || line.includes("Reloaded"))
      let dateFromJournalCtl
      if (lastRestartLine) {
        const [lastRestartIsoTime] = lastRestartLine.split(" ")
        dateFromJournalCtl = dayjs(lastRestartIsoTime).toDate()
      }

      const date =
        dateFromJournalCtl && dateFromJournalCtl > dateFromSystemCtl
          ? dateFromJournalCtl
          : dateFromSystemCtl

      return date
    },
  })
