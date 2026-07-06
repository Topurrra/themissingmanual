<script>
  import Seo from '$lib/Seo.svelte';
</script>

<Seo
  title="Contribute - The Missing Manual"
  description="How to help improve The Missing Manual: suggest topics, fix mistakes, and write guides." />

<article class="reader" style="max-width: 760px; margin: 0 auto;">
  <span class="eyebrow">Contribute</span>
  <h1 style="margin-top: 0.6rem;">Help write the manual you wish you'd had.</h1>
  <p class="tagline">If you've ever explained something to a teammate and watched it click - that explanation belongs here.</p>

  <p>The Missing Manual is open and community-written. Every guide is plain Markdown, so contributing is mostly writing clearly and opening a pull request.</p>

  <h2>How it works</h2>
  <ol>
    <li>Guides live as Markdown in the <code>guides/</code> directory - one folder per guide, one file per phase.</li>
    <li>Each file carries simple front-matter: <code>title</code>, <code>category</code>, <code>difficulty</code>, and a one-line <code>summary</code>.</li>
    <li>Write the guide, open a pull request, and it goes through review for accuracy and voice.</li>
  </ol>

  <h2>The voice</h2>
  <p>This is the whole point, so it's worth getting right:</p>
  <ul>
    <li><strong>Human-friendly.</strong> Write like you're explaining it to a smart friend, not lecturing a room.</li>
    <li><strong>Example-driven.</strong> Show the real command, the real output, the real gotcha - not abstractions.</li>
    <li><strong>No hand-waving.</strong> If a thing is confusing, say <em>why</em> it's confusing, then make it un-confusing.</li>
    <li><strong>Phased.</strong> Build understanding in order; each phase earns the next.</li>
  </ul>

  <h2>What we need most</h2>
  <p><strong>Web Fundamentals</strong> is the newest category and still filling in - HTML, CSS, and how the browser actually works, ahead of any framework. If you can explain the DOM or the box model without hand-waving, that's the gap to fill.</p>
  <p>Beyond that: most categories are built out end to end but could go deeper. Advanced, "go deep" material past the beginner path is always welcome - the harder half of a topic, not just the first day of it. So are sharper cheat sheets and small build-along projects.</p>
  <p>Not sure what to write? Readers <a href="/request">request specific guides</a> that don't exist yet - ping us and we'll point you at one waiting in the queue.</p>

  <blockquote><p>You don't need to be famous. You need to have been confused by something, figured it out, and be willing to save the next person the trouble.</p></blockquote>
</article>
