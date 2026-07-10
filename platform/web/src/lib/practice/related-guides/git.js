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
// Lesson 6 (stash) maps onto git-explained-like-a-human's "Everyday Commands"
// phase, which has a full `git stash` section (same "shelve it for a minute"
// framing, same stash/pop example).
// Lesson 7 (.gitignore) maps onto gitignore-lfs-submodules's "Ignoring,
// Untracking, and LFS" phase - the exact-match deep dive on writing
// .gitignore patterns this lesson only scratches the surface of.
// Lesson 8 (revert) maps onto git-disaster-recovery's "Undoing What You've
// Already Pushed" phase, which walks `git revert` as the safe public undo -
// same command, same "new commit that cancels the old one out" framing.
export const RELATED = {
  1: 'git-from-zero#2',
  2: 'git-from-zero#2',
  3: 'git-with-other-people#1',
  4: 'git-with-other-people#1',
  5: 'git-with-other-people#2',
  6: 'git-explained-like-a-human#2',
  7: 'gitignore-lfs-submodules#2',
  8: 'git-disaster-recovery#3'
};
