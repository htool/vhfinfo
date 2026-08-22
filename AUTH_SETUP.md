# Sign-in setup (site owner)

Viewers do not need an account. People who change the map must sign in with
**email (a link, no password)** or **Google**.

Supabase organisation: `bwrgvqczyqfjvcmfhbsn`  
Project: `imgadhoivcpexrferorn` (`https://imgadhoivcpexrferorn.supabase.co`)  
Dashboard: [https://supabase.com/dashboard/org/bwrgvqczyqfjvcmfhbsn](https://supabase.com/dashboard/org/bwrgvqczyqfjvcmfhbsn)

The website is already pointed at this project in `website/supabase-config.js` (anon public key only).

## 1. Confirm redirect URLs

Sign-in talks to this project. People return to the map after they tap the email link, so these URLs must be allowed:

1. Open **Authentication → URL Configuration**.
2. Set **Site URL** to `https://vhfinfo.org`.
3. Under **Redirect URLs**, add:
   - `https://vhfinfo.org/map.html`
   - `https://vhfinfo.org/**`
   - `http://localhost:8080/map.html` (for trying it on your computer)

## 2. Email sign-in (the link in their inbox)

1. Open **Authentication → Providers → Email**.
2. Leave it enabled. You do **not** need passwords.
3. Optional: in **Authentication → Emails**, the “Magic Link” template is what people receive.

The built-in mailer on the free plan only allows a few emails per hour for the
whole project. If sending a link fails with a rate-limit message, wait a bit or
use a tab that is already signed in. For more mail later, add your own sender
under **Project Settings → Authentication → SMTP**.

## 3. Google sign-in (optional, but nicer)

The edit login always shows **Continue with Google**. Until this provider is
on, that button explains that Google is not enabled and the email link still
works.

1. In Google Cloud, create an OAuth client (Web application).
2. Add authorized redirect URI:
   `https://imgadhoivcpexrferorn.supabase.co/auth/v1/callback`
3. In Supabase: **Authentication → Providers → Google**. Turn it on and paste the Client ID and Client secret. The Client secret stays in the dashboard — never commit it.
4. Confirm **Redirect URLs** still include `https://vhfinfo.org/map.html` and `http://localhost:8080/map.html` (same list as email).

## 4. Check it

Open the map, tap the pencil, enter your email, tap **Email me a sign-in link**, and open the mail. After you follow the link, you should be able to edit and publish.

## 5. Feature table (shadow copy)

The website map loads `public.vhf_features` (view and edit). GitHub is the
fallback. Publishing writes the table; `scripts/sync-vhf-to-git.js` plus the
`Sync VHF features from database` GitHub Action keep `data/{CC}.json` in
sync for the plugin. You can turn off `commit.vhfinfo.org` after this is on
`main`.
