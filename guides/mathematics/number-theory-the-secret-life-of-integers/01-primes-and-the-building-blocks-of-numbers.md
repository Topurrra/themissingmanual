---
title: "Primes and the Building Blocks of Numbers"
guide: "number-theory-the-secret-life-of-integers"
phase: 1
summary: "A prime number is a number that cannot be built from smaller numbers. Every other number can be factored into primes in exactly one way, like a unique fingerprint. This phase shows why that matters and how to find the factors of any number."
tags: [mathematics, number-theory, primes, factorization, GCD, beginner-friendly]
difficulty: beginner
synonyms: ["what is a prime number", "prime factorization", "fundamental theorem of arithmetic", "greatest common divisor", "GCD explained", "how to find prime factors"]
updated: 2026-06-28
---

# Primes and the Building Blocks of Numbers

## The LEGO brick analogy

Think about building with LEGO. Some bricks are basic: the 1x1, the 2x4, the 2x2. Others are fancy: a wheel, a window, a minifigure head. But every model you build, no matter how complex, is a combination of those basic bricks.

Numbers work the same way. The basic bricks are **prime numbers** - numbers that cannot be broken down into smaller whole-number pieces. Every other number is a combination of primes, and that combination is unique.

That is not a metaphor. It is a theorem, and it is one of the most useful facts in all of mathematics.

## What a prime number is

A **prime number** is a whole number greater than 1 that has exactly two divisors: 1 and itself.

The first few primes are:

```
2, 3, 5, 7, 11, 13, 17, 19, 23, 29, ...
```

Notice that 2 is the only even prime. Every other even number can be divided by 2, so it has at least three divisors: 1, 2, and itself. That disqualifies it.

A number that is not prime is **composite**. It can be built from smaller numbers.

```
4 = 2 * 2
6 = 2 * 3
8 = 2 * 2 * 2
9 = 3 * 3
10 = 2 * 5
```

## The fundamental theorem of arithmetic

Here is the remarkable part. Take any composite number and break it into primes. You will always get the same primes, no matter how you do it.

```
12 = 2 * 2 * 3
12 = 3 * 2 * 2
12 = 2 * 3 * 2
```

The primes are always two 2s and one 3. The order does not matter. The combination is unique.

This is called the **fundamental theorem of arithmetic**. It means primes are the unique building blocks of the whole numbers. As every LEGO model can be taken apart into basic bricks, every number can be factored into primes, and there is only one way to do it.

That uniqueness is what makes primes useful for cryptography. If a number has only one factorization, then knowing the factors is a very special piece of information.

## Finding the factors: trial division

Suppose you want to factor 91. You do not need a computer. You need patience and a simple rule: if a number is composite, it has a factor less than or equal to its square root.

The square root of 91 is about 9.5. So you only need to test prime numbers up to 9: 2, 3, 5, 7.

- 91 is odd, so not divisible by 2.
- 9 + 1 = 10, which is not divisible by 3, so 91 is not divisible by 3.
- 91 does not end in 0 or 5, so not divisible by 5.
- 91 divided by 7 is 13. Both are prime.

So:

```
91 = 7 * 13
```

That is the whole factor tree. Two primes, done.

## Greatest common divisor: the largest piece that fits both

Suppose you have two numbers, like 48 and 18. You want the largest number that divides both of them evenly. That is the **greatest common divisor**, or GCD.

One way to find it: list the factors of each and pick the largest one they share.

```
Factors of 48: 1, 2, 3, 4, 6, 8, 12, 16, 24, 48
Factors of 18: 1, 2, 3, 6, 9, 18
Common: 1, 2, 3, 6
GCD(48, 18) = 6
```

For small numbers that works. For large numbers, there is a faster method called the Euclidean algorithm. The idea is beautiful in its simplicity:

```
GCD(a, b) = GCD(b, a mod b)
```

Keep taking the remainder until you hit zero. The last non-zero remainder is the GCD.

```
GCD(48, 18):
48 mod 18 = 12
GCD(18, 12):
18 mod 12 = 6
GCD(12, 6):
12 mod 6 = 0
GCD is 6
```

The same math, faster. And it is the same math that underpins the RSA encryption you will meet in Phase 3.

## See it run

Here is a simple factor finder and GCD calculator in Python.

```python runnable
def prime_factors(n):
    factors = []
    d = 2
    while d * d <= n:
        while n % d == 0:
            factors.append(d)
            n = n // d
        d = d + 1
    if n > 1:
        factors.append(n)
    return factors

def gcd(a, b):
    while b:
        a, b = b, a % b
    return a

print("Factors of 91:", prime_factors(91))
print("Factors of 100:", prime_factors(100))
print("GCD(48, 18):", gcd(48, 18))
print("GCD(1071, 462):", gcd(1071, 462))
```

*What just happened:* The `prime_factors` function divides the number by successive integers, collecting the prime factors as it goes. The `gcd` function implements the Euclidean algorithm: repeatedly replace the larger number with the remainder until the remainder is zero. Both are fast, both are exact, and both are built on the same prime-number foundation.

## For builders

Primes and GCD are not only school topics. They are the tools that make modern security possible.

- **Hashing and checksums** - A good hash function spreads inputs evenly across its output range. Prime-number table sizes help avoid the clustering that causes collisions.
- **Cryptography** - RSA encryption relies on the fact that multiplying two large primes is fast, but factoring their product back into the original primes is slow. That one-way street is what keeps your data private.
- **Periodic scheduling** - If two events repeat on cycles of 3 days and 5 days, they will coincide every 15 days. That is the least common multiple, which is closely related to the GCD.
- **Random number generation** - Many pseudo-random number generators use prime moduli to ensure long periods before the sequence repeats.

> The key insight: primes are the atoms of arithmetic. Every composite number is a molecule made from prime atoms, and the factorization is unique. That uniqueness is rare in mathematics, and it is the reason primes are useful for everything from hash tables to nation-state encryption.

## What we have built

- A **prime** is a number with exactly two divisors: 1 and itself.
- A **composite** number can be factored into primes.
- The **fundamental theorem of arithmetic** says every number has exactly one prime factorization.
- **Trial division** finds factors by testing primes up to the square root.
- The **GCD** is the largest number that divides two numbers evenly, found efficiently by the Euclidean algorithm.
- In code, prime factorization and GCD are short functions that run on numbers of any size your language can hold.

A quick check before you move on:

```quiz
[
  {
    "q": "Which of these numbers is prime?",
    "choices": ["15", "21", "29", "33"],
    "answer": 2,
    "explain": "29 has no divisors other than 1 and 29. The others are composite: 15 = 3 * 5, 21 = 3 * 7, 33 = 3 * 11."
  },
  {
    "q": "What does the fundamental theorem of arithmetic say?",
    "choices": ["Every number is prime", "Every composite number can be factored into primes in exactly one way", "Prime numbers are infinite", "The GCD of two numbers is always 1"],
    "answer": 1,
    "explain": "The fundamental theorem of arithmetic states that every integer greater than 1 can be represented in exactly one way as a product of prime numbers, up to the order of the factors."
  },
  {
    "q": "Using the Euclidean algorithm, what is GCD(1071, 462)?",
    "choices": ["21", "33", "7", "3"],
    "answer": 0,
    "explain": "1071 mod 462 = 147. 462 mod 147 = 21. 147 mod 21 = 0. The last non-zero remainder is 21, so GCD(1071, 462) = 21."
  }
]
```

[← Guide overview](_guide.md) · [Phase 2: The Clock Math You Already Know →](02-the-clock-math-you-already-know.md)
