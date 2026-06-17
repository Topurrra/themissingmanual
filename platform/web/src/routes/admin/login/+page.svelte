<script>
  import { enhance } from '$app/forms';
  export let form;
</script>

<svelte:head><title>Admin · Sign in</title></svelte:head>

<div class="login-wrap">
  <form method="POST" action="?/login" use:enhance class="login-card">
    <h1>Admin</h1>
    <p class="login-sub">Sign in to manage content.</p>
    <input type="password" name="password" placeholder="Password" autocomplete="current-password" required />
    {#if form?.error}<p class="login-err">{form.error}</p>{/if}
    <button type="submit">Sign in</button>
  </form>
</div>
