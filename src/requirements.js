export const requirements = [
  { id: 'products', label: 'Products or menu', description: 'Names and descriptions of what you sell.', pattern: /\b(products?|menu|services?|catalog)\b/i },
  { id: 'pricing', label: 'Pricing', description: 'Prices, currency, and any fees or taxes.', pattern: /\b(pric(?:e|es|ing)|costs?|fees?)\b/i, detail: /(?:[$€£]\s*\d|\d+(?:\.\d{2})?\s*(?:USD|EUR|GBP|dollars))/i },
  { id: 'inventory', label: 'Inventory', description: 'Stock or availability, with an “as of” date.', pattern: /\b(inventory|stock|availability|available|sold out)\b/i },
  { id: 'policies', label: 'Policies', description: 'Returns, refunds, cancellations, and other business rules.', pattern: /\b(polic(?:y|ies)|refunds?|returns?|cancellations?)\b/i },
  { id: 'location', label: 'Location', description: 'Business address, service area, or online-only status.', pattern: /\b(location|address|service area|online.only)\b/i },
  { id: 'hours', label: 'Hours', description: 'Opening days, times, time zone, and exceptions.', pattern: /\b(hours|opening|open|closed|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i },
  { id: 'branding', label: 'Branding', description: 'Business name, tone, colors, and logo guidance.', pattern: /\b(brand(?:ing)?|logo|tone|colou?rs?)\b/i },
];

// This conservative first pass flags evidence for review; it never certifies facts.
export function checkRequirements(pages) {
  return requirements.map(requirement => {
    const page = pages.find(page => requirement.pattern.test(page.text));
    if (!page) return { ...requirement, status: 'missing', evidence: null };
    const match = page.text.match(requirement.pattern);
    const start = Math.max(0, match.index - 70);
    const excerpt = page.text.slice(start, match.index + 220).trim();
    const hasDetails = excerpt.length > match[0].length + 25 && (!requirement.detail || requirement.detail.test(excerpt));
    return { ...requirement, status: hasDetails ? 'candidate' : 'unclear', evidence: { page: page.number, excerpt } };
  });
}
