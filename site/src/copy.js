// Falls back to a selection copy where the async clipboard is unavailable or denied.
export async function copyText(text, node) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const range = document.createRange();
    range.selectNodeContents(node);
    const selection = getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    const copied = document.execCommand("copy");
    if (copied) selection.removeAllRanges();
    return copied;
  }
}
