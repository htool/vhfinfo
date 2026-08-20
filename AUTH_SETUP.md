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

Google is currently off, so the map hides that button until you enable it.

1. In Google Cloud, create an OAuth client (Web application).
2. Add authorized redirect URI:
   `https://imgadhoivcpexrferorn.supabase.co/auth/v1/callback`
3. In Supabase: **Authentication → Providers → Google**. Turn it on and paste the Client ID and Client secret.

## 4. Check it

Open the map, tap the pencil, enter your email, tap **Email me a sign-in link**, and open the mail. After you follow the link, you should be able to edit and publish.

## 5. Feature table (shadow copy)

The public map still reads GitHub. Edit mode loads `public.vhf_features` so
editors see the database copy. Publishing dual-writes git + the table
(see `supabase/README.md`). The first load of existing git data is already
done (380 rows).
