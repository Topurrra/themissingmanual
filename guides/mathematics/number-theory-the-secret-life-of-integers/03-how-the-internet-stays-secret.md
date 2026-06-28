---
title: "How the Internet Stays Secret"
guide: "number-theory-the-secret-life-of-integers"
phase: 3
summary: "RSA encryption works because multiplying two large primes is easy, but factoring their product back apart is nearly impossible. This phase explains the one-way street that keeps your credit card number private, and connects it to the hashing and checksums you use every day."
tags: [mathematics, number-theory, RSA, encryption, hashing, checksums, cryptography, beginner-friendly]
difficulty: beginner
synonyms: ["how does RSA work", "public key cryptography explained", "why is RSA secure", "hashing explained", "checksums and cryptography", "one-way functions"]
updated: 2026-06-28
---

# How the Internet Stays Secret

## The padlock in your browser

Look at the address bar of your browser right now. If you see a little padlock, that means the connection between your computer and the website is encrypted. Your credit card number, your password, your private messages - they are all scrambled into gibberish before they leave your computer, and only the website can unscramble them.

The math that makes this possible is number theory. Not the vague "math is beautiful" kind. The specific, practical kind: prime numbers, modular arithmetic, and the fact that some operations are easy to do but very hard to undo.

## The one-way street

Here is the core idea, stripped to its essence:

**Multiplying two large prime numbers is fast. Factoring their product back into the original primes is slow.**

If I give you the number 91 and ask for its factors, you can find 7 and 13 in seconds. But if I give you a 300-digit number that is the product of two 150-digit primes, even the fastest supercomputers on Earth would need longer than the age of the universe to find the original primes.

That asymmetry is the foundation of RSA encryption.

## How RSA works, in plain English

RSA is a public-key cryptosystem. That means there are two keys: a public key that anyone can see, and a private key that only the website possesses.

The public key is built from two large primes, `p` and `q`, and their product `n = p * q`. The private key is derived from `p` and `q`.

When you send a message to the website:
1. You look up its public key `(n, e)`.
2. You encrypt your message using `n` and `e`. The encryption is just modular exponentiation: `ciphertext = message^e mod n`.
3. The website receives the ciphertext and decrypts it using its private key `d`: `message = ciphertext^d mod n`.

The magic is that anyone can compute step 2, but only someone who knows `d` can reverse it in step 3. And `d` is derived from `p` and `q`, which are hidden inside `n`. Without factoring `n`, you cannot find `d`.

That is the whole system. The security does not come from keeping the algorithm secret. It comes from the fact that factoring a large composite number is computationally hard.

## A tiny example with real numbers

Real RSA uses primes with hundreds of digits. To show the mechanics, we will use tiny primes.

Choose `p = 5` and `q = 11`. Then:

```
n = p * q = 55
phi = (p - 1) * (q - 1) = 4 * 10 = 40
```

Choose `e = 7` (it must be coprime to 40). The public key is `(55, 7)`.

To encrypt the message `m = 12`:

```
ciphertext = 12^7 mod 55
```

Compute step by step:

```
12^2 mod 55 = 144 mod 55 = 34
12^4 mod 55 = 34^2 mod 55 = 1156 mod 55 = 16
12^7 mod 55 = 12^4 * 12^2 * 12^1 mod 55 = 16 * 34 * 12 mod 55 = 6528 mod 55 = 23
```

The ciphertext is 23. Without knowing `p` and `q`, an attacker sees only `n = 55` and `ciphertext = 23`. They would need to factor 55 to recover `p` and `q`, compute `phi`, and find the private key `d`. With tiny numbers that is easy. With 300-digit numbers, it is not.

## Hashing: the fingerprint that never lies

Encryption is two-way: you encrypt with a public key and decrypt with a private key. Hashing is one-way: you turn data into a fixed-size fingerprint, and you cannot get the original data back from the fingerprint.

A **hash function** takes any input - a password, a file, a message - and produces a fixed-length string of bytes. Good hash functions have two properties:

1. **Deterministic** - the same input always produces the same output.
2. **Avalanche effect** - changing even one bit of the input completely changes the output.

When you create an account on a website, the site does not store your password in plain text. It stores the hash of your password. When you log in, it hashes the password you typed and compares the hash to the stored hash. If they match, you are in.

If the site is breached, the attacker steals the hashes, not the passwords. Because hashing is one-way, the attacker cannot reverse the hashes to get the original passwords. They can only try guessing passwords, hashing each guess, and checking if the hash matches.

## Checksums: catching accidents, not enemies

A **checksum** is a small piece of data computed from a larger piece of data. Its job is to detect accidental errors, not to stop deliberate attacks.

When you download a file, the website may publish a checksum alongside it. After the download completes, your computer computes the checksum of the downloaded file and compares it to the published value. If they match, the file arrived intact. If not, something went wrong during transmission - a bit got flipped, a packet was lost, a cosmic ray struck the hard drive.

Checksums use the same modular arithmetic you have been learning. A simple checksum might add up all the bytes in a file and take the result modulo 256. A more robust one, like CRC32, uses polynomial division over GF(2) - which is modular arithmetic with a different set of rules.

The point is the same: reduce a large, error-prone thing to a small, reliable thing, using the wrap-around property of modular arithmetic.

## See it run

Here is a tiny RSA encryption and decryption, plus a simple hash function.

