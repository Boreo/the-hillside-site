import { getEntry } from "astro:content";

const dwellingOf = async (slug: string) => {
  const dwelling = (await getEntry("pages", slug))?.data.dwelling;
  if (!dwelling) throw new Error(`No dwelling frontmatter on ${slug}`);
  return dwelling;
};

/** Dwelling frontmatter for the House, the Villa and the combined booking. */
export const getDwellings = async () => {
  const [house, villa, combined] = await Promise.all(
    ["hillside-house", "hillside-villa", "house-and-villa"].map(dwellingOf),
  );
  return { house, villa, combined };
};
