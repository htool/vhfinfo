# Feature documents (Step 3)

Shadow copy of `data/{CC}.json` into Supabase table `public.vhf_features`.
**The website map (view and edit) reads this table.** GitHub GeoJSON is the
fallback if the table cannot be reached. Country outlines, 12 Nm polygons, and
bboxes still come from GitHub (`*_map.json`, `*_12Nm.json`, `countries_bbox.json`).

Project: `imgadhoivcpexrferorn` (`https://imgadhoivcpexrferorn.supabase.co`)

Initial load is done: **380** unique rows (public `SELECT` works; anonymous writes are blocked). Re-running the import is an upsert by id.

Publishing from the map **dual-writes**: git (`commit.vhfinfo.org`) and
`public.vhf_features`. The website map reads the table; git remains for the
plugin and as fallback until a later sync step.

## What gets imported

- Country files such as `data/NLD.json`
- Skipped: `*_map.json`, `*_12Nm.json`, `countries.json`, `countries_bbox.json`
- Duplicate feature ids in a file are collapsed (last copy wins)

## One-time load

1. Open the [SQL editor](https://supabase.com/dashboard/project/imgadhoivcpexrferorn/sql/new).
2. Paste and run `supabase/schema.sql`.
3. Import the rows (pick one):

**A. SQL editor (no service role key)**

```bash
node scripts/import-vhf-features.js --sql --out /tmp/vhf-seed.sql
```

Paste `/tmp/vhf-seed.sql` into the SQL editor and run it.

**B. REST upsert (service role, local only)**

```bash
SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-vhf-features.js
```

The service_role key is from **Project Settings → API**. Never put it in `website/`.

## Check

```bash
node scripts/import-vhf-features.js --dry-run
```

Then in SQL:

```sql
select count(*) from public.vhf_features;
select country, count(*) as features
from public.vhf_features
group by country
order by features desc, country;
```

Expect about **380** unique rows (384 features minus 4 duplicate ids).
Public `SELECT` with the anon key should work after the schema is applied.
