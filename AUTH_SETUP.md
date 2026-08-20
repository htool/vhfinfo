# Sign-in setup (site owner)

Viewers do not need an account. People who change the map must sign in with
**email (a link, no password)** or **Google**.

## 1. Create a free Supabase project

1. Open [https://supabase.com/dashboard](https://supabase.com/dashboard) and sign in.
2. **New project**. Any name is fine (for example `vhfinfo`). Pick a region close to your users. Wait until it is ready.
3. Open **Project Settings → API**.
4. Copy **Project URL** and the **anon public** key into `website/supabase-config.js`.

## 2. Tell Supabase which pages may sign people in

1. Open **Authentication → URL Configuration**.
2. Set **Site URL** to `https://vhfinfo.org`.
3. Under **Redirect URLs**, add:
   - `https://vhfinfo.org/map.html`
   - `https://vhfinfo.org/**`
   - `http://localhost:8080/map.html` (for trying it on your computer)

## 3. Email sign-in (the link in their inbox)

1. Open **Authentication → Providers → Email**.
2. Leave it enabled. You do **not** need passwords.
3. Optional: in **Authentication → Emails**, the “Magic Link” template is what people receive.

## 4. Google sign-in (optional, but nicer)

1. In Google Cloud, create an OAuth client (Web application).
2. Add authorized redirect URI:
   `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
   (Supabase shows this URI on the Google provider screen.)
3. In Supabase: **Authentication → Providers → Google**. Turn it on and paste the Client ID and Client secret.

Until Google is turned on, the map still offers the email link. If someone taps Google too early, they see a short “use the email link instead” message.

## 5. Check it

Open the map, tap the pencil, enter your email, tap **Email me a sign-in link**, and open the mail. After you follow the link, you should be able to edit and publish.
