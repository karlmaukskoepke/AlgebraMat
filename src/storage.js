// A small wrapper around localStorage. Every read and write is wrapped in
// try/catch; if storage is missing or throws (private windows, blocked site
// data), the site keeps working from memory and `available` is false.

export function createStore(key, backend = defaultBackend()) {
  let memory = null;
  let available = false;
  try {
    const probe = `${key}.__probe`;
    backend.setItem(probe, '1');
    backend.removeItem(probe);
    available = true;
  } catch {
    available = false;
  }

  return {
    get available() {
      return available;
    },
    load() {
      if (available) {
        let text = null;
        try {
          text = backend.getItem(key);
          if (text !== null) return JSON.parse(text);
          return null;
        } catch {
          // unreadable or corrupt: keep a copy of what was there (the next save would overwrite it), and fall back to memory
          if (text !== null) {
            try { if (backend.getItem(`${key}.backup`) === null) backend.setItem(`${key}.backup`, text); } catch { /* nothing more to do */ }
          }
        }
      }
      return memory === null ? null : JSON.parse(memory);
    },
    save(value) {
      memory = JSON.stringify(value);
      if (!available) return false;
      try {
        backend.setItem(key, memory);
        return true;
      } catch {
        available = false;
        return false;
      }
    },
  };
}

function defaultBackend() {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}
