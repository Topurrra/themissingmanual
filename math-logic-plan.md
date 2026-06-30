# Logic & Math (& later Physics) - Plan

The foundation layer beneath everything else on the site. Where the rest of The Missing Manual
demystifies the machine, these demystify the **thinking** the machine is built on. Two new
top-level categories now (**Logic**, **Math**); **Physics** parked as pillar #3 for later.

## Why this exists (the north star)
- **Math/logic are not the enemy.** They're the language reality is written in (Galileo, Kepler,
  Wigner's "unreasonable effectiveness of mathematics"). Most people fear math because it was taught
  as disconnected rituals to memorize - a *teaching* failure, not a personal one. We fix the teaching.
- **Anti-manipulation.** Numeracy + clear reasoning are what make a person hard to fool (by ads,
  politics, bad data, scams). Teaching people to think is the mission.
- **The AI-era argument (grounded version).** AI now does *coding* (the typing) well and *programming*
  (the thinking - deciding what's correct, what to build, what doesn't exist yet) poorly. The durable
  human skill was never syntax; it's reasoning and specification. The engagement/attention economy
  rewards making tools effortless and sticky, and effortless tools let unused skills atrophy
  (GPS→spatial memory, the "Google effect"). We give people the on-ramp to keep thinking. Frame this
  as **incentives + measurable effects**, never as an unprovable conspiracy - a verifiable premise is
  bulletproof; "they're doing it on purpose" can be dismissed in a sentence.
- **Lamport's thesis** is the spine: *coding is to programming what typing is to writing.* Think
  first, in precise terms. His formal-methods teachings are the eventual capstone (in Logic).

## Decisions (locked 2026-06-24)
- **Scope:** *Foundations core first.* Ship the complete Logic category + Math foundations as a
  polished first wave; heavier Math rungs (discrete, linear algebra, calculus) + the formal-methods
  capstone come as clearly-scoped later waves.
- **Audience framing:** *Hybrid.* Teach each idea with universal, real-world intuition first, then
  close with a short **"For builders"** tie-in connecting it to code/CS (sets→types, logic→`if`,
  proof→recursion). Serves curious humans and developers without alienating either.

## Two categories, one clean dividing line
Splitting Logic out from Math is deliberate: logic sits *underneath* both math and code (every `if`,
boolean, `WHERE`, type check), and it carries the critical-thinking mission better than arithmetic.
**Risk = overlap** (sets, functions, proof touch both). **Rule: one source of truth per concept,
cross-linked.**
- **Logic** = *reasoning about statements* - is this argument valid? what follows from what?
- **Math** = *the objects you reason about* - numbers, sets, structures, quantities.
- So **sets/functions live in Math**; **proof techniques + quantifiers live in Logic**. A Math guide
  needing a proof links to Logic; a Logic guide needing sets links to Math. No duplication.

