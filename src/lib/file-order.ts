import { parse } from "yaml";

/** Sorts collection entries into the order their ids appear in the YAML file they load from. */
export const inFileOrder = <T extends { id: string }>(entries: T[], yamlSource: string): T[] => {
  const position = new Map(
    (parse(yamlSource) as { id: unknown }[]).map((entry, i) => [String(entry.id), i]),
  );
  const at = (id: string) => {
    const i = position.get(id);
    if (i === undefined) throw new Error(`Collection id "${id}" not found in its yaml file`);
    return i;
  };
  return [...entries].sort((a, b) => at(a.id) - at(b.id));
};
