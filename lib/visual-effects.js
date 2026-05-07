export const visualEffectPresets = [
  {
    id: 'clean-film',
    name: 'Clean Film',
    description: 'Subtle cinematic color and grain for gallery photos.',
    tags: ['photo', 'subtle'],
    comfyWorkflow: 'clean-film-photo',
  },
  {
    id: 'event-poster',
    name: 'Event Poster',
    description: 'Turns an event image into a polished invite or poster.',
    tags: ['events', 'poster'],
    comfyWorkflow: 'event-poster',
  },
  {
    id: 'memory-card',
    name: 'Memory Card',
    description: 'Creates a soft framed memory image for shared moments.',
    tags: ['gallery', 'share'],
    comfyWorkflow: 'memory-card',
  },
]

export const visualUiPrinciples = [
  'Keep the default app interface practical and quiet.',
  'Use AI visuals as focused enhancements in gallery and event flows.',
  'Expose presets and simple controls instead of raw ComfyUI workflow details.',
  'Store generated media in Supabase so results remain available across devices.',
]
