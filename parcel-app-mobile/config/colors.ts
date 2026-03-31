/**
 * Color palette for the Parcel App
 */

export const colors = {
    neonRed: "#db214c",
    pearlWhite: "#fbfcf8",
    silver: "#c0c0c0",
    danger: '#dc3545',
    white: '#ffffff',
    black: '#000000',
    gray: '#6c757d',
    lightGray: '#f8f9fa',
    darkGray: '#343a40'
} as const;

/**
 * Type for the colors object
 */
export type Colors = typeof colors;

/**
 * Type for individual color keys
 */
export type ColorKey = keyof typeof colors;

/**
 * Interface for extended color utilities
 */
export interface ColorTheme {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
}

/**
 * Extended color palette with semantic names
 */
export const colorTheme: ColorTheme = {
  primary: colors.neonRed,
  secondary: colors.silver,
  background: colors.pearlWhite,
  text: "#000000",
  textSecondary: colors.gray,
  border: "#e0e0e0",
  success: "#10b981",
  warning: "#f59e0b",
  danger: colors.neonRed,
  info: "#3b82f6"
};

/**
 * Utility function to get color with optional opacity
 */
export const getColorWithOpacity = (color: string, opacity: number): string => {
  if (opacity < 0 || opacity > 1) {
    throw new Error("Opacity must be between 0 and 1");
  }
  
  // Convert hex to rgba
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  // Handle rgb/rgba colors
  if (color.startsWith('rgb')) {
    return color.replace(/rgba?\(([^)]+)\)/, (match, values) => {
      const nums = values.split(',').map(v => v.trim());
      if (nums.length === 4) {
        // Already rgba, update alpha
        nums[3] = opacity.toString();
        return `rgba(${nums.join(', ')})`;
      } else if (nums.length === 3) {
        // Convert rgb to rgba
        return `rgba(${nums.join(', ')}, ${opacity})`;
      }
      return match;
    });
  }
  
  return color;
};

/**
 * Color utility object for easy access with TypeScript autocomplete
 */
export const Colors = {
  ...colors,
  theme: colorTheme,
  withOpacity: getColorWithOpacity
};

export default Colors;

