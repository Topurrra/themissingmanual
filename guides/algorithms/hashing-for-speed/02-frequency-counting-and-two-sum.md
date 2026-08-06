---
title: "Frequency Counting & Two-Sum"
guide: "hashing-for-speed"
phase: 2
summary: "Two everyday hash-map patterns: counting occurrences with a dictionary, and the classic two-sum solved in a single O(n) pass by remembering what you've already seen - no sorting, no nested loop."
tags: [algorithms, hashing, hash-map, frequency-count, two-sum, big-o]
difficulty: beginner
synonyms: ["frequency counting with dictionary", "count occurrences python dict", "two sum hash map one pass", "two sum without sorting", "complement lookup two sum"]
updated: 2026-08-06
---

# Frequency Counting & Two-Sum

With the "why" in hand, here are the two hash-map patterns you'll reach for most. Both share one move:
**remember what you've already seen so you never have to look back through the data.**

## Pattern one: counting occurrences

How many times does each item appear? A dictionary from item to count answers it in a single pass. Each item
you meet, bump its count by one; use `.get(key, 0)` so the first sighting starts from zero instead of raising
a `KeyError`.

```python runnable
def char_counts(s):
    counts = {}
    for ch in s:
        counts[ch] = counts.get(ch, 0) + 1
    return counts

print(char_counts("mississippi"))
```
```console
{'m': 1, 'i': 4, 's': 4, 'p': 2}
```
*What just happened:* one walk through the string. `counts.get(ch, 0)` reads the running total (or `0` if
this character is new), adds one, and stores it back. By the end every character maps to how often it
appeared - `i` and `s` four times each. This is `O(n)`: one lookup-and-update per character, each `O(1)` on
average.

💡 **Key point.** The standard library has this exact pattern prepackaged as `collections.Counter` - so in
real code you'd write `Counter("mississippi")`. Writing the loop by hand once is worth it to see there's no
magic: it's just a dict and `+= 1`.

## Pattern two: two-sum in a single pass

The classic interview problem: given a list of numbers and a target, return the indices of the two numbers
that add up to the target. The brute force checks every pair - `O(n²)`. The
[two-pointer version](/guides/two-pointers-and-sliding-window) gets it to `O(n)` but *requires sorting first*
(and sorting scrambles the original indices). The hash map does it in one pass with no sorting at all.

The insight: as you walk the list, for each number `x` you know exactly what its partner must be -
`target - x`, call it the **complement**. So instead of searching for the partner, ask a hash map "have I
already seen `target - x`?" If yes, you've found the pair. If no, remember `x` (and its index) and move on.

```python runnable
def two_sum(nums, target):
    seen = {}                       # value -> index where we saw it
    for i, x in enumerate(nums):
        need = target - x           # the complement that would complete the pair
        if need in seen:
            return (seen[need], i)
        seen[x] = i
    return None

print(two_sum([2, 7, 11, 15], 9))
print(two_sum([3, 2, 4], 6))
print(two_sum([1, 2, 3], 100))
```
```console
(0, 1)
(1, 2)
None
```
*What just happened:* for `[2, 7, 11, 15]` with target `9`: see `2`, its complement `7` isn't in `seen` yet,
so remember `2`. See `7`, its complement `2` *is* in `seen` - return `(0, 1)`. For `[3, 2, 4]` target `6`,
the pair is `2 + 4`, found at indices `(1, 2)`. Target `100` has no pair, so `None`. Each number is looked
at once, and each "have I seen the complement?" check is an `O(1)` hash lookup - the whole thing is `O(n)`.

⚠️ **Gotcha.** Store each number in `seen` *after* checking for its complement, not before. Check first,
then insert. If you insert `x` first and the target happens to be `2 * x`, the number would match itself and
report a bogus pair of one element counted twice.

## The one-pass two-sum, in other languages

The pattern travels cleanly: a hash map from value to index, one loop, check-then-insert. Each language
brings its own map type and its own way of saying "not found."

[[codegroup One-Pass Two-Sum]]

```python
def two_sum(nums, target):
    seen = {}
    for i, x in enumerate(nums):
        need = target - x
        if need in seen:
            return (seen[need], i)
        seen[x] = i
    return None
```

```javascript
function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return null;
}
```

```typescript
function twoSum(nums: number[], target: number): [number, number] | null {
  const seen = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need)!, i];
    seen.set(nums[i], i);
  }
  return null;
}
```

```java
static int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        int need = target - nums[i];
        if (seen.containsKey(need)) return new int[]{seen.get(need), i};
        seen.put(nums[i], i);
    }
    return null;
}
```

```cpp
// returns {-1, -1} when no pair is found
std::pair<int, int> two_sum(const std::vector<int>& nums, int target) {
    std::unordered_map<int, int> seen;
    for (int i = 0; i < (int)nums.size(); i++) {
        int need = target - nums[i];
        auto it = seen.find(need);
        if (it != seen.end()) return {it->second, i};
        seen[nums[i]] = i;
    }
    return {-1, -1};
}
```

```go
func twoSum(nums []int, target int) (int, int, bool) {
    seen := make(map[int]int)
    for i, x := range nums {
        need := target - x
        if j, ok := seen[need]; ok {
            return j, i, true
        }
        seen[x] = i
    }
    return 0, 0, false
}
```

```rust
use std::collections::HashMap;

fn two_sum(nums: &[i32], target: i32) -> Option<(usize, usize)> {
    let mut seen: HashMap<i32, usize> = HashMap::new();
    for (i, &x) in nums.iter().enumerate() {
        let need = target - x;
        if let Some(&j) = seen.get(&need) {
            return Some((j, i));
        }
        seen.insert(x, i);
    }
    None
}
```

[[/codegroup]]

Every version trades a little memory (the `seen` map) for a lot of speed (`O(n²)` down to `O(n)`). That
trade - **remember more so you can scan less** - is the beating heart of nearly every hash-map speedup.

```quiz
[
  {
    "q": "In the one-pass two-sum, what is the \"complement\" the code looks up in the hash map?",
    "choices": ["The next number in the list", "target - x, the value that would complete the pair with the current number", "The largest number seen so far", "The index of x"],
    "answer": 1,
    "explain": "For a current number x, the only partner that reaches the target is target - x. Checking whether that complement was already seen finds the pair in one pass."
  },
  {
    "q": "Why must you check for the complement BEFORE inserting the current number into the map?",
    "choices": ["To save memory", "So a number isn't matched with itself when the target equals twice that number", "Because insertion is slower than lookup", "It doesn't matter which order you use"],
    "answer": 1,
    "explain": "If you insert x first and target == 2*x, the lookup would find x itself and report a fake pair. Check-then-insert prevents an element from pairing with itself."
  },
  {
    "q": "What does the hash-map two-sum gain over the two-pointer version?",
    "choices": ["It uses less memory", "It works on unsorted input without sorting, preserving the original indices", "It is O(log n)", "It never needs a loop"],
    "answer": 1,
    "explain": "The two-pointer approach needs sorted data (which scrambles indices). The hash map runs in one O(n) pass on unsorted input and returns the original positions."
  }
]
```
