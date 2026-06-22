export const spikePalette = {
  background: '#0A0B0F',
  surface: '#12141A',
  card: '#1A1D26',
  primary: '#FFFFFF',
  secondary: '#8B8FA8',
  muted: '#4A4D5E',
  spike: '#00E5A0',
  spikeHover: '#00C98D',
  spikeGlow: 'rgba(0, 229, 160, 0.28)',
  danger: '#FF5A6B',
  warning: '#F5B84B',
  info: '#3BA7FF',
} as const

export const chartPalette = {
  spike: spikePalette.spike,
  danger: spikePalette.danger,
  warning: spikePalette.warning,
  info: spikePalette.info,
  line: '#3BA7FF',
  mutedGrid: '#2A2E3B',
  mutedText: '#8B8FA8',
  primary: spikePalette.primary,
} as const

export const sentimentColor = (sentiment: 'danger' | 'warning' | 'success' | 'info') => {
  if (sentiment === 'danger') return spikePalette.danger
  if (sentiment === 'warning') return spikePalette.warning
  if (sentiment === 'info') return spikePalette.info
  return spikePalette.spike
}
