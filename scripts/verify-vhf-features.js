#!/usr/bin/env node
/**
 * Count public.vhf_features using the public anon key (read-only).
 */

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const src = fs.readFileSync(path.join(ROOT, 'lib', 'supabase-config.js'), 'utf8')
const url = (src.match(/url:\s*"([^"]+)"/) || [])[1]
const anonKey = (src.match(/anonKey:\s*"([^"]+)"/) || [])[1]

async function main() {
  const res = await fetch(url.replace(/\/$/, '') + '/rest/v1/vhf_features?select=country', {
    headers: {
      apikey: anonKey,
      Authorization: 'Bearer ' + anonKey,
      Prefer: 'count=exact',
    },
  })
  const text = await res.text()
  if (!res.ok) {
    console.error('HTTP ' + res.status)
    console.error(text)
    process.exit(1)
  }
  const rows = JSON.parse(text)
  const byCountry = {}
  for (const row of rows) {
    byCountry[row.country] = (byCountry[row.country] || 0) + 1
  }
  const range = res.headers.get('content-range') || ''
  console.log(
    JSON.stringify(
      {
        total: rows.length,
        contentRange: range,
        byCountry,
      },
      null,
      2
    )
  )
}

main().catch((err) => {
  console.error(err.stack || err.message || err)
  process.exit(1)
})
