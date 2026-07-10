// Practice lessons: each /practice phase's Markdown contains one ```lesson fenced
// JSON block (schema documented in WRITERMANUAL.md). Mirrors parseQuizBlock /
// parseExerciseBlock in $lib/quizzes.js / $lib/exercises.js exactly (regex the raw
// markdown, JSON.parse, null on anything invalid).
export function parseLessonBlock(markdown) {
  if (!markdown) return null;
  const m = markdown.match(/```lesson\s*\n([\s\S]*?)```/i);
  if (!m) return null;
  try {
    const data = JSON.parse(m[1].trim());
    if (data && typeof data === 'object' && data.language && data.starterCode) return data;
  } catch (e) {}
  return null;
}

// Strips the rendered ```lesson fence out of phase.html. The backend renders it as
// a syntax-highlighted <pre><code class="language-lesson">...</code></pre> (comrak +
// syntect, tok-* spans around the escaped JSON) - the IDE's left panel renders the
// lesson from the parsed JSON instead, so this raw block would just be noise.
export function stripLessonHtml(html) {
  if (!html) return html;
  return html.replace(/<pre><code class="language-lesson">[\s\S]*?<\/code><\/pre>\n?/i, '');
}
