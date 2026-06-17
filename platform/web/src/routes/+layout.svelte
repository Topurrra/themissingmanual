<script>
  import '../app.css';
</script>

<header class="site-header">
  <div class="bar">
    <a href="/" style="font-weight:700">The Missing Manual</a>
    <form method="GET" action="/search" class="searchbar" style="max-width:380px;flex:1">
      <input type="search" name="q" placeholder="Search… e.g. undo a commit" />
      <button type="submit">Go</button>
    </form>
  </div>
</header>

<main>
  <slot />
</main>
