---
title: "Converging Two Pointers"
guide: "two-pointers-and-sliding-window"
phase: 1
summary: "The converging two-pointer pattern: start one pointer at each end and walk them inward. Reverse a list in place, check a palindrome, and find a pair summing to a target on a sorted array - all in a single O(n) pass with no extra memory."
tags: [algorithms, two-pointers, arrays, palindrome, pair-sum, big-o]
difficulty: beginner
synonyms: ["two pointer converging technique", "pair with target sum sorted array", "reverse array in place two pointers", "check palindrome two pointers", "opposite ends pointers algorithm"]
updated: 2026-08-06
---

# Converging Two Pointers

The first two-pointer motion to learn is the simplest: put one pointer at the **start** of the array and
one at the **end**, then walk them toward each other. Each step you look at the pair they point to, make a
decision, and move one (or both) pointers inward. When they meet, you're done. That's a single pass over the
data - `O(n)` time - and it uses no extra memory beyond the two index variables.

## Warm-up: reverse a list in place

The cleanest way to feel the motion is reversing a list. Swap the two ends, step inward, repeat until the
pointers meet in the middle.

```python runnable
def reverse_in_place(items):
    lo, hi = 0, len(items) - 1
    while lo < hi:
        items[lo], items[hi] = items[hi], items[lo]
        lo += 1
        hi -= 1
    return items

print(reverse_in_place([1, 2, 3, 4, 5]))
```
```console
[5, 4, 3, 2, 1]
```
*What just happened:* `lo` starts at the front, `hi` at the back. Each loop swaps those two elements and
then steps both pointers one place toward the center. The loop condition `lo < hi` stops them the instant
they cross (or land on the same middle element, which needs no swap). Nothing is ever visited twice.

📝 **Terminology.** People say "two pointers," but in Python these are just **integer indices**. The word
"pointer" is borrowed from lower-level languages; here it only means "a position we move through the array."

## Palindrome check: same motion, different decision

A palindrome reads the same forward and backward - so compare the two ends, and if they ever disagree, it
isn't one. Otherwise step inward and keep checking.

```python runnable
def is_palindrome(s):
    lo, hi = 0, len(s) - 1
    while lo < hi:
        if s[lo] != s[hi]:
            return False
        lo += 1
        hi -= 1
    return True

print(is_palindrome("racecar"))
print(is_palindrome("hello"))
```
```console
True
False
```
*What just happened:* the pointers start at both ends and compare. `"racecar"` matches at every step until
they meet, so it returns `True`. `"hello"` fails immediately - `h` at the front doesn't match `o` at the
back - so it returns `False` without bothering to check the rest.

## The real one: pair with a target sum (sorted array)

Here's where converging pointers earn their keep. Given a **sorted** array, find two elements that add up
to a target. The naive approach checks every pair with two nested loops - `O(n²)`. But because the array is
sorted, the two ends tell you exactly which way to move:

- If the current pair sums to **too little**, the only way to get a bigger sum is to move the **low** pointer
  right (toward larger values).
- If it sums to **too much**, move the **high** pointer left (toward smaller values).
- If it's exactly the target, you're done.

```python runnable
def has_pair_with_sum(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        current = nums[lo] + nums[hi]
        if current == target:
            return (lo, hi)
        elif current < target:
            lo += 1
        else:
            hi -= 1
    return None

print(has_pair_with_sum([1, 3, 4, 5, 7, 11], 9))
print(has_pair_with_sum([1, 3, 4, 5, 7, 11], 100))
```
```console
(2, 3)
None
```
*What just happened:* for target `9`, the pointers start at `1` and `11` (sum `12`, too big → `hi` moves
left), then `1` and `7` (sum `8`, too small → `lo` moves right), then `3` and `7` (`10`, too big → `hi`
left), then `4` and `5` (`9`, match → return indices `(2, 3)`). Target `100` can never be reached; the
pointers cross and the function returns `None`. One pass, no nested loop.

