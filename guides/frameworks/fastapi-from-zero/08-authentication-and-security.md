---
title: "Authentication & Security"
guide: "fastapi-from-zero"
phase: 8
summary: "Protect your Book API the FastAPI way: hash passwords, issue JWT access tokens from an OAuth2 password flow, and gate endpoints with a get_current_user dependency — plus the security must-knows."
tags: [fastapi, authentication, oauth2, jwt, security, password-hashing, bearer-token, dependency]
difficulty: advanced
synonyms: ["fastapi oauth2 password flow", "fastapi jwt authentication", "fastapi security depends", "fastapi password hashing", "fastapi bearer token", "fastapi get_current_user", "fastapi protect endpoint"]
updated: 2026-06-22
---

# Authentication & Security

Your Book API can now validate requests, shape responses, and talk to a real database. One thing's
missing that every real service needs: a lock on the door. Right now anyone who can reach `/books` can
create, edit, or delete a book. This phase puts a guard at the entrance — and you already know the
guard's job description. In FastAPI, security is built almost entirely on the dependency system from
[Phase 5](05-dependency-injection.md). "This endpoint requires a logged-in user" is just "this endpoint
*depends on* there being a current user."

Auth has a reputation for being scary, mostly from treating it as one giant blob. We're going to take it
apart into four small, separate jobs, each approachable on its own.

## Two different jobs: authentication vs authorization

📝 These two words look almost identical and people mix them up constantly, so pin them down now:

- **Authentication** (authn) = *who you are.* Proving your identity. This is logging in: you hand over a
  username and password, and the server confirms you are who you claim to be.
- **Authorization** (authz) = *what you're allowed to do.* Permissions. Once the server knows you're
  Ada, can Ada *delete* this book? Maybe only admins can.

A passport proves who you are (authn). A concert ticket says what you're allowed into (authz). You need
both, and they're different checks. The full mental model — sessions, tokens, OAuth — lives in a
dedicated guide: [Auth vs Authz](/guides/auth-vs-authz). Here we focus on wiring it into FastAPI.

💡 The throughline for this whole phase: **both jobs flow through `Depends()`.** Authentication is a
dependency that figures out *who* is calling. Authorization is a check *inside* that dependency (or a
second one) that decides *whether they may proceed*. Same machinery, two questions.

## Step 1: never store passwords in plaintext

Before anyone can log in, you need somewhere to keep their credentials — and the single most important
rule in this guide is this:

⚠️ **Never store a password as plaintext.** Not in your database, not in a log file, not anywhere. If
your database leaks (and databases leak), every plaintext password is instantly stolen — and because
people reuse passwords, you've also handed attackers their email and bank logins.

📝 Instead you store a **hash**: a one-way scramble of the password. You run the password through a
slow, deliberate hashing algorithm (bcrypt or argon2 are the standard choices) and store the result.
When someone logs in, you hash *what they typed* and compare it to the stored hash — you never need the
original password back, the whole point of "one-way." The deeper story of salting, slow hashing, and why
these algorithms exist is in [How Passwords Are Stored](/guides/how-passwords-are-stored).

In Python, the `passlib` library wraps all of this (shown as plain code — `passlib` isn't guaranteed in
the browser sandbox, so read it, don't run it):

```python
from passlib.context import CryptContext

# bcrypt is a solid, battle-tested default
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

# at signup time:
stored = hash_password("correct horse battery staple")
print(stored)   # -> '$2b$12$....' an opaque hash, NOT the password

# at login time:
verify_password("correct horse battery staple", stored)  # True
verify_password("wrong guess", stored)                   # False
```

*What just happened:* `hash_password` turns a plaintext password into an opaque string you can safely
store on a `User` row. `verify_password` re-hashes the login attempt and checks it against that stored
hash, returning `True`/`False` — without ever un-scrambling anything. You store the output of
`hash_password`, and only ever compare with `verify_password`. The plaintext password lives for a
fraction of a second in memory and is never written down.

💡 You didn't write the bcrypt algorithm yourself — deliberate; see the last section.

## Step 2: the OAuth2 password flow + JWT

A user can sign up and we store their hash. Now: how do they *log in*, and how does the server remember
them on the *next* request? HTTP is stateless — each request arrives with no memory of the last one. We
can't make the user re-send their password on every call (that would mean storing it client-side, the
exact thing we're avoiding).

📝 The standard answer for APIs is the **OAuth2 password flow**:

1. The client POSTs username + password *once* to a `/token` endpoint.
2. The server verifies the password against the stored hash.
3. If it checks out, the server hands back a signed **access token**.
4. On every later request, the client sends that token in the header:
   `Authorization: Bearer <token>` — no password needed again.

The token of choice here is a **JWT** (JSON Web Token). 📝 A JWT is a compact, **signed**,
self-contained string carrying a few **claims** (small facts, like "subject: ada" and "expires: 3pm").
"Signed" means the server stamps it with a secret key so it can later verify the token wasn't tampered
with — change one character and the signature breaks.

⚠️ The trap everyone falls into: **a JWT is signed, not *encrypted*.** Anyone holding it can decode and
read the payload (it's just base64 — paste one into jwt.io and you'll see). The signature stops forgery;
it does **not** hide what's inside. Never put secrets (passwords, credit card numbers, anything
sensitive) in a JWT payload.

