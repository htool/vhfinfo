#!/usr/bin/env node
/**
 * Decide whether to patch-bump and npm publish vhfinfo.
 *
 * Publishes at most once per UTC day when plugin GeoJSON
 * (data/{CC}.json, *_12Nm.json, countries_bbox.json) or plugin/ changed
 * since the last npm release.
 *
 * Usage:
 *   node scripts/npm-geojson-publish-check.js
 *   node scripts/npm-geojson-publish-check.js --github-output
 *   node scripts/npm-geojson-publish-check.js --force
 */

const fs = require("fs")
const path = require("path")
const { spawnSync } = require("child_process")

const ROOT = path.resolve(__dirname, "..")
const SKIP_FILES = new Set(["countries.json"])
const TRACKED_PATHS = ["data", "plugin"]

function parseArgs(argv) {
  const args = { githubOutput: false, force: false }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === "--github-output") args.githubOutput = true
    else if (a === "--force") args.force = true
    else {
      console.error("Unknown argument: " + a)
      process.exit(2)
    }
  }
  if (isTruthy(process.env.FORCE_PUBLISH)) args.force = true
  return args
}

function isTruthy(value) {
  if (value == null) return false
  const s = String(value).trim().toLowerCase()
  return s === "true" || s === "1" || s === "yes"
}

function utcDateString(d) {
  return new Date(d).toISOString().slice(0, 10)
}

function isPublishableGeoJson(relPath) {
  if (!relPath || !relPath.startsWith("data/")) return false
  if (!relPath.endsWith(".json")) return false
  if (relPath.indexOf("/") !== relPath.lastIndexOf("/")) return false
  const base = path.posix.basename(relPath.replace(/\\/g, "/"))
  if (SKIP_FILES.has(base)) return false
  if (base.endsWith("_map.json")) return false
  return true
}

function isPublishablePlugin(relPath) {
  if (!relPath) return false
  const norm = relPath.replace(/\\/g, "/")
  return norm === "plugin" || norm.startsWith("plugin/")
}

function isPublishablePath(relPath) {
  return isPublishableGeoJson(relPath) || isPublishablePlugin(relPath)
}

function parseVersion(v) {
  const m = String(v || "").trim().match(/^(\d+)\.(\d+)\.(\d+)/)
  if (!m) return null
  return [Number(m[1]), Number(m[2]), Number(m[3])]
}

function compareVersions(a, b) {
  const pa = parseVersion(a)
  const pb = parseVersion(b)
  if (!pa || !pb) throw new Error("Invalid version: " + a + " / " + b)
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i]
  }
  return 0
}

function bumpPatch(v) {
  const p = parseVersion(v)
  if (!p) throw new Error("Invalid version: " + v)
  return p[0] + "." + p[1] + "." + (p[2] + 1)
}

function nextPublishVersion(localVersion, npmVersion) {
  const base =
    !npmVersion || compareVersions(localVersion, npmVersion) >= 0
      ? localVersion
      : npmVersion
  return bumpPatch(base)
}

function alreadyPublishedToday(lastPublishTime, now) {
  if (!lastPublishTime) return false
  return utcDateString(lastPublishTime) === utcDateString(now)
}

function changeReason(geojson, plugin) {
  if (geojson.length && plugin.length) {
    return "GeoJSON and plugin updated since last publish"
  }
  if (plugin.length) return "plugin updated since last publish"
  return "GeoJSON updated since last publish"
}

function shouldPublish(opts) {
  const force = !!opts.force
  const now = opts.now || new Date()
  const lastPublishTime = opts.lastPublishTime
  const changedFiles = opts.changedFiles || []
  const geojson = unique(changedFiles.filter(isPublishableGeoJson))
  const plugin = unique(changedFiles.filter(isPublishablePlugin))
  const files = unique(geojson.concat(plugin))

  if (force) {
    return {
      publish: true,
      reason: "forced",
      files: files,
    }
  }
  if (alreadyPublishedToday(lastPublishTime, now)) {
    return {
      publish: false,
      reason: "already published today",
      files: files,
    }
  }
  if (files.length === 0) {
    return {
      publish: false,
      reason: "no GeoJSON or plugin updates since last publish",
      files: [],
    }
  }
  return {
    publish: true,
    reason: changeReason(geojson, plugin),
    files: files,
  }
}

