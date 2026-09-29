export type LogoShape = 'rounded' | 'circle' | 'square';
export type LogoFit = 'cover' | 'contain';

/**
 * Returns Tailwind border-radius class matching the frame shape
 */
export function getLogoShapeClass(shape?: string): string {
  if (shape === 'circle') return 'rounded-full';
  if (shape === 'square') return 'rounded-2xl';
  return 'rounded-3xl'; // default: sisi-sisi melengkung halus dan elegan
}

/**
 * Returns Tailwind class for inner image fitting
 * 'contain' (default) ensures the entire logo is precisely visible without being cropped or covered
 * 'cover' allows edge-to-edge fill if specifically requested
 */
export function getLogoFitClass(fit?: string): string {
  if (fit === 'cover') return 'object-cover';
  return 'object-contain'; // default: presisi, utuh, dan tidak terpotong/tertutup
}