Here's the `/token` endpoint. It uses `OAuth2PasswordRequestForm`, FastAPI's helper that reads the
standard `username`/`password` form fields the OAuth2 spec expects:

```python
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from jose import jwt   # python-jose, the usual JWT library

app = FastAPI()

SECRET_KEY = "load-this-from-an-env-var-not-source-code"
ALGORITHM = "HS256"

# pretend user store; in Phase 7 this is a real DB lookup
FAKE_USER = {"username": "ada", "hashed_password": "$2b$12$...", "role": "reader"}

@app.post("/token")
def login(form: OAuth2PasswordRequestForm = Depends()):
    user = FAKE_USER if form.username == FAKE_USER["username"] else None
    if not user or not verify_password(form.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    expire = datetime.now(timezone.utc) + timedelta(minutes=30)
    token = jwt.encode(
        {"sub": user["username"], "role": user["role"], "exp": expire},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )
    return {"access_token": token, "token_type": "bearer"}
```

*What just happened:* `OAuth2PasswordRequestForm = Depends()` is itself a dependency — it pulls the
`username` and `password` out of the form body for you. You verify the password against the stored hash
with the function from Step 1. On success you build a JWT carrying the username (`sub`, "subject"), the
role, and an expiry (`exp`), sign it with your secret, and return it in the shape OAuth2 clients expect:
`{"access_token": ..., "token_type": "bearer"}`. On failure you return a clean `401` — we don't say
*which* field was wrong, so we don't help attackers guess usernames.

A login request and its response look like this:

```http
POST /token HTTP/1.1
Content-Type: application/x-www-form-urlencoded

username=ada&password=correct+horse+battery+staple
```

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZGEi...",
  "token_type": "bearer"
}
```

*What just happened:* the client sent form-encoded credentials (not JSON — the OAuth2 password flow uses
a form body) and got back a token. The client stashes that `access_token` and attaches it to every future
request, never sending the password again until the token expires.

## Step 3: securing endpoints with a dependency

Now the payoff: turn "is this caller logged in?" into a dependency, and any endpoint that wants
protection `Depends` on it.

First, declare the scheme. `OAuth2PasswordBearer` tells FastAPI *where* tokens come from (the
`Authorization: Bearer` header) and which URL issues them (so `/docs` can offer a login button):

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    creds_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise creds_error          # bad signature, expired, or malformed
    username = payload.get("sub")
    if username is None:
        raise creds_error
    # in Phase 7, load the real row: user = db.get(User, username)
    return {"username": username, "role": payload.get("role")}
```

*What just happened:* `Depends(oauth2_scheme)` extracts the raw token string from the `Authorization`
header (and auto-rejects requests that have none). `jwt.decode` verifies the signature **and** the
expiry against your secret — if the token was forged, tampered with, or expired, it raises `JWTError`
and we turn that into a `401`. If it's valid, we read the `sub` claim and return the user. An ordinary
dependency, exactly like the ones in Phase 5 — it just happens to do auth.

Protect the write endpoint. Any route that requires a login adds one parameter:

```python
@app.post("/books", status_code=status.HTTP_201_CREATED)
def create_book(title: str, current_user: dict = Depends(get_current_user)):
    return {"created_by": current_user["username"], "title": title}
```

*What just happened:* `current_user: dict = Depends(get_current_user)` is the entire lock. FastAPI runs
`get_current_user` *before* your function body. No valid token? It raises `401` and `create_book` never
executes. Valid token? Your endpoint receives the authenticated user and can record who created the book.
Zero auth logic inside the handler — it just declares the need.

A request with no token gets stopped cold:

```http
POST /books?title=Dune HTTP/1.1
```

```json
{ "detail": "Not authenticated" }
```

*What just happened:* the request arrived with no `Authorization` header, so `oauth2_scheme` rejected it
with `401` before `get_current_user` even ran. Send the header — `Authorization: Bearer eyJhbGci...` —
and it sails through. 💡 As a bonus, because you declared `OAuth2PasswordBearer`, FastAPI adds an
**Authorize** button to `/docs`: testers paste a token once and the interactive docs send it on every call.

### Authorization: checking what they're allowed to do

That covered authn (who you are). For authz (what you may do), do the check inside a dependency too —
one that requires the admin role:

```python
def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admins only",
        )
    return current_user

@app.delete("/books/{book_id}")
def delete_book(book_id: int, admin: dict = Depends(require_admin)):
    return {"deleted": book_id, "by": admin["username"]}
```

