import { destinations } from '../destination/destinations';

// Reuse the established IDs and names; do not create a second selectable country list.
export const countries = destinations.map(({ id, name, english }) => ({
  countryId: id, name, english,
  researchStatus: id === 'JP' ? 'partially-verified' as const : 'needs-research' as const,
}));
