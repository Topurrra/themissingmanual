// Maps a category slug to its animated-explainer hub page under
// platform/web/static/explainers/ (served at /explainers/<file>). That's a
// separate, deliberately as-is standalone mini-site (its own theme picker,
// own visual language) - not built with this site's own Explainers.svelte
// system, so it's linked to rather than embedded inline.
//
// devops and infrastructure share one hub - the zip bundles both into a
// single "DevOps & Infrastructure" topic group, while this site splits them
// into two categories.
export const EXPLAINER_HUBS = {
  'version-control': 'index.dc.html',
  'programming-concepts': 'ProgConcepts.dc.html',
  networking: 'Networking.dc.html',
  databases: 'Databases.dc.html',
  'operating-systems': 'OperatingSystems.dc.html',
  architecture: 'Architecture.dc.html',
  security: 'Security.dc.html',
  devops: 'DevOps.dc.html',
  infrastructure: 'DevOps.dc.html',
  apis: 'APIs.dc.html',
  'ai-ml': 'AIML.dc.html',
  debugging: 'Debugging.dc.html',
  performance: 'Performance.dc.html',
  hardware: 'Hardware.dc.html',
  'data-analytics': 'DataAnalytics.dc.html',
  logic: 'Logic.dc.html'
};