```python runnable
# Tiny RSA with p=5, q=11
p = 5
q = 11
n = p * q
phi = (p - 1) * (q - 1)
e = 7  # public exponent
# Find d such that (d * e) mod phi = 1
# For this tiny example, d = 23 works because 23 * 7 = 161, and 161 mod 40 = 1
d = 23

def rsa_encrypt(m, e, n):
    return pow(m, e, n)

def rsa_decrypt(c, d, n):
    return pow(c, d, n)

message = 12
ciphertext = rsa_encrypt(message, e, n)
decrypted = rsa_decrypt(ciphertext, d, n)

print("Original message:", message)
print("Ciphertext:", ciphertext)
print("Decrypted:", decrypted)

# A simple hash function using modular arithmetic
def simple_hash(data, mod=256):
    h = 0
    for char in data:
        h = (h * 31 + ord(char)) % mod
    return h

print("Hash of 'hello':", simple_hash("hello"))
print("Hash of 'hello!':", simple_hash("hello!"))
```

*What just happened:* The RSA section encrypted the number 12 with public key `(55, 7)` to get ciphertext 23, then decrypted it with private key `d = 23` to get 12 back. The `pow(base, exp, mod)` function is Python's built-in modular exponentiation - fast even for huge numbers. The `simple_hash` function turns a string into a number between 0 and 255 by iterating over the characters, multiplying the current hash by 31, adding the character code, and taking the result modulo 256. Change one character and the hash changes completely.

## For builders

This is the part where number theory stops being abstract and starts being the reason your software is secure.

- **HTTPS and TLS** - The padlock in your browser is RSA (or its modern cousin, elliptic curve cryptography) in action. The handshake that sets up the encrypted channel is pure number theory.
- **Password storage** - When a site hashes your password instead of storing it in plain text, it is using a one-way function. The best hash functions for passwords, like bcrypt and Argon2, are designed to be slow on purpose, to make guessing expensive.
- **Blockchain and cryptocurrencies** - Bitcoin and Ethereum use elliptic curve cryptography, which is number theory with a different curve. The "private key" is a random number. The "public key" is a point on a curve derived from that number. You can share the public key freely; only the private key can sign transactions.
- **Version control** - Git uses SHA-1 (and is moving to SHA-256) to identify commits. The hash is a checksum of the commit contents. If even one bit changes, the hash changes, and Git knows something is wrong.
- **Load balancing and consistent hashing** - When a distributed cache needs to decide which server holds a key, it hashes the key and takes the result modulo the number of servers. Adding or removing a server only moves the keys that fall into the changed range.

> The key insight: number theory gives us one-way functions. Easy to compute in one direction, hard to reverse. That asymmetry is the foundation of all digital security. Without it, the internet as we know it could not exist.

## What we have built

- **Prime numbers** are the atoms of arithmetic. Every composite number has a unique prime factorization.
- The **fundamental theorem of arithmetic** guarantees that factorization is unique.
- The **Euclidean algorithm** finds the GCD efficiently using only the `mod` operation.
- **Modular arithmetic** is wrap-around math. It keeps numbers small and enables cycles.
- **Modular exponentiation** computes huge powers modulo `n` efficiently, by reducing at every step.
- **RSA encryption** works because `n = p * q` is easy to compute, but factoring `n` back into `p` and `q` is hard.
- **Hashing** turns data into a fixed-size fingerprint using one-way functions.
- **Checksums** detect accidental errors using modular reduction.

You started this guide with a simple question about building blocks. You ended at the doorstep of the encryption that protects your credit card number. The same prime numbers that make multiplication unique also make factoring hard, and that hardness is what keeps your data safe.

A quick check before you go:

```quiz
[
  {
    "q": "Why is RSA encryption secure?",
    "choices": ["Because the algorithm is kept secret", "Because multiplying two large primes is easy, but factoring their product back into the original primes is computationally hard", "Because the primes are so large that computers cannot store them", "Because the modulus is always a prime number"],
    "answer": 1,
    "explain": "RSA security relies on the asymmetry between multiplication and factoring. Given two large primes p and q, computing n = p * q is fast. Given only n, recovering p and q by factoring is infeasible for sufficiently large numbers."
  },
  {
    "q": "What is the main difference between encryption and hashing?",
    "choices": ["Encryption is faster than hashing", "Encryption is two-way (you can decrypt), while hashing is one-way (you cannot get the original data back)", "Hashing uses primes and encryption does not", "Encryption is used for passwords and hashing is used for files"],
    "answer": 1,
    "explain": "Encryption is designed to be reversed with the right key. Hashing is designed to be one-way: you can compute a hash from data, but you cannot recover the original data from the hash. That is why sites store password hashes instead of plain-text passwords."
  },
  {
    "q": "A website publishes a checksum alongside a file you are downloading. What is the checksum checking for?",
    "choices": ["Whether the file contains a virus", "Whether the file was intentionally tampered with by an attacker", "Whether the file arrived intact without accidental corruption", "Whether the file is the latest version"],
    "answer": 2,
    "explain": "A checksum detects accidental errors in transmission or storage - a flipped bit, a lost packet, a scratched disk. It is not designed to stop deliberate tampering; for that you need a cryptographic signature or hash."
  }
]
```

[← Phase 2: The Clock Math You Already Know](02-the-clock-math-you-already-know.md) · [Guide overview](_guide.md)
