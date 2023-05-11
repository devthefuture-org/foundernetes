const ctx = require("@foundernetes/ctx")
const { createComposer } = require("@foundernetes/blueprint")
const envcase = require("@foundernetes/std/envcase")

module.exports = async ({ plays, mod }) =>
  createComposer(async (vars = {}) => {
    const { ipWhiteList = [], portsentryConfig = {} } = vars

    const iterator = ctx.require("iterator")

    // see https://forum-debian.fr/wiki/Portsentry
    const configMap = {
      /* blockMode
        0 = Only logging, then use fail2ban
        1 = Block network ports
        2 = Run external command (KILL_RUN_CMD)
      */
      BLOCK_TCP: "0",
      BLOCK_UDP: "0",
      /* tcpMode
        (tcp/udp) basic: This is the mode portsentry uses by default. Selected UDP and TCP ports in this mode are bound by portsentry, giving the monitored ports the appearance of offering a service to the network.
        (stcp/sudp) stealth: In this mode, *portsentry listens to the ports at the socket level instead of binding the ports. This mode can detect a variety of scan techniques (strobe-style, SYN, FIN, NULL, XMAS and UDP scans), but because it is more sensitive than basic mode, it is likely to produce more false alarms.
        (atcp/audp) advanced stealth: This mode offers the same detection method as the regular stealth mode, but instead of monitoring only the selected ports, it monitors all ports below a selected number (port number 1023, by default). You can then exclude monitoring of particular ports. This mode is even more sensitive than Stealth mode and is, therefore, more likely to cause false alarms than regular stealth mode.
      */
      TCP_MODE: "atcp",
      UDP_MODE: "sudp",
      // if you are really anal:
      // TCP_PORTS:
      //   "1,7,9,11,15,70,79,80,109,110,111,119,138,139,143,512,513,514,515,540,635,1080,1524,2000,2001,4000,4001,5742,6000,6001,6667,12345,12346,20034,27665,30303,32771,32772,32773,32774,31337,40421,40425,49724,54320",
      // UDP_PORTS:
      //   "1,7,9,66,67,68,69,111,137,138,161,162,474,513,517,518,635,640,641,666,700,2049,31335,27444,34555,32770,32771,32772,32773,32774,31337,54321",
      // if you just want to be aware:
      TCP_PORTS:
        "1,11,15,79,111,119,143,540,635,1080,1524,2000,5742,6667,12345,12346,20034,27665,31337,32771,32772,32773,32774,40421,49724,54320",
      UDP_PORTS:
        "1,7,9,69,161,162,513,635,640,641,700,37444,34555,31335,32770,32771,32772,32773,32774,31337,54321",
      // for just bare-bones
      // TCP_PORTS:
      //   "1,11,15,110,111,143,540,635,1080,1524,2000,12345,12346,20034,32771,32772,32773,32774,49724,54320",
      // UDP_PORTS:
      //   "1,7,9,69,161,162,513,640,700,32770,32771,32772,32773,32774,31337,54321",
      ADVANCED_PORTS_TCP: "1024",
      ADVANCED_PORTS_UDP: "1024",
      ADVANCED_EXCLUDE_TCP: "113,139", // Default TCP ident and NetBIOS service
      ADVANCED_EXCLUDE_UDP: "520,138,137,67", // Default UDP route (RIP), NetBIOS, bootp broadcasts.
      RESOLVE_HOST: "0",
      SCAN_TRIGGER: "0",
      HISTORY_FILE: "/var/lib/portsentry/portsentry.history",
      ...Object.entries(portsentryConfig).reduce((acc, [key, val]) => {
        acc[envcase(key)] = val
        return acc
      }, {}),
    }

    const portsentryConfigFile = "/etc/portsentry/portsentry.conf"

    await plays.std.configFile(
      {
        configMap,
        separator: "=",
        quote: '"',
        commentFound: true,
        commentStartChar: "#",
        file: portsentryConfigFile,
        sudoWrite: true,
      },
      { tags: ["portsentry", "portsentry:config"] }
    )

    const blockedFile = "/var/lib/portsentry/portsentry.blocked"
    const blockedFiles = [
      blockedFile,
      ...["tcp", "udp", "atcp", "audp", "stcp", "sudp"].map(
        (mode) => `${blockedFile}.${mode}`
      ),
    ]
    await iterator.eachSeries(blockedFiles, async (link) => {
      return plays.std.ensureSymlink({
        link,
        target: "/dev/null",
        sudoWrite: true,
      })
    })

    await plays.std.ensureFile({
      file: "/etc/portsentry/portsentry.ignore.static",
      content: ["127.0.0.1/32", "0.0.0.0", ...ipWhiteList].join("\n"),
      trailingNewline: true,
      sudoWrite: true,
    })

    await mod.serviceReloadOnFileChange({
      file: portsentryConfigFile,
      serviceName: "portsentry",
      restart: true,
    })
    await mod.activeService({
      name: "portsentry",
    })
  })