## Pedagogical rules (the "how" - applies to every guide)
1. **Intuition before notation.** Plain-language idea first; reveal symbols as shorthand for what they
   already understand. (Notation is the #1 barrier.)
2. **Every concept earns its place with a real problem** - the mess that existed before the idea, then
   how it solves it. Motivation before mechanics.
3. **Hybrid close:** a short "For builders" box tying the idea to code/CS.
4. **Interactive where it counts** - these subjects are perfect for the platform's playgrounds/quizzes
   and visual widgets (a slider showing a derivative as a slope; a truth-table toggler).
5. **Honest rigor** - precise but kind; no lies-to-children you have to unteach later.
6. Standard voice + format + verified gate, exactly like every other category.

## Build/registration notes
- Add both categories to `platform/core/src/categories.rs` DEFS (slug must equal the `guides/<slug>/`
  subfolder and each guide's `category:` frontmatter). Register **with** the first guides so no empty
  category page ships. Physics added later.
- Per guide: write `_guide.md` myself → per-phase subagents with conventions + facts → review gate
  (LF, banned words, validator, `cargo test -p content-core --test real_guides`).

---

## 🧠 LOGIC - *how to reason clearly and rigorously*  (WAVE 1: full category)
- [x] 1. What Logic Actually Is - reasoning as the root of clear thinking; statements, truth, validity vs. persuasion **(SHIPPED 2026-06-25 - 3 phases: Logic Is the Skill Under Everything / Statements, Truth & Validity / The Three Ways We Reason)**
- [x] 2. Propositional Logic - AND / OR / NOT, truth tables · *builders:* booleans **(SHIPPED 2026-06-25 - Connectives / Truth Tables / Equivalences & De Morgan)**
- [x] 3. Implication & Conditionals - "if→then", converse/inverse/contrapositive (the part everyone gets backwards) · *builders:* guard clauses, short-circuiting **(SHIPPED 2026-06-25 - What "If P Then Q" Means / Converse·Inverse·Contrapositive / Necessary vs Sufficient)**
- [x] 4. Predicate Logic & Quantifiers - "for all" / "there exists" (links to Math: sets) · *builders:* `all()`/`any()`, validation **(SHIPPED 2026-06-25 - Predicates / Quantifiers ∀∃ / Negating & Nesting)**
- [x] 5. Boolean Algebra & Logic Gates - logic made physical · *builders:* bitwise ops → CPUs **(SHIPPED 2026-06-25 - The Laws / Logic Gates / From Gates to a Computer [half-adder])**
- [x] 6. What a Proof Is - induction, contradiction, the honest rules · *builders:* recursion, invariants **(SHIPPED 2026-06-25 - What a Proof Actually Is / Main Techniques / Proof by Induction)**
- [x] 7. Critical Thinking & Fallacies - valid reasoning vs. manipulation; the anti-manipulation guide (broadest appeal) **(SHIPPED 2026-06-25 - What a Fallacy Is / The Fallacies You'll Meet Most / Thinking Clearly Toolkit) - LOGIC CATEGORY COMPLETE (7 guides)**

## 🔢 MATH - *the language reality is written in*  (WAVE 1: foundations core)
- [x] 1. Why Math Isn't Your Enemy + How to Read Math Notation - the manifesto + the notation unlock **(SHIPPED 2026-06-25 - 3 phases: You Were Lied To About Math / How to Read Math Notation / The Mindset That Makes Math Click)**
- [x] 2. Sets, Relations & Functions - the shared vocabulary of everything · *builders:* types, maps, relations→tables **(SHIPPED 2026-06-25 - Sets / Relations & Functions / Why This Is the Vocabulary of Everything)**
- [ ] 3. Numbers & Number Systems - binary, hex, modular arithmetic · *builders:* the math of computers
- [x] 4. Counting & Combinatorics - the gateway to probability and complexity **(SHIPPED 2026-06-25 - Multiplication Principle / Permutations & Combinations / Why Counting Matters)**
- [x] 5. Probability & Statistics - the everyday anti-manipulation superpower · *builders:* sampling, A/B tests, ML **(SHIPPED 2026-06-25 - Measuring Uncertainty / Statistics That Don't Lie / How Statistics Mislead You) - MATH FOUNDATIONS COMPLETE**

> **WAVE 1 COMPLETE (2026-06-25).** Logic category = 7 guides (21 phases); Mathematics foundations = 5 guides (15 phases). Both categories lead the site nav. All gate-clean, content-core tests green. REMAINING (later waves): Math advanced rungs (#6 Discrete Math & Graphs, #7 Linear Algebra, #8 Calculus Intuitively, #9 How to Think Like a Mathematician); the Logic→Lamport capstone (#8 Formal Methods & Specification); then Physics as pillar #3.

### MATH - later wave (advanced rungs)
- [ ] 6. Discrete Math & Graphs - the native math of CS · *builders:* data structures, networks
- [ ] 7. Linear Algebra - vectors & matrices · *builders:* graphics, ML, embeddings
- [ ] 8. Change & Calculus, Intuitively - limits/derivatives/integrals as ideas · *builders:* optimization, gradient descent
- [ ] 9. How to Think Like a Mathematician - Pólya problem-solving, abstraction

### LOGIC - later wave (the Lamport capstone)
- [ ] 8. Formal Methods & Specification - state machines, invariants, "specify before you code"; gentle TLA+ on-ramp. The bridge that ties Logic+Math back to building correct software.

### ⚛️ PHYSICS - pillar #3, later
Parked. The "math made real" payoff once Logic + Math exist (motion, energy, fields, the constants
that show up everywhere). Scope TBD.

---

## Suggested kickoff
Open both categories with their flagship "mindset" guide so neither ships empty and the mission is
clear from guide one: **Logic #1 "What Logic Actually Is"** + **Math #1 "Why Math Isn't Your Enemy"**.
Then fill Logic 2→7 and Math 2→5.

**Status:** plan approved 2026-06-24 (2 categories; foundations-first; hybrid framing). Nothing built yet.
