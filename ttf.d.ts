/**
 * Font files imported as modules.
 *
 * Metro resolves a .ttf import to an asset id; TypeScript needs telling
 * that. Required because the fonts are imported from their subpaths rather
 * than from the package root — see the note in app/_layout.tsx.
 */
declare module "*.ttf" {
  const asset: number;
  export default asset;
}
