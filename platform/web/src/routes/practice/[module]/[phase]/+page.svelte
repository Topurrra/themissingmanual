<script>
  import { page } from '$app/stores';
  import PracticeIde from '$lib/practice/PracticeIde.svelte';

  export let data;
  $: lesson = data.lesson;
  $: phase = data.phase;
  $: moduleParam = $page.params.module;
</script>

<svelte:head><title>{phase.title} - Practice - The Missing Manual</title></svelte:head>

{#key `${phase.guide_slug}/${phase.phase_no}`}
  <PracticeIde {lesson} lessonHtml={data.lessonHtml} {phase} guide={data.guide} phases={data.phases} {moduleParam} modules={data.modules} related={data.related} />
{/key}
