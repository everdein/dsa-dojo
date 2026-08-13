import { removeShareStateFromUrl, shareStateUrl } from "./shareable-state.mjs";

export function createShareController({ browserWindow, browserDocument, browserNavigator, elements, getSnapshot }) {
  if (typeof getSnapshot !== "function") throw new TypeError("Share controller requires a snapshot provider.");

  function clearUrlState() {
    const current = new URL(browserWindow.location.href);
    if (!current.searchParams.has("share")) return;
    const next = removeShareStateFromUrl(current);
    browserWindow.history.replaceState(null, "", `${next.pathname}${next.search}${next.hash}`);
    elements.status.textContent = "";
  }

  async function shareCurrentState() {
    const { state, title } = getSnapshot();
    const base = new URL(browserWindow.location.pathname, browserWindow.location.origin);
    const url = shareStateUrl(base, state).href;
    const shareData = { title: `${title} · DSA Dojo`, text: "Continue from this exact algorithm state.", url };
    elements.status.textContent = "";
    try {
      const canUseNativeShare = typeof browserNavigator.share === "function"
        && (typeof browserNavigator.canShare !== "function" || browserNavigator.canShare(shareData));
      if (canUseNativeShare) {
        await browserNavigator.share(shareData);
        elements.status.textContent = "State shared.";
      } else {
        await copyShareUrl(url);
        elements.status.textContent = "Link copied — input and step included.";
      }
    } catch (error) {
      if (error?.name === "AbortError") return;
      elements.status.textContent = "Could not share this state. Try again.";
    }
  }

  async function copyShareUrl(url) {
    if (browserNavigator.clipboard?.writeText) {
      try {
        await browserNavigator.clipboard.writeText(url);
        return;
      } catch {
        // Restricted browsers can expose Clipboard without allowing writes.
      }
    }
    const input = browserDocument.createElement("textarea");
    input.value = url;
    input.setAttribute("readonly", "");
    input.className = "sr-only";
    browserDocument.body.append(input);
    input.select();
    const copied = browserDocument.execCommand?.("copy");
    input.remove();
    if (!copied) throw new Error("Clipboard unavailable.");
  }

  function renderRestoreNotice(error) {
    elements.notice.hidden = !error;
    elements.noticeCopy.textContent = error ?? "";
  }

  return Object.freeze({ clearUrlState, renderRestoreNotice, shareCurrentState });
}
