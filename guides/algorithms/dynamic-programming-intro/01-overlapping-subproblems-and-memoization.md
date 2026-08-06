---
title: "Overlapping Subproblems and Memoization"
guide: "dynamic-programming-intro"
phase: 1
summary: "Naive recursive Fibonacci is exponentially slow because it solves the same subproblems over and over. Memoization stores each subproblem's answer the first time it is computed, collapsing O(2^n) work into O(n)."
tags: [algorithms, dynamic-programming, memoization, fibonacci, recursion, overlapping-subproblems]
difficulty: beginner
synonyms: ["what are overlapping subproblems", "what is memoization", "why is recursive fibonacci slow", "fibonacci memoization python", "top down dynamic programming"]
updated: 2026-08-06
---

# Overlapping Subproblems and Memoization

The fastest way to feel why dynamic programming exists is to write a function that is correct but painfully
slow, watch exactly where it wastes its time, then fix it with a few lines. Fibonacci is the classic case:
short enough to hold in your head, slow enough to make the point.

## The naive version, and why it crawls

Each Fibonacci number is the sum of the two before it: `fib(n) = fib(n-1) + fib(n-2)`, with `fib(0) = 0` and
`fib(1) = 1`. That definition is also a working program.

```python runnable
calls = 0

def fib(n):
    global calls
    calls += 1
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)

print(fib(30), "computed in", calls, "calls")
```
```console
832040 computed in 2692537 calls
```
*What just happened:* computing `fib(30)` took over 2.6 million function calls to produce one number. The
reason is that `fib(30)` calls `fib(29)` and `fib(28)`, but `fib(29)` also calls `fib(28)`, and both of those
call `fib(27)`, and so on. The same subproblems get solved again and again down separate branches of the call
tree. That repeated work is called **overlapping subproblems**, and it makes the running time grow like
`O(2^n)` - roughly double for every step up.

📝 **Terminology.** *Overlapping subproblems* means the recursive calls keep asking the same questions. If
each subproblem were unique (like the two halves in merge sort), there would be nothing to cache and DP would
not help. Overlap is the thing dynamic programming exploits.

## The fix: remember what you already computed

The wasted work is entirely re-computation. `fib(28)` has one answer; there is no reason to derive it more
than once. So keep a dictionary - a **memo** - mapping each `n` to its answer. Before computing `fib(n)`,
check the memo. Compute it only on a miss, and store the result on the way out.

```python runnable
calls = 0

def fib(n, memo=None):
    global calls
    calls += 1
    if memo is None:
        memo = {}
    if n < 2:
        return n
    if n in memo:
        return memo[n]
    memo[n] = fib(n - 1, memo) + fib(n - 2, memo)
    return memo[n]

print(fib(30), "computed in", calls, "calls")
```
```console
832040 computed in 59 calls
```
*What just happened:* same answer, but 59 calls instead of 2.6 million. Each distinct subproblem `fib(2)`
through `fib(30)` is computed exactly once and cached; every other request is an instant memo hit. This
top-down style - ordinary recursion plus a cache - is called **memoization**. The running time drops from
`O(2^n)` to `O(n)`, because there are only `n` distinct subproblems and each costs constant work once its
inputs are known.

💡 **Key point.** Memoization does not change *what* the function computes - only how many times it computes
each piece. You keep the readable recursive definition and bolt a cache onto it.

⚠️ **Gotcha: the mutable default argument.** Do not write `def fib(n, memo={})`. In Python a default
argument is created once and shared across every call, so the memo would persist between unrelated top-level
calls and quietly leak state. The `memo=None` then `if memo is None: memo = {}` pattern gives each fresh call
its own memo. (Python's own `functools.lru_cache` decorator sidesteps this entirely and is what you would use
in real code.)

## The same memoized Fibonacci, in other languages

The shape is identical everywhere: a base case, a cache lookup, compute-and-store on a miss. Only the
cache type and the syntax change. Flip through the tabs.

[[codegroup Memoized Fibonacci]]

```python
def fib(n, memo=None):
    if memo is None:
        memo = {}
    if n < 2:
        return n
    if n in memo:
        return memo[n]
    memo[n] = fib(n - 1, memo) + fib(n - 2, memo)
    return memo[n]
```

```javascript
function fib(n, memo = {}) {
  if (n < 2) return n;
  if (n in memo) return memo[n];
  memo[n] = fib(n - 1, memo) + fib(n - 2, memo);
  return memo[n];
}
```

```typescript
function fib(n: number, memo: Record<number, number> = {}): number {
  if (n < 2) return n;
  if (n in memo) return memo[n];
  memo[n] = fib(n - 1, memo) + fib(n - 2, memo);
  return memo[n];
}
```

```java
static long fib(int n, Map<Integer, Long> memo) {
    if (n < 2) return n;
    if (memo.containsKey(n)) return memo.get(n);
    long result = fib(n - 1, memo) + fib(n - 2, memo);
    memo.put(n, result);
    return result;
}
```

```cpp
long long fib(int n, std::unordered_map<int, long long>& memo) {
    if (n < 2) return n;
    if (memo.count(n)) return memo[n];
    long long result = fib(n - 1, memo) + fib(n - 2, memo);
    memo[n] = result;
    return result;
}
```

```go
func fib(n int, memo map[int]int) int {
    if n < 2 {
        return n
    }
    if v, ok := memo[n]; ok {
        return v
    }
    memo[n] = fib(n-1, memo) + fib(n-2, memo)
    return memo[n]
}
```

```rust
use std::collections::HashMap;

fn fib(n: u64, memo: &mut HashMap<u64, u64>) -> u64 {
    if n < 2 {
        return n;
    }
    if let Some(&v) = memo.get(&n) {
        return v;
    }
    let result = fib(n - 1, memo) + fib(n - 2, memo);
    memo.insert(n, result);
    result
}
```

[[/codegroup]]

The typed languages pass the memo in by reference (`&`, `&mut`, or a shared object) so that every branch of
the recursion writes into the *same* cache - exactly what makes the caching work. Pass a copy per call and
you are back to the slow version.

## Check yourself

```quiz
[
  {
    "q": "What makes naive recursive Fibonacci exponentially slow?",
    "choices": ["It uses too much memory per call", "The same subproblems like fib(28) get recomputed on many separate branches", "Recursion is always slower than a loop", "Python function calls are unusually slow"],
    "answer": 1,
    "explain": "fib(30) and fib(29) both need fib(28), and so on down the tree - the same subproblems are solved again and again, doubling the work at each level."
  },
  {
    "q": "What does memoization store, and keyed by what?",
    "choices": ["The entire call stack", "The final answer only", "The answer to each subproblem the first time it is computed, keyed by that subproblem's inputs", "A log of every function ever called"],
    "answer": 2,
    "explain": "A memo maps a subproblem's inputs to its answer, so the second request for the same inputs is an instant lookup instead of a recomputation."
  },
  {
    "q": "Memoized Fibonacci turns the running time from O(2^n) into roughly what?",
    "choices": ["O(1)", "O(log n)", "O(n)", "O(n^2)"],
    "answer": 2,
    "explain": "There are only n distinct subproblems; each is computed once and every other request is a cache hit, so total work is proportional to n."
  }
]
```
