<script>
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import Seo from '$lib/Seo.svelte';

  const tabs = [
    { id: 'contribute', label: 'Contribute', description: 'How to help improve The Missing Manual: suggest topics, fix mistakes, and write guides.' },
    { id: 'contact', label: 'Contact', description: 'How to reach The Missing Manual: report a problem, request a guide, fix a mistake, or ask a question about the free developer library.' },
    { id: 'privacy', label: 'Privacy', description: "The Missing Manual's privacy approach: no accounts, no ads, no third-party trackers, and no selling data. What little is collected, and why." }
  ];
  $: active = tabs.find((tab) => tab.id === $page.url.searchParams.get('tab')) || tabs[0];

  function onTabKey(event, index) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    goto(`/additional-info?tab=${tabs[next].id}`, { noScroll: true, keepFocus: true });
    document.getElementById(`info-tab-${tabs[next].id}`).focus();
  }
</script>

<Seo
  title={`${active.label} - Additional Info - The Missing Manual`}
  description={active.description}
  canonicalPath={active.id === 'contribute' ? '/additional-info' : `/additional-info?tab=${active.id}`}
/>

<div class="info-page">
  <header class="info-heading">
    <h1>Additional Info</h1>
    <p>Contribute to the manual, get in touch, or read about your privacy here.</p>
  </header>

  <div class="info-tabs" role="tablist" aria-label="Additional information">
    {#each tabs as tab, index}
      <a
        id={`info-tab-${tab.id}`}
        href={`/additional-info?tab=${tab.id}`}
        role="tab"
        aria-selected={active.id === tab.id}
        aria-controls="info-panel"
        tabindex={active.id === tab.id ? 0 : -1}
        data-sveltekit-noscroll
        data-sveltekit-keepfocus
        on:keydown={(event) => onTabKey(event, index)}
      >{tab.label}</a>
    {/each}
  </div>

  <div id="info-panel" class="info-panel" role="tabpanel" aria-labelledby={`info-tab-${active.id}`} tabindex="0">
    {#if active.id === 'contribute'}
      <article class="reader info-article">
        <h2 class="info-content-title">Help write the manual you wish you'd had.</h2>
        <p class="tagline">If you've ever explained something to a teammate and watched it click - that explanation belongs here.</p>

        <p>The Missing Manual is open and community-written. Every guide is plain Markdown, so contributing is mostly writing clearly and opening a pull request.</p>

        <h3>How it works</h3>
        <ol>
          <li>Guides live as Markdown in the <code>guides/</code> directory - one folder per guide, one file per phase.</li>
          <li>Each file carries simple front-matter: <code>title</code>, <code>category</code>, <code>difficulty</code>, and a one-line <code>summary</code>.</li>
          <li>Write the guide, open a pull request, and it goes through review for accuracy and voice.</li>
        </ol>

        <h3>The voice</h3>
        <p>This is the whole point, so it's worth getting right:</p>
        <ul>
          <li><strong>Human-friendly.</strong> Write like you're explaining it to a smart friend, not lecturing a room.</li>
          <li><strong>Example-driven.</strong> Show the real command, the real output, the real gotcha - not abstractions.</li>
          <li><strong>No hand-waving.</strong> If a thing is confusing, say <em>why</em> it's confusing, then make it un-confusing.</li>
          <li><strong>Phased.</strong> Build understanding in order; each phase earns the next.</li>
        </ul>

        <h3>What we need most</h3>
        <p><strong>Web Fundamentals</strong> is the newest category and still filling in - HTML, CSS, and how the browser actually works, ahead of any framework. If you can explain the DOM or the box model without hand-waving, that's the gap to fill.</p>
        <p>Beyond that: most categories are built out end to end but could go deeper. Advanced, "go deep" material past the beginner path is always welcome - the harder half of a topic, not just the first day of it. So are sharper cheat sheets and small build-along projects.</p>
        <p>Not sure what to write? Readers <a href="/request">request specific guides</a> that don't exist yet - ping us and we'll point you at one waiting in the queue.</p>

        <blockquote><p>You don't need to be famous. You need to have been confused by something, figured it out, and be willing to save the next person the trouble.</p></blockquote>
      </article>
    {:else if active.id === 'contact'}
      <article class="reader info-article">
        <h2 class="info-content-title">Get in touch</h2>
        <p class="tagline">
          The Missing Manual is a free, independent project. Feedback is genuinely
          read - it is how the guides get better.
        </p>

        <p>
          Whether you spotted a mistake, want a topic covered, or just have a question
          about something you read, here is how to reach the project.
        </p>

        <h3>Email</h3>
        <p>
          For anything at all, email
          <a href="mailto:topurianika96@gmail.com">topurianika96@gmail.com</a>.
          That reaches the person who writes and runs the site.
        </p>

        <h3>Report a problem or request a guide</h3>
        <ul>
          <li>
            <strong>Found something wrong?</strong> If a guide has an error, an
            unclear explanation, or a broken link, say so - corrections are welcome
            and get fixed quickly.
          </li>
          <li>
            <strong>Want a topic covered?</strong> Reader requests directly shape
            what gets written next. You can also add and vote on requests from the
            <a href="/backlog">What's next</a> page.
          </li>
          <li>
            <strong>Have a question?</strong> If a guide left you stuck, ask - the
            answer often becomes a clearer paragraph for the next reader.
          </li>
        </ul>

        <h3>Contribute</h3>
        <p>
          The project is open to help. If you would like to write, edit, or improve a
          guide, see <a href="/additional-info?tab=contribute">how to contribute →</a>
        </p>

        <h3>Source code</h3>
        <p>
          The site and its content live on GitHub at
          <a href="https://github.com/Topurrra/themissingmanual" rel="noopener noreferrer" target="_blank">github.com/Topurrra/themissingmanual</a>.
          Security reports can also follow the
          <a href="/.well-known/security.txt">security.txt</a> contact.
        </p>
      </article>
    {:else if active.id === 'privacy'}
      <article class="reader info-article">
        <h2 class="info-content-title">Your privacy here</h2>
        <p class="tagline">
          No accounts, no ads, no third-party trackers, and nothing sold. The short
          version: this site tries to know as little about you as possible.
        </p>

        <p>
          The Missing Manual is free educational content. You can read every guide
          without signing in, and there is no advertising network or analytics
          company watching over your shoulder. Here is exactly what happens with data.
        </p>

        <h3>Stored in your browser, never sent to us</h3>
        <p>
          Your preferences and progress - theme, reading position, streaks, quiz and
          practice results, and any notes you make - are kept in your own browser's
          local storage on your device. That data never leaves your machine, and
          clearing your browser storage removes it.
        </p>

        <h3>Anonymous usage stats</h3>
        <p>
          To see which guides actually help, the site records coarse, anonymous
          events like page views and searches. It is built to be un-trackable:
        </p>
        <ul>
          <li>Your raw IP address and browser User-Agent are <strong>never stored</strong>.</li>
          <li>
            Instead, a one-way hash is derived from them that <strong>rotates every
            day</strong>, so the same visitor cannot be followed across days.
          </li>
          <li>
            Only coarse signals are kept - a device class (mobile / tablet /
            desktop), the path viewed, and the host of the referring site.
          </li>
        </ul>
        <p>None of this identifies you, and none of it is shared or sold.</p>

        <h3>Optional push notifications</h3>
        <p>
          If - and only if - you opt in, the site stores a browser push subscription
          so it can send you a review reminder later. You can turn this off any time
          by unsubscribing, which removes the subscription.
        </p>

        <h3>AI Search and AI Tutor</h3>
        <p>
          When you use AI Search or the AI Tutor, your question is sent to a
          third-party AI provider to generate an answer, and may be logged to monitor
          usage and cost. Please do not put personal or sensitive information into
          those prompts.
        </p>

        <h3>Cookies</h3>
        <p>
          There are no advertising or tracking cookies for readers. A session cookie
          is used only for the site operator's own admin login, not for visitors.
        </p>

        <h3>Questions</h3>
        <p>
          Questions about any of this? Email
          <a href="mailto:topurianika96@gmail.com">topurianika96@gmail.com</a> or see
          the <a href="/additional-info?tab=contact">contact page</a>.
        </p>
      </article>
    {/if}
  </div>
</div>

<style>
  .info-page { max-width: 760px; margin: 0 auto; }
  .info-heading { margin-bottom: 1.75rem; }
  .info-heading h1 { margin: 0 0 0.65rem; font-size: 2.5rem; line-height: 1.1; letter-spacing: -0.035em; }
  .info-heading p { margin: 0; max-width: 60ch; color: var(--muted); font-size: 1rem; line-height: 1.65; }
  .info-tabs { display: flex; gap: 1rem; border-bottom: 1px solid var(--line); margin-bottom: 2.5rem; }
  .info-tabs a { display: inline-flex; align-items: center; justify-content: center; min-height: 48px; padding: 0.7rem 0.5rem; border-bottom: 2px solid transparent; margin-bottom: -1px; color: var(--muted); font-size: 0.95rem; font-weight: 500; text-decoration: none; }
  .info-tabs a:hover { color: var(--ink); }
  .info-tabs a[aria-selected="true"] { color: var(--accent-strong); border-bottom-color: var(--accent-strong); }
  .info-panel { min-width: 0; }
  .info-article { max-width: none; margin: 0; }
  .info-panel .info-content-title { margin: 0 0 0.85rem; font-size: 1.85rem; line-height: 1.2; letter-spacing: -0.025em; text-wrap: balance; }
  .info-article h3 { margin: 2rem 0 0.6rem; font-size: 1.35rem; line-height: 1.3; }
  @media (max-width: 640px) {
    .info-heading h1 { font-size: 2.25rem; }
    .info-tabs { gap: 0.75rem; margin-bottom: 2rem; }
    .info-tabs a { flex: 1; padding-right: 0.25rem; padding-left: 0.25rem; }
    .info-panel .info-content-title { font-size: 1.6rem; }
  }
</style>