💡 **Key point.** This shortcut *only works because the array is sorted.* Sorted order is what makes "too
small → move right, too big → move left" a reliable decision. On an unsorted array this logic silently
gives wrong answers - a trap we'll return to in Phase 3.

## The same pair-sum, in other languages

The motion is identical in every language: an index at each end, a decision, one pointer steps inward. The
typed languages just spell out the array and integer types, and each returns "not found" in its own idiom.

[[codegroup Pair With Target Sum]]

```python
def has_pair_with_sum(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        current = nums[lo] + nums[hi]
        if current == target:
            return (lo, hi)
        elif current < target:
            lo += 1
        else:
            hi -= 1
    return None
```

```javascript
function hasPairWithSum(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo < hi) {
    const current = nums[lo] + nums[hi];
    if (current === target) return [lo, hi];
    if (current < target) lo++;
    else hi--;
  }
  return null;
}
```

```typescript
function hasPairWithSum(nums: number[], target: number): [number, number] | null {
  let lo = 0, hi = nums.length - 1;
  while (lo < hi) {
    const current = nums[lo] + nums[hi];
    if (current === target) return [lo, hi];
    if (current < target) lo++;
    else hi--;
  }
  return null;
}
```

```java
static int[] hasPairWithSum(int[] nums, int target) {
    int lo = 0, hi = nums.length - 1;
    while (lo < hi) {
        int current = nums[lo] + nums[hi];
        if (current == target) return new int[]{lo, hi};
        if (current < target) lo++;
        else hi--;
    }
    return null;
}
```

```cpp
// returns {-1, -1} when no pair is found
std::pair<int, int> has_pair_with_sum(const std::vector<int>& nums, int target) {
    int lo = 0, hi = (int)nums.size() - 1;
    while (lo < hi) {
        int current = nums[lo] + nums[hi];
        if (current == target) return {lo, hi};
        if (current < target) lo++;
        else hi--;
    }
    return {-1, -1};
}
```

```go
func hasPairWithSum(nums []int, target int) (int, int, bool) {
    lo, hi := 0, len(nums)-1
    for lo < hi {
        current := nums[lo] + nums[hi]
        if current == target {
            return lo, hi, true
        } else if current < target {
            lo++
        } else {
            hi--
        }
    }
    return 0, 0, false
}
```

```rust
fn has_pair_with_sum(nums: &[i32], target: i32) -> Option<(usize, usize)> {
    if nums.is_empty() {
        return None;
    }
    let (mut lo, mut hi) = (0usize, nums.len() - 1);
    while lo < hi {
        let current = nums[lo] + nums[hi];
        if current == target {
            return Some((lo, hi));
        } else if current < target {
            lo += 1;
        } else {
            hi -= 1;
        }
    }
    None
}
```

[[/codegroup]]

Notice the loop condition is `lo < hi`, not `lo <= hi`. Pairing an element *with itself* isn't a valid pair,
so the pointers must stay strictly apart. That single character is a real bug source - the next phase's
cousin (the sliding window) has its own version of the same off-by-one hazard.

```quiz
[
  {
    "q": "In the pair-sum function, why does moving `lo` right when the sum is too small work?",
    "choices": ["Because the array is sorted, so larger values are to the right", "Because it's faster to increment than decrement", "Because the target is always positive", "It doesn't matter which pointer moves"],
    "answer": 0,
    "explain": "Sorted order guarantees values increase to the right. A sum that's too small can only grow by moving the low pointer toward the larger values."
  },
  {
    "q": "Why does the converging loop use `while lo < hi` instead of `while lo <= hi`?",
    "choices": ["To run one extra iteration for safety", "So an element is never paired with itself, and the pointers stop when they meet", "Because `<=` is slower", "To handle empty arrays only"],
    "answer": 1,
    "explain": "A valid pair needs two distinct positions. `lo < hi` keeps them strictly apart and stops the loop the moment they meet or cross."
  }
]
```
