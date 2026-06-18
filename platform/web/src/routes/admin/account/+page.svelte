<script>
  import { adminPost } from '$lib/admin.js';

  let current = '';
  let next = '';
  let confirm = '';
  let err = '';
  let ok = '';
  let busy = false;

  async function changePassword() {
    err = '';
    ok = '';
    // Client-side guards (the API also enforces these: 401 wrong current, 400 < 8 chars).
    if (next !== confirm) {
      err = 'New password and confirmation don’t match.';
      return;
    }
    if (next.length < 8) {
      err = 'New password must be at least 8 characters.';
      return;
    }
    busy = true;
    try {
      await adminPost('/password', { current_password: current, new_password: next });
      current = '';
      next = '';
      confirm = '';
      ok = 'Password changed. Your session stays signed in.';
    } catch (e) {
      err = e.message;
    } finally {
      busy = false;
    }
  }
</script>

<svelte:head><title>Admin · Account</title></svelte:head>

<h1 class="admin-h1">Account</h1>

<form class="acct-form" on:submit|preventDefault={changePassword}>
  <h2 class="admin-h2">Change password</h2>

  <label class="acct-field">
    <span>Current password</span>
    <input type="password" autocomplete="current-password" bind:value={current} required />
  </label>

  <label class="acct-field">
    <span>New password</span>
    <input type="password" autocomplete="new-password" bind:value={next} minlength="8" required />
  </label>

  <label class="acct-field">
    <span>Confirm new password</span>
    <input type="password" autocomplete="new-password" bind:value={confirm} minlength="8" required />
  </label>

  {#if err}<p class="admin-err">{err}</p>{/if}
  {#if ok}<p class="admin-note">{ok}</p>{/if}

  <div class="acct-actions">
    <button type="submit" class="admin-btn primary" disabled={busy}>
      <i class="ti ti-key" aria-hidden="true"></i> {busy ? 'Saving…' : 'Change password'}
    </button>
  </div>
</form>
