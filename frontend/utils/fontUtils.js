/**
 * Font utility functions to prevent createTextInstance errors
 * by providing safe font family fallbacks
 */

/**
 * Get a safe font family with fallback to system fonts
 * @param {string} fontFamily - The desired font family
 * @returns {string} - Safe font family or system fallback
 */
export const getSafeFontFamily = (fontFamily) => {
  // If fonts failed to load globally, use system fonts
  if (typeof global !== 'undefined' && global.fontsFailed) {
    return getSystemFontFallback(fontFamily);
  }
  
  // If no font family specified, return system default
  if (!fontFamily) {
    return 'System';
  }
  
  // Return the requested font family if fonts are loaded
  return fontFamily;
};

/**
 * Get system font fallback based on the requested font family
 * @param {string} fontFamily - The requested font family
 * @returns {string} - System font fallback
 */
const getSystemFontFallback = (fontFamily) => {
  const fontMap = {
    'Poppins-Bold': 'System',
    'Poppins-SemiBold': 'System',
    'Poppins-Medium': 'System',
    'Poppins-Regular': 'System',
    'Poppins-Light': 'System',
    'Poppins-Thin': 'System',
  };
  
  return fontMap[fontFamily] || 'System';
};

/**
 * Create a safe style object with font family fallback
 * @param {Object} style - The style object
 * @returns {Object} - Style object with safe font family
 */
export const createSafeTextStyle = (style) => {
  if (!style) {
    return { fontFamily: 'System' };
  }
  
  if (!style.fontFamily) {
    return { ...style, fontFamily: 'System' };
  }
  
  return {
    ...style,
    fontFamily: getSafeFontFamily(style.fontFamily),
  };
};

/**
 * Create a safe StyleSheet with font fallbacks
 * @param {Object} styles - StyleSheet object
 * @returns {Object} - StyleSheet with safe font families
 */
export const createSafeStyleSheet = (styles) => {
  const safeStyles = {};
  
  for (const [key, style] of Object.entries(styles)) {
    if (style && typeof style === 'object' && style.fontFamily) {
      safeStyles[key] = {
        ...style,
        fontFamily: getSafeFontFamily(style.fontFamily),
      };
    } else {
      safeStyles[key] = style;
    }
  }
  
  return safeStyles;
};

/**
 * Check if fonts are loaded and available
 * @returns {boolean} - True if fonts are loaded
 */
export const areFontsLoaded = () => {
  return !(typeof global !== 'undefined' && global.fontsFailed);
};
