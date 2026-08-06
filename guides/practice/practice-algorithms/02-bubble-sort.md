---
title: "Bubble sort"
guide: practice-algorithms
phase: 2
summary: "Sort an array by repeatedly swapping out-of-order neighbours, returning a new array and leaving the input untouched."
tags: [algorithms, bubble-sort, sorting, javascript]
difficulty: beginner
synonyms:
  - bubble sort javascript
  - sort an array without mutating
  - swap-based sorting
  - bubble sort new array
updated: 2026-08-06
---

# Bubble sort

Bubble sort is the first sorting algorithm most people meet, and it is worth
writing once by hand. The idea is simple: walk the array comparing each value
with its neighbour, and swap the two whenever they are out of order. One full
pass pushes the largest value all the way to the end - it "bubbles" up. Do
enough passes and the whole array is sorted.

There is one trap here that has nothing to do with sorting: mutation. If you
sort the array you were handed, every other part of the program holding that
same array sees it change underneath them. So make a copy first and sort the
copy, leaving the caller's array exactly as it was.

**Your task:** write `bubbleSort(input)` that returns a **new** array with the
numbers sorted in ascending order. The array you were given must be unchanged
afterwards.

**You'll practice:**

- Swapping neighbouring elements until an array is ordered
- Copying an input so you never mutate the caller's data

```lesson
{
  "language": "js",
  "starterCode": "// Return a NEW array with input's numbers sorted in ascending order.\n// Do not modify the input array itself.\nfunction bubbleSort(input) {\n  // your code here\n  return [];\n}",
  "solution": "function bubbleSort(input) {\n  const arr = input.slice();\n  for (let i = 0; i < arr.length - 1; i++) {\n    for (let j = 0; j < arr.length - 1 - i; j++) {\n      if (arr[j] > arr[j + 1]) {\n        const tmp = arr[j];\n        arr[j] = arr[j + 1];\n        arr[j + 1] = tmp;\n      }\n    }\n  }\n  return arr;\n}",
  "hints": [
    "Copy the input first with input.slice() so the original array is never touched, then sort the copy.",
    "Walk neighbouring pairs and swap any that are out of order; repeat the whole pass until nothing needs swapping.",
    "After each full pass the largest remaining value has 'bubbled' to the end, so the next pass can stop one step earlier."
  ],
  "tests": [
    {
      "name": "leaves an already-sorted array sorted",
      "code": "if (JSON.stringify(bubbleSort([1, 2, 3, 4])) !== '[1,2,3,4]') throw new Error('bubbleSort([1,2,3,4]) should be [1,2,3,4]');"
    },
    {
      "name": "sorts a reversed array",
      "code": "if (JSON.stringify(bubbleSort([5, 4, 3, 2, 1])) !== '[1,2,3,4,5]') throw new Error('bubbleSort([5,4,3,2,1]) should be [1,2,3,4,5]');"
    },
    {
      "name": "handles duplicate values",
      "code": "if (JSON.stringify(bubbleSort([3, 1, 2, 1, 3])) !== '[1,1,2,3,3]') throw new Error('bubbleSort([3,1,2,1,3]) should be [1,1,2,3,3]');"
    },
    {
      "name": "handles an empty array",
      "code": "if (JSON.stringify(bubbleSort([])) !== '[]') throw new Error('bubbleSort([]) should be []');"
    },
    {
      "name": "does not mutate the input array",
      "code": "const inp = [3, 1, 2]; bubbleSort(inp); if (JSON.stringify(inp) !== '[3,1,2]') throw new Error('bubbleSort must not modify the array passed in');"
    }
  ]
}
```
