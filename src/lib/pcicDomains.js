/**
 * PCIC organizational domains (member + event tagging).
 * Leadership roles are separate; see AGENTS.md.
 */
export const PCIC_DOMAINS = ["Code Crafters", "Turing Tribe", "Cyber Crew", "Pixel Peeps"];

export function isPcicDomain(value) {
  return Boolean(value && PCIC_DOMAINS.includes(value));
}
