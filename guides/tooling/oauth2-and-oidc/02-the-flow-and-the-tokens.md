---
title: "The Authorization Code Flow and the Three Tokens"
guide: oauth2-and-oidc
phase: 2
summary: "The standard behind 'Log in with Google': OAuth2 grants delegated access, OIDC adds identity on top, and the authorization-code-with-PKCE flow ties it together."
tags: [oauth, oidc, auth, tokens, security, identity]
difficulty: intermediate
synonyms: ["log in with google", "oauth2 flow", "openid connect", "authorization code flow", "pkce", "access token vs refresh token", "id token", "social login", "delegated access"]
updated: 2026-06-30
---

# The Authorization Code Flow and the Three Tokens

You know the four roles. Now watch them actually move. OAuth2 defines several "grant types" (ways to get a token), but in 2026 there is essentially one you should use for apps where a user is present: **Authorization Code flow with PKCE**. Older flows like the *implicit grant* exist in the spec but are deprecated for being leaky - skip them. Learn this one well and you've learned the flow that powers virtually every "Log in with…" button you'll build.

## The flow, step by step

Here is the dance. A user wants to log into your app ("the Client") using their Google account ("the Authorization Server"). Follow the redirects.

```text
1. User clicks "Log in with Google"
2. Client → browser redirect → Authorization Server:
     GET /authorize?response_type=code
                    &client_id=abc123
                    &redirect_uri=https://yourapp.com/callback
                    &scope=openid email profile
                    &state=xyz789
                    &code_challenge=BASE64URL(SHA256(verifier))
                    &code_challenge_method=S256
3. User authenticates at Google + approves the consent screen
4. Authorization Server → browser redirect → Client:
     GET https://yourapp.com/callback?code=AUTH_CODE&state=xyz789
5. Client (back end) → Authorization Server, direct POST:
     POST /token
       grant_type=authorization_code
       code=AUTH_CODE
       redirect_uri=https://yourapp.com/callback
       client_id=abc123
       code_verifier=ORIGINAL_RANDOM_STRING
6. Authorization Server returns tokens (JSON):
     { "access_token": "...", "id_token": "...", "refresh_token": "...", "expires_in": 3600 }
```

*What just happened:* The browser only ever carries a short-lived **authorization code** (steps 2–4), never the real tokens. The actual tokens come back over a direct server-to-server POST (step 5) that the browser never sees. That two-step shuffle - code in the front channel, tokens in the back channel - is the entire security design.

Why bother with the intermediate code at all? Because the redirect in step 4 travels through the user's browser, where it can land in logs, history, or a malicious extension. A code is useless on its own - exchanging it requires the second request. So even if someone steals the code, they're missing a piece.

## PKCE: the piece that stops code theft

That missing piece is **PKCE** (Proof Key for Code Exchange, pronounced "pixy"). It closes the hole where an attacker intercepts the authorization code and tries to redeem it themselves.

It works with a one-time secret the client invents at the start:

```text
At step 2 (start):
  code_verifier  = a random high-entropy string the client generates and keeps
  code_challenge = BASE64URL( SHA256(code_verifier) )   ← sent in the /authorize request

At step 5 (token exchange):
  client sends the original code_verifier
  Authorization Server checks:  SHA256(code_verifier) == the code_challenge it stored?
```

*What just happened:* The client commits to a secret up front by sending only its *hash* (the challenge). To redeem the code later, it must reveal the original (the verifier). An attacker who stole the code from the browser never saw the verifier, can't reverse the SHA-256 hash, and so can't complete the exchange. The stolen code is dead in their hands.

PKCE started life as protection for mobile and single-page apps that can't keep a client secret, but current guidance is to use it for **every** authorization-code flow, server-side ones included. Treat it as mandatory.

> **What about `state`?** Different job. `code_challenge`/PKCE stops *code interception*. The `state` parameter (a random value you send and check came back unchanged) stops **CSRF** - an attacker tricking your app into completing *their* login. Send both, always. They guard against different attacks.

## Scopes: asking for exactly what you need

In step 2 you saw `scope=openid email profile`. **Scopes** are the specific permissions the client requests. The Authorization Server shows them on the consent screen and bakes the granted ones into the access token.

```text
scope=openid               → "I want an ID token" (the OIDC opt-in)
scope=email                → access to the user's email address
scope=profile              → access to basic profile (name, picture)
scope=https://www.googleapis.com/auth/calendar.readonly
                           → read-only access to their calendar
```

*What just happened:* Each scope is one slice of permission. The golden rule is **least privilege**: ask only for what your feature actually needs. Requesting `calendar` (read-write) when you only display events trains users to rubber-stamp scary permissions and widens your blast radius if a token leaks. Note the literal scope `openid` - that single word is what turns a plain OAuth2 request into an OIDC request and makes the server return an ID token.

