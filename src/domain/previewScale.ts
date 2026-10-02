export const A4_PREVIEW_WIDTH = 794;
export const MIN_PREVIEW_ZOOM = 35;
export const MAX_FIT_ZOOM = 100;

export function calculateFitZoom(
  stageWidth: number,
  paddingLeft = 0,
  paddingRight = 0,
  breathingRoom = 16,
): number {
  if (!Number.isFinite(stageWidth) || stageWidth <= 0) return MAX_FIT_ZOOM;

  const horizontalInsets = [paddingLeft, paddingRight, breathingRoom]
    .map((value) => (Number.isFinite(value) ? Math.max(0, value) : 0))
    .reduce((total, value) => total + value, 0);
  const availableWidth = Math.max(1, stageWidth - horizontalInsets);
  const percentage = Math.floor((availableWidth / A4_PREVIEW_WIDTH) * 100);

  return Math.max(MIN_PREVIEW_ZOOM, Math.min(MAX_FIT_ZOOM, percentage));
}
