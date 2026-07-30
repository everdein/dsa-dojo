export function readLessonIdFromHash(hash, lessonIds) {
  const match = String(hash ?? "").match(/^#lesson=(.+)$/);
  if (!match) return null;

  try {
    const id = decodeURIComponent(match[1]);
    return lessonIds.includes(id) ? id : null;
  } catch {
    return null;
  }
}

export function lessonHash(id) {
  return `#lesson=${encodeURIComponent(id)}`;
}
