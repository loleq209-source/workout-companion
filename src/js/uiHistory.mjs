/**
 * Browser & Android WebView Back-Button History Coordinator.
 * Pushes lightweight same-document history entries for overlays/card views so hardware Back
 * closes the top modal or returns from Screen 2 -> Screen 1 before triggering APK exit.
 */
export function createUiHistory(onBackLayer) {
  const stack = [];
  let pendingBacks = 0;

  function canUseHistory() {
    return typeof window !== "undefined" && typeof history !== "undefined" && typeof history.pushState === "function";
  }

  function push(id) {
    if (!id || stack[stack.length - 1] === id) return;
    stack.push(id);
    if (canUseHistory()) {
      try {
        history.pushState({ wcLayer: id }, "");
      } catch (e) {}
    }
  }

  function pop(id) {
    if (!id || stack.length === 0) return;
    if (stack[stack.length - 1] !== id) {
      const idx = stack.lastIndexOf(id);
      if (idx !== -1) stack.splice(idx, 1);
      return;
    }
    stack.pop();
    if (canUseHistory() && typeof history.back === "function") {
      pendingBacks++;
      try {
        history.back();
      } catch (e) {
        pendingBacks = Math.max(0, pendingBacks - 1);
      }
    }
  }

  function replace(oldId, newId) {
    clearTag(oldId);
    if (!newId) return;
    if (stack[stack.length - 1] !== newId) {
      stack.push(newId);
    }
    if (canUseHistory() && typeof history.replaceState === "function") {
      try {
        history.replaceState({ wcLayer: newId }, "");
      } catch (e) {}
    }
  }

  function clearTag(id) {
    for (let i = stack.length - 1; i >= 0; i--) {
      if (stack[i] === id) stack.splice(i, 1);
    }
  }

  function handlePopState() {
    if (pendingBacks > 0) {
      pendingBacks--;
      return;
    }
    const popped = stack.pop() || null;
    if (typeof onBackLayer === "function") {
      onBackLayer(popped);
    }
  }

  function attach() {
    if (typeof window !== "undefined") {
      window.addEventListener("popstate", handlePopState);
    }
  }

  return {
    push,
    pop,
    replace,
    clearTag,
    attach,
    getDepth: () => stack.length
  };
}
