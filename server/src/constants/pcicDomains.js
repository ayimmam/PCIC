/**
 * PCIC organizational domains (Peak Craft / PCIC constitution).
 * Must match `User.domain` and `Event.domain` Mongoose enums.
 *
 * Note: The in-repo PDF `peak craft consitituon.pdf` is not text-extractable here;
 * domain names follow club usage: Code Crafters, Turing Tribe, Cyber Crew, Pixel Peeps.
 */
export const PCIC_DOMAINS = ["Code Crafters", "Turing Tribe", "Cyber Crew", "Pixel Peeps"];

/** Legacy `domain` labels from older app versions → current PCIC domain */
export const LEGACY_DOMAIN_TO_PCIC_DOMAIN = {
  General: "Code Crafters",
  Technical: "Code Crafters",
  Events: "Cyber Crew",
  Marketing: "Pixel Peeps",
  Finance: "Turing Tribe",
  "T&G": "Turing Tribe",
};

export function isPcicDomain(value) {
  return Boolean(value && PCIC_DOMAINS.includes(value));
}
