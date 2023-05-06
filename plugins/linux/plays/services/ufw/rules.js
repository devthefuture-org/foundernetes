const isEqual = require("lodash/isEqual")
const defaults = require("lodash/defaults")
const cloneDeep = require("lodash/cloneDeep")
const snakeCase = require("lodash/snakeCase")
const ctx = require("@foundernetes/ctx")
const { createPlay, $ } = require("@foundernetes/blueprint")

const traverse = require("@foundernetes/std/traverse")
const objectSortKeys = require("@foundernetes/std/object-sort-keys")

module.exports = async ({ loaders }) => {
  const normalizeRule = (rule) => {
    rule = cloneDeep(rule)
    rule = traverse(rule, (o) => {
      if (typeof o !== "object" || o === null || Array.isArray(o)) {
        return o
      }
      for (const [k, val] of Object.entries(o)) {
        delete o[k]
        o[snakeCase(k)] = val
      }
      return o
    })
    rule = defaults(rule, {
      action: "allow",
      action_direction: "in",
      network_protocol: "ipv4",
      to_interface: null,
      to_transport: null,
      to_service: null,
      to_port_ranges: null,
      to_ip: "0.0.0.0",
      to_ip_prefix: "0",
      comment: null,
      from_ip: null,
      from_ip_prefix: "0",
      from_interface: "any",
      from_transport: null,
      from_port_ranges: null,
      from_service: null,
      index: null,
    })
    rule = traverse(rule, (val) => {
      if (val !== undefined && val !== null && typeof val !== "object") {
        val = val.toString()
        val = val.toLowerCase()
      }
      return val
    })
    if (
      rule.from_port_ranges?.length === 1 &&
      rule.from_port_ranges[0].start === "0"
    ) {
      rule.from_port_ranges = null
    }
    if (
      rule.to_port_ranges?.length === 1 &&
      rule.to_port_ranges[0].start === "0"
    ) {
      rule.to_port_ranges = null
    }
    if (rule.index) {
      rule.index = null
    }
    if (rule.from_service) {
      rule.from_ports = null
      rule.from_port_ranges = null
    }
    if (rule.from_transport === "any") {
      rule.from_transport = null
    }
    if (rule.to_transport === "any") {
      rule.to_transport = null
    }
    if (rule.from_ip === "0.0.0.0" && rule.from_ip_prefix === "0") {
      rule.from_ip = null
    }

    if (rule.from_interface === "any") {
      rule.from_interface = null
    }

    if (rule.to_interface === "any") {
      rule.to_interface = null
    }

    return rule
  }
  const normalizeRules = (rules) => {
    rules = rules.map(normalizeRule)
    let newRules = []
    for (const rule of rules) {
      const {
        action_direction: actionDirection,
        from_transport: fromTransport,
        to_transport: toTransport,
        from_ports: fromPorts,
        to_ports: toPorts,
        to_port_ranges: toPortRanges,
        from_port_ranges: fromPortRanges,
        // from_interface: fromInterface,
      } = rule

      // const routed = actionDirection === "fwd"
      const incoming = actionDirection === "in"

      const proto = incoming ? toTransport : fromTransport
      if (
        !proto &&
        (fromPortRanges ||
          toPortRanges ||
          fromPorts?.length > 1 ||
          toPorts?.length > 1)
      ) {
        newRules.push({
          ...rule,
          from_transport: incoming ? null : "tcp",
          to_transport: incoming ? "tcp" : null,
        })
        newRules.push({
          ...rule,
          from_transport: incoming ? null : "udp",
          to_transport: incoming ? "udp" : null,
        })
      } else {
        newRules.push(rule)
      }
    }
    newRules = newRules.map((rule) => objectSortKeys(rule))
    return newRules
  }

  return createPlay({
    async check(vars) {
      const logger = ctx.getLogger()

      let { rules } = vars
      rules = normalizeRules(rules)

      let { rules: actualRules } = await loaders.services.ufw({ cache: true })
      actualRules = normalizeRules(actualRules)

      // console.dir({ actualRules }, { depth: Infinity })
      // console.dir({ rules }, { depth: Infinity })

      const { removeUnlistedRules = false } = vars
      if (removeUnlistedRules) {
        for (const actualRule of actualRules) {
          if (!rules.some((rule) => isEqual(actualRule, rule))) {
            logger.debug("an unexpected rule was found", { rule: actualRule })
            return false
          }
        }
      }

      let lastFoundIndex = 0
      for (const rule of rules) {
        let found = false
        let actualIndex = lastFoundIndex
        for (const actualRule of actualRules.slice(lastFoundIndex)) {
          if (isEqual(rule, actualRule)) {
            if (actualIndex < lastFoundIndex) {
              logger.debug("rule is missing or is not ordered as expected", {
                rule,
              })
              return false
            }
            found = true
            lastFoundIndex = actualIndex
            break
          }
          actualIndex++
        }
        if (!found) {
          logger.debug("rule is missing or is not ordered as expected", {
            rule,
          })
          return false
        }
      }

      return true
    },
    async run(vars) {
      let { rules } = vars
      rules = normalizeRules(rules)

      let { rules: actualRules } = await loaders.services.ufw({ cache: true })
      actualRules = normalizeRules(actualRules)

      const { removeUnlistedRules = false } = vars
      if (removeUnlistedRules) {
        for (let i = actualRules.length; i > 0; i--) {
          await $(`ufw --force delete ${i}`, { sudo: true })
        }
        actualRules = []
        // let actualIndex = 0
        // let ruleIndex = 0
        // for (const actualRule of [...actualRules]) {
        //   if (isEqual(actualRule, rules[ruleIndex])) {
        //     actualIndex++
        //     ruleIndex++
        //     continue
        //   }
        //   actualIndex++
        //   ruleIndex++
        //   await $(`ufw --force delete ${actualIndex + 1}`, { sudo: true })
        //   actualRules.splice(actualIndex, 1)
        //   actualIndex--
        // }
      }

      let lastFoundIndex = 0
      for (const rule of rules) {
        let found = false
        let actualIndex = lastFoundIndex
        for (const actualRule of actualRules.slice(lastFoundIndex)) {
          if (isEqual(rule, actualRule)) {
            found = true
            lastFoundIndex = actualIndex
            break
          }
          actualIndex++
        }
        if (found) {
          continue
        }

        // a rule is missing

        const {
          action,
          action_direction: actionDirection,
          // network_protocol: networkProtocol,
          to_interface: toInterface,
          to_transport: toTransport,
          to_ip: toIp,
          to_ip_prefix: toIpPrefix,
          to_ports: toPorts,
          to_port_ranges: toPortRanges,
          to_service: toService,
          comment,
          from_ip: fromIp,
          from_ip_prefix: fromIpPrefix,
          from_interface: fromInterface,
          from_transport: fromTransport,
          from_ports: fromPorts,
          from_port_ranges: fromPortRanges,
          from_service: fromService,
        } = rule

        const incoming =
          actionDirection === "in" ||
          (actionDirection === "fwd" && fromInterface !== "any")

        const interface = incoming ? fromInterface : toInterface

        const fromPort = fromPorts
          ? `port ${fromPorts.join(",")}`
          : fromPortRanges
          ? `${
              fromPortRanges
                ? `port ${fromPortRanges
                    .map(({ start, end }) =>
                      [start === "0" ? "1" : start, end].join(":")
                    )
                    .join(",")}`
                : ""
            }`
          : ""

        const toPort = toPorts
          ? `port ${toPorts.join(",")}`
          : toPortRanges
          ? `${
              toPortRanges
                ? `port ${toPortRanges
                    .map(({ start, end }) =>
                      [start === "0" ? "1" : start, end].join(":")
                    )
                    .join(",")}`
                : ""
            }`
          : ""

        const proto = incoming ? toTransport : fromTransport
        const service = incoming ? toService : fromService

        const { stdout } = await $(
          `ufw ${actionDirection === "fwd" ? "route" : ""} ${
            lastFoundIndex > 0 && lastFoundIndex + 2 < actualRules.length
              ? `insert ${lastFoundIndex + 2}`
              : ""
          } ${action} ${incoming ? "in" : "out"} ${
            interface && !service ? `on ${interface}` : ""
          } ${proto && !service ? `proto ${proto}` : ""} ${
            fromIp ? `from ${fromIp}` : ""
          }${fromIp && fromIpPrefix ? `/${fromIpPrefix}` : ""} ${fromPort} ${
            toIp ? `to ${toIp}` : ""
          }${toIp && toIpPrefix ? `/${toIpPrefix}` : ""} ${toPort} ${
            service ? `app ${service}` : ""
          } ${comment ? `comment "${comment.replaceAll('"', '\\"')}"` : ""}`,
          { sudo: true }
        )

        if (stdout.includes("Skipping")) {
          // Skipping adding existing rule, should not be necessary, but safer
          continue
        }

        lastFoundIndex++
      }

      loaders.services.ufw.clearCache()
    },
  })
}

// allow|deny|reject|limit [in|out [on INTERFACE]] [log|log-all] [proto PROTOCOL] [from ADDRESS [port PORT | app APPNAME ]] [to ADDRESS [port PORT | app APPNAME ]] [comment COMMENT]
