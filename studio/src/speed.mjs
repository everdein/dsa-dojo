export const SPEED_CONTROL_MINIMUM = 350;
export const SPEED_CONTROL_MAXIMUM = 1400;

const speedControlTotal = SPEED_CONTROL_MINIMUM + SPEED_CONTROL_MAXIMUM;

/**
 * Player speed is stored as the delay between steps, where a smaller number is
 * faster. The control exposes the opposite, more intuitive direction: farther
 * right means faster.
 */
export function playbackDelayToControlValue(delay) {
  return invertWithinControl(delay);
}

export function controlValueToPlaybackDelay(value) {
  return invertWithinControl(value);
}

export function playbackSpeedLabel(delay) {
  if (delay <= 500) return "1.5×";
  if (delay >= 1100) return "0.75×";
  return "1×";
}

function invertWithinControl(value) {
  const normalized = Number.isFinite(value) ? value : 850;
  const clamped = Math.max(
    SPEED_CONTROL_MINIMUM,
    Math.min(normalized, SPEED_CONTROL_MAXIMUM)
  );
  return speedControlTotal - clamped;
}
