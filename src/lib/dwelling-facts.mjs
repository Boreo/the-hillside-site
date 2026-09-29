// Facts-line labels for dwellings. Shared by FactsLine.astro and
// rehype-photo-runs.mjs so sleeps/bedrooms/bathrooms are always worded the
// same way from the per-dwelling frontmatter.

/**
 * Icon-name/label pairs for a dwelling facts line.
 * @param {{ sleeps: number, bedrooms: number, bathrooms: number }} facts
 * @returns {[string, string][]}
 */
export const factLabels = ({ sleeps, bedrooms, bathrooms }) => {
  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
  return [
    ["users", `Sleeps ${sleeps}`],
    ["bed", plural(bedrooms, "bedroom")],
    ["bathtub", plural(bathrooms, "bathroom")],
  ];
};
