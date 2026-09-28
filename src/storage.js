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
        try {
          const text = backend.getItem(key);
          if (text !== null) return JSON.parse(text);
          return null;
        } catch {
          // unreadable or corrupt: fall back to memory
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
