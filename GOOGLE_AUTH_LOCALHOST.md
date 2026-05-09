# Google Sign-In on Localhost

## Why it breaks

The "Continue with Google" button routes through `@lovable.dev/cloud-auth-js`, which
proxies OAuth via Lovable's hosted servers. Those servers only trust the deployed
Lovable URL as a redirect target. When the callback lands back on
`http://localhost:8080` Lovable's proxy has no registered redirect for it, so you
get a 404 or an OAuth error.

The fix is to bypass the Lovable proxy entirely on localhost and talk directly to
Supabase's own Google OAuth flow, which you can configure yourself.

---

## Step 1 — Add localhost to your Google OAuth client

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and open the
   project that owns the OAuth client ID used by Supabase.
2. Navigate to **APIs & Services → Credentials** and open your **OAuth 2.0 Client ID**.
3. Under **Authorized JavaScript origins** add:
   ```
   http://localhost:8080
   ```
4. Under **Authorized redirect URIs** add:
   ```
   https://dfkwwkorouzyyqpiqvfe.supabase.co/auth/v1/callback
   ```
   (This is the Supabase callback — it is shared between all environments so it may
   already be there. Do not add a localhost redirect URI here.)
5. Click **Save**.

---

## Step 2 — Add localhost to Supabase's allowed redirect URLs

1. Open the [Supabase dashboard](https://supabase.com/dashboard) and select the
   project **dfkwwkorouzyyqpiqvfe**.
2. Go to **Authentication → URL Configuration**.
3. In the **Redirect URLs** list add:
   ```
   http://localhost:8080/**
   ```
4. Make sure **Site URL** is set to your production URL (leave it pointing at the
   Lovable deploy, not localhost).
5. Click **Save**.

---

## Step 3 — Swap the OAuth call on localhost

The `Auth.tsx` button currently calls `lovable.auth.signInWithOAuth(...)`, which
goes through the Lovable proxy. Replace it with a direct Supabase call when running
locally.

In `src/pages/Auth.tsx` change the Google button's `onClick` to:

```tsx
onClick={async () => {
  setAuthHint(null);
  setBusy(true);

  // On localhost use Supabase OAuth directly (Lovable proxy only
  // works on the hosted domain).
  const isLocal = window.location.hostname === "localhost";

  if (isLocal) {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) {
      toast.error(error.message ?? "Google sign-in failed");
      setBusy(false);
    }
    // Supabase redirects the browser; no further action needed.
    return;
  }

  // Hosted Lovable environment — use the proxy as before.
  const result = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
  });
  if (result.error) {
    toast.error(result.error.message ?? "Google sign-in failed");
    setBusy(false);
    return;
  }
  if (result.redirected) return;
  setBusy(false);
}}
```

---

## Step 4 — Handle the OAuth callback route

After Google redirects back to `http://localhost:8080/`, Supabase appends a URL
fragment like `#access_token=...`. Your existing `AuthProvider` in
`src/hooks/useAuth.tsx` already calls `supabase.auth.onAuthStateChange`, which
picks up that fragment automatically — **no extra callback route is needed**.

Just make sure the root path `/` is not blocked before the session is resolved.
Your `ProtectedRoute` already shows a loading state, so this is fine.

---

## Step 5 — Verify Google provider is enabled in Supabase

1. In the Supabase dashboard go to **Authentication → Providers**.
2. Find **Google** and confirm it is enabled.
3. The **Client ID** and **Client Secret** should already be filled in (they were
   configured when the app was set up in Lovable). If they are blank you will need
   to copy them from your Google Cloud OAuth client.

---

## Quick checklist

| | What to check |
|---|---|
| Google Cloud | `http://localhost:8080` in **Authorized JavaScript origins** |
| Google Cloud | `https://dfkwwkorouzyyqpiqvfe.supabase.co/auth/v1/callback` in **Authorized redirect URIs** |
| Supabase Auth | `http://localhost:8080/**` in **Redirect URLs** |
| Supabase Auth | Google provider enabled with Client ID + Secret |
| `Auth.tsx` | `isLocal` branch uses `supabase.auth.signInWithOAuth` directly |

Once all five boxes are ticked, `npm run dev` (or `vite`) on port 8080 will complete
the Google flow without a 404.
