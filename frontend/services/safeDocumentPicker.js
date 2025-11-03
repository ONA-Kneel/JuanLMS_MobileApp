// A safe wrapper around expo-document-picker that avoids static imports.
// On environments where the native module isn't present, it fails gracefully.

let documentPickerModule = null;

function loadModuleIfNeeded() {
  if (documentPickerModule) return true;
  try {
    // Lazy load to avoid bundler resolving at build time when unavailable
    // eslint-disable-next-line global-require
    documentPickerModule = require('expo-document-picker');
    return true;
  } catch (e) {
    console.warn('DocumentPicker not available:', e?.message || e);
    documentPickerModule = null;
    return false;
  }
}

export async function pickDocumentAsync(options = {}) {
  if (!loadModuleIfNeeded()) {
    return { canceled: true }; // Graceful no-op
  }
  const picker = documentPickerModule;
  if (picker?.getDocumentAsync) {
    return picker.getDocumentAsync(options);
  }
  // Older API compatibility
  if (picker?.DocumentPicker?.getDocumentAsync) {
    return picker.DocumentPicker.getDocumentAsync(options);
  }
  return { canceled: true };
}

export function isDocumentPickerAvailable() {
  return loadModuleIfNeeded();
}


