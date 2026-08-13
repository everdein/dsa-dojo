export function getBrowserStorage(browserWindow) {
  try {
    return browserWindow.localStorage;
  } catch {
    return null;
  }
}

export function createPlaybackClock(browserWindow) {
  let timerId = null;
  function stop() {
    if (timerId !== null) browserWindow.clearInterval(timerId);
    timerId = null;
  }
  return Object.freeze({
    start(tick, delay) {
      if (typeof tick !== "function") throw new TypeError("Playback clock requires a tick callback.");
      if (!Number.isFinite(delay) || delay < 0) throw new TypeError("Playback clock requires a nonnegative delay.");
      stop();
      timerId = browserWindow.setInterval(tick, delay);
    },
    stop,
    isRunning() {
      return timerId !== null;
    }
  });
}
