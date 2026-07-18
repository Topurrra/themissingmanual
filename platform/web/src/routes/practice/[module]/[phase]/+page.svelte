<script>
  import { page } from '$app/stores';
  import PracticeIde from '$lib/practice/PracticeIde.svelte';
  import Seo from '$lib/Seo.svelte';

  export let data;
  $: lesson = data.lesson;
  $: phase = data.phase;
  $: moduleParam = $page.params.module;
  $: jsonld = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: phase.title,
    description: phase.summary || '',
    learningResourceType: 'Interactive exercise',
    educationalLevel: phase.difficulty || undefined,
    isAccessibleForFree: true,
    provider: { '@type': 'Organization', name: 'The Missing Manual' },
    ...(phase.updated ? { dateModified: phase.updated } : {})
  };
</script>

<Seo title={`${phase.title} - Practice - The Missing Manual`} description={phase.summary || `Practice ${phase.title} in an in-browser graded lesson.`} type="article" {jsonld} />

{#key `${phase.guide_slug}/${phase.phase_no}`}
  <PracticeIde {lesson} lessonHtml={data.lessonHtml} {phase} guide={data.guide} phases={data.phases} {moduleParam} modules={data.modules} related={data.related} />
{/key}
