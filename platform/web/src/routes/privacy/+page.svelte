<script>
  import Seo from '$lib/Seo.svelte';
</script>

<Seo
  title="Privacy - The Missing Manual"
  description="The Missing Manual's privacy approach: no accounts, no ads, no third-party trackers, and no selling data. What little is collected, and why." />

<article class="reader" style="max-width: 760px; margin: 0 auto;">
  <span class="eyebrow">Privacy</span>
  <h1 style="margin-top: 0.6rem;">Your privacy here</h1>
  <p class="tagline">
    No accounts, no ads, no third-party trackers, and nothing sold. The short
    version: this site tries to know as little about you as possible.
  </p>

  <p>
    The Missing Manual is free educational content. You can read every guide
    without signing in, and there is no advertising network or analytics
    company watching over your shoulder. Here is exactly what happens with data.
  </p>

  <h2>Stored in your browser, never sent to us</h2>
  <p>
    Your preferences and progress - theme, reading position, streaks, quiz and
    practice results, and any notes you make - are kept in your own browser's
    local storage on your device. That data never leaves your machine, and
    clearing your browser storage removes it.
  </p>

  <h2>Anonymous usage stats</h2>
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

  <h2>Optional push notifications</h2>
  <p>
    If - and only if - you opt in, the site stores a browser push subscription
    so it can send you a review reminder later. You can turn this off any time
    by unsubscribing, which removes the subscription.
  </p>

  <h2>AI Search and AI Tutor</h2>
  <p>
    When you use AI Search or the AI Tutor, your question is sent to a
    third-party AI provider to generate an answer, and may be logged to monitor
    usage and cost. Please do not put personal or sensitive information into
    those prompts.
  </p>

  <h2>Cookies</h2>
  <p>
    There are no advertising or tracking cookies for readers. A session cookie
    is used only for the site operator's own admin login, not for visitors.
  </p>

  <h2>Questions</h2>
  <p>
    Questions about any of this? Email
    <a href="mailto:topurianika96@gmail.com">topurianika96@gmail.com</a> or see
    the <a href="/contact">contact page</a>.
  </p>
</article>
