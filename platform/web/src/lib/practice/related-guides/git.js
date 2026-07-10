// Hand-picked against guides/version-control content (not guessed from titles) -
// this category is one of the site's most complete, so every lesson maps.
// Lessons 1-2 (first commit, second commit + log) map onto git-from-zero's
// "Your First Repository" phase, which teaches init/add/commit/log/status from
// scratch with this exact example (a hello.txt-style file, the same
// edit->add->commit loop).
// Lesson 3 (branch + checkout) maps onto git-with-other-people's
// "Feature-Branch Workflow" phase - same `git checkout -b <name>` move, same
// "isolate your work from main" framing.
// Lesson 4 (merge) maps onto the same phase too - it explicitly walks the
// branch -> commit -> merge loop this lesson practices (see its `git merge`
// example and mermaid diagram).
// Lesson 5 (reading git status) maps onto git-with-other-people's "Staying in
// Sync" phase, whose team-sync cheat-card and `git status` example is the
// deeper, real-world version of the same skill.
export const RELATED = {
  1: 'git-from-zero#2',
  2: 'git-from-zero#2',
  3: 'git-with-other-people#1',
  4: 'git-with-other-people#1',
  5: 'git-with-other-people#2'
};