*What just happened:* `require_admin` is a **sub-dependency** — it depends on `get_current_user` to
establish *who* the caller is, then checks their `role`. A logged-in non-admin gets `403 Forbidden`
(`401` means "I don't know who you are," `403` means "I know who you are and you can't do this"). Same
dependency machinery, now answering the authorization question.

## Step 4: the security must-knows

Auth code is the worst place to improvise. A handful of rules carry most of the safety:

- ⚠️ **Always HTTPS in production.** A Bearer token in a plaintext HTTP request is sitting in the open —
  anyone on the network path can copy it and impersonate the user. TLS is what stops that; see
  [HTTPS & TLS](/guides/https-and-tls). Locally `http://localhost` is fine; in production it is not.
- ⚠️ **Keep the JWT secret out of your code.** That `SECRET_KEY` signs every token. If it leaks,
  attackers can forge valid tokens for any user. Load it from an environment variable (or a secrets
  manager), never commit it, and rotate it if it's ever exposed.
- ⚠️ **Set token expiry, and consider refresh tokens.** Short-lived access tokens (minutes to an hour)
  limit the damage if one is stolen. The common pattern is a short access token plus a longer-lived
  *refresh* token used only to mint new access tokens.
- ⚠️ **Don't put sensitive data in the JWT payload.** It's decodable, remember — username and role are
  fine; passwords, card numbers, and PII are not.
- 💡 **Don't roll your own crypto.** Use FastAPI's OAuth2 utilities and battle-tested libraries
  (`passlib`, `python-jose`). Hand-written hashing or token signing is how subtle, catastrophic bugs get
  in. Security is the one area where "clever" is a red flag — boring and standard wins.

Notice how little new machinery this phase actually introduced. Hashing is two function calls. The token
endpoint is a normal POST handler. Protecting routes is the *same* `Depends()` you already knew —
`get_current_user` is just a dependency that reads a header and validates a token. Auth felt big because
it bundles four jobs together; taken one at a time, each is something you can already do.

## Recap

1. **Authentication** (who you are) and **authorization** (what you may do) are two distinct checks —
   and in FastAPI both flow through the dependency system from Phase 5.
2. **Never store plaintext passwords.** Hash them with bcrypt/argon2 via `passlib`: store the hash,
   verify login attempts against it, and never recover the original.
3. The **OAuth2 password flow** takes username/password at a `/token` endpoint (`OAuth2PasswordRequestForm`),
   verifies the hash, and returns a signed **JWT** the client resends as `Authorization: Bearer <token>`.
4. A JWT is **signed, not encrypted** — its payload is readable by anyone, so it stops forgery but hides
   nothing. Keep secrets out of it.
5. Protect endpoints with `OAuth2PasswordBearer` + a `get_current_user` dependency that decodes and
   validates the token; add `Depends(get_current_user)` to require auth (and a role check inside a
   sub-dependency for authorization). FastAPI even adds the Authorize button to `/docs`.
6. **Security must-knows:** always HTTPS in prod, keep the JWT secret in env vars, set token expiry, no
   sensitive data in the payload, and lean on standard libraries instead of rolling your own crypto.

## Quick check

Make sure the core ideas stuck before moving on:

```quiz
[
  {
    "q": "Your database leaks. Which storage choice means the attacker does NOT instantly have everyone's usable passwords?",
    "choices": ["Passwords stored as plaintext", "Passwords stored as bcrypt/argon2 hashes", "Passwords stored base64-encoded", "Passwords stored inside the JWT payload"],
    "answer": 1,
    "explain": "A one-way hash (bcrypt/argon2) can't be reversed to the original password. Plaintext and base64 are both readable; base64 is just encoding, not protection."
  },
  {
    "q": "True or false: because a JWT is signed, the data inside it is hidden from anyone holding the token.",
    "choices": ["True — signing encrypts the payload", "False — a JWT is signed, not encrypted; the payload is readable", "True, but only if you use HS256", "False — JWTs have no payload at all"],
    "answer": 1,
    "explain": "Signing proves the token wasn't tampered with; it does not hide the contents. Anyone can base64-decode and read a JWT payload, so never put secrets in it."
  },
  {
    "q": "In a protected endpoint, what does `current_user: dict = Depends(get_current_user)` accomplish?",
    "choices": ["It encrypts the response", "FastAPI runs get_current_user first; an invalid/missing token raises 401 and the handler never runs", "It logs the user out after the request", "It stores the password in the session"],
    "answer": 1,
    "explain": "Auth is just a dependency. FastAPI resolves get_current_user before the body; if the token is missing or invalid it raises 401 and the endpoint never executes."
  }
]
```

---

[← Phase 7: Databases with SQLModel](07-databases-with-sqlmodel.md) · [Guide overview](_guide.md) · [Phase 9: Testing & Project Structure →](09-testing-and-project-structure.md)