function unique(list) {
  const seen = Object.create(null)
  const out = []
  for (let i = 0; i < list.length; i++) {
    const item = list[i]
    if (!item || seen[item]) continue
    seen[item] = true
    out.push(item)
  }
  return out
}

function runGit(args, cwd) {
  const r = spawnSync("git", args, { cwd: cwd, encoding: "utf8" })
  if (r.status !== 0) {
    const err = (r.stderr || r.stdout || "").trim()
    throw new Error("git " + args.join(" ") + " failed: " + err)
  }
  return (r.stdout || "").trim()
}

function gitChangedFilesSince(iso, cwd) {
  const repo = cwd || ROOT
  const base = runGit(["rev-list", "-n", "1", "--before=" + iso, "HEAD"], repo)
  if (!base) {
    return runGit(["ls-files", "--"].concat(TRACKED_PATHS), repo)
      .split("\n")
      .map(function (s) {
        return s.trim()
      })
      .filter(Boolean)
  }
  const diff = runGit(
    ["diff", "--name-only", base, "HEAD", "--"].concat(TRACKED_PATHS),
    repo
  )
  if (!diff) return []
  return diff.split("\n").map(function (s) {
    return s.trim()
  }).filter(Boolean)
}

function readLocalVersion(cwd) {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(cwd || ROOT, "package.json"), "utf8")
  )
  return pkg.version
}

function readNpmRelease(pkgName, runner) {
  const run = runner || defaultNpmView
  const raw = run(pkgName)
  const info = typeof raw === "string" ? JSON.parse(raw) : raw
  const version = info.version
  const time =
    (info.time && info.time[version]) ||
    (info.time && info.time.modified) ||
    ""
  return { version: version, time: time }
}

function defaultNpmView(pkgName) {
  const r = spawnSync("npm", ["view", pkgName, "--json"], {
    encoding: "utf8",
  })
  if (r.status !== 0) {
    const err = (r.stderr || r.stdout || "").trim()
    throw new Error("npm view " + pkgName + " failed: " + err)
  }
  return r.stdout
}

function writeGithubOutput(decision) {
  const lines = [
    "should_publish=" + decision.publish,
    "reason=" + decision.reason,
    "next_version=" + (decision.nextVersion || ""),
  ]
  const body = lines.join("\n") + "\n"
  const out = process.env.GITHUB_OUTPUT
  if (out) fs.appendFileSync(out, body)
  process.stdout.write(body)
}

function decide(opts) {
  const cwd = opts.cwd || ROOT
  const now = opts.now || new Date()
  const localVersion = opts.localVersion || readLocalVersion(cwd)
  const npmRelease =
    opts.npmRelease ||
    readNpmRelease(opts.packageName || "vhfinfo", opts.npmView)
  const lastPublishTime = npmRelease.time
  const changedFiles =
    opts.changedFiles ||
    (lastPublishTime ? gitChangedFilesSince(lastPublishTime, cwd) : [])
  const decision = shouldPublish({
    force: opts.force,
    now: now,
    lastPublishTime: lastPublishTime,
    changedFiles: changedFiles,
  })
  decision.localVersion = localVersion
  decision.npmVersion = npmRelease.version
  decision.lastPublishTime = lastPublishTime || ""
  decision.nextVersion = nextPublishVersion(localVersion, npmRelease.version)
  return decision
}

function main() {
  const args = parseArgs(process.argv)
  const decision = decide({ force: args.force })
  if (args.githubOutput) writeGithubOutput(decision)
  console.log(JSON.stringify(decision, null, 2))
}

module.exports = {
  isPublishableGeoJson: isPublishableGeoJson,
  isPublishablePlugin: isPublishablePlugin,
  isPublishablePath: isPublishablePath,
  alreadyPublishedToday: alreadyPublishedToday,
  shouldPublish: shouldPublish,
  nextPublishVersion: nextPublishVersion,
  compareVersions: compareVersions,
  bumpPatch: bumpPatch,
  utcDateString: utcDateString,
  gitChangedFilesSince: gitChangedFilesSince,
  decide: decide,
  parseArgs: parseArgs,
}

if (require.main === module) {
  try {
    main()
  } catch (err) {
    console.error(err.stack || err.message || err)
    process.exit(1)
  }
}