## The three tokens - the part everyone confuses

Step 6 returned three different tokens. They look identical (often base64-ish blobs) but have completely different jobs. Mixing them up is the single most common OAuth mistake.

| Token | Answers | Who reads it | Lifetime |
|-------|---------|--------------|----------|
| **Access token** | "What may this client do?" | The **Resource Server** (the API) | Short (minutes to an hour) |
| **ID token** | "Who is the user?" | The **Client** (your app) | Short, single-use at login |
| **Refresh token** | "Get me a new access token" | The **Authorization Server** only | Long (days to months) |

**Access token** - your proof to the *API*. You attach it to API calls and the Resource Server checks it:

```text
GET /v1/photos HTTP/1.1
Host: photos.googleapis.com
Authorization: Bearer <access_token>
```

*What just happened:* The API trusts the bearer token and returns the data. Critically, the access token is **opaque to the client** - your app should not crack it open to learn who the user is. It is addressed to the API, not to you. Using it for login is the classic mistake from Phase 1.

**ID token** - this is the OIDC addition and the thing that actually logs the user in. It is always a **JWT** (a signed JSON Web Token) with claims about the user:

```text
{
  "iss": "https://accounts.google.com",   ← issuer: who minted this
  "aud": "abc123",                         ← audience: YOUR client_id
  "sub": "10769150350006150715",           ← subject: stable unique user id
  "email": "ada@example.com",
  "name": "Ada Lovelace",
  "iat": 1709400000,                       ← issued-at
  "exp": 1709403600                         ← expiry
}
```

*What just happened:* Your app reads these claims to know who logged in. The `sub` ("subject") is the stable user identifier - use that as your primary key, never the email, because emails change. But you must **verify the signature and check the claims** before trusting any of it: confirm `iss` is the expected issuer, `aud` equals your own `client_id`, and `exp` is in the future. An ID token you didn't validate is just a base64 string anyone could forge.

**Refresh token** - the long-lived ticket for getting fresh access tokens without dragging the user back through login. When the access token expires:

```text
POST /token
  grant_type=refresh_token
  refresh_token=<refresh_token>
  client_id=abc123
```

*What just happened:* You trade the refresh token for a brand-new access token (and sometimes a new refresh token). This is why you stay logged into apps for weeks despite access tokens expiring in an hour. Because it's long-lived and powerful, the refresh token is the **most sensitive** of the three - it goes only to the Authorization Server, lives only on a trusted back end, and never near a browser if you can help it. More on guarding it in Phase 3.

## For builders

A clean mental shorthand: the **access token is for machines** (one API checking another caller), the **ID token is for you** (your app learning the user's identity), and the **refresh token is for time** (surviving past the access token's short life). When you wire up a login, your back end validates the ID token to create a session, stashes the refresh token securely, and uses access tokens to call downstream APIs. Three tokens, three jobs, no overlap.

```quiz
[
  {
    "q": "Why does the Authorization Code flow return a short-lived code through the browser instead of the tokens directly?",
    "choices": [
      "Codes are smaller and load faster",
      "The browser can't store tokens at all",
      "The code travels the risky front channel, but is useless without a second back-channel exchange",
      "It lets the user copy the code manually"
    ],
    "answer": 2,
    "explain": "A stolen code is worthless alone - redeeming it needs the direct server-to-server token request, keeping real tokens off the front channel."
  },
  {
    "q": "What specific attack does PKCE defend against?",
    "choices": [
      "CSRF, where an attacker forces your app to complete their login",
      "Authorization code interception, where a stolen code gets redeemed by an attacker",
      "Brute-forcing the user's password",
      "Replaying an expired access token"
    ],
    "answer": 1,
    "explain": "PKCE ties the code to a secret verifier the attacker never saw; the stolen code can't be redeemed. CSRF is the job of the separate 'state' parameter."
  },
  {
    "q": "Your app needs to know which user just logged in. Which token do you read, and how?",
    "choices": [
      "The access token - decode it to read the user's name",
      "The refresh token - it contains the user id",
      "The ID token - verify its signature and claims, then read 'sub'",
      "Any of them - they all carry identity"
    ],
    "answer": 2,
    "explain": "Identity lives in the ID token (a JWT). Verify signature, iss, aud, and exp, then use the stable 'sub' as the user key. Access tokens are opaque and addressed to the API, not to you."
  }
]
```

[← Phase 1: The Problem and the Four Roles](01-the-problem-and-the-roles.md) | [Overview](_guide.md) | [Phase 3: Production Reality and the Gotchas →](03-production-reality-and-gotchas.md)
