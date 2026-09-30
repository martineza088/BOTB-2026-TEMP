export const PASS_SCORE = 80;
export const requirements = [
 { id: 'profile', label: 'Business Profile', description: 'Business name, owner, business model, location or service area, contact information, opening days and times, and time zone.' },
 { id: 'products', label: 'Products and Pricing', description: 'Catalog with product names, descriptions, selling units, prices for every product, currency, and tax or fee guidance.' },
 { id: 'inventory', label: 'Inventory and Availability', description: 'Inventory table linked to catalog products, with on-hand, reserved, available, stock status, and incoming quantities. Explain availability and whether the snapshot is dated, undated, or live.' },
 { id: 'policies', label: 'Sample Business Policies', description: 'Payment, return/refund, warranty, pickup or delivery, cancellation, and customer-information policies, including relevant restrictions.' },
 { id: 'branding', label: 'Branding', description: 'Brand name, tone of voice, brand colors, and logo or visual identity guidance. State if no finished logo exists.' },
];
function headingId(line) {
 const normalized = line.trim().replace(/^\d+\s*(?:[\/.):\-]\s*|\s+)/, '').replace(/:$/, '').trim().toLowerCase();
 return requirements.find(section => section.label.toLowerCase() === normalized)?.id;
}
export function checkRequirements(pages) {
 const sections = requirements.map(section => ({ ...section, content: '', pageNumbers: [], status: 'missing', score: null, feedback: '', evidence: null }));
 let active;
 for (const page of pages) for (const raw of page.text.split(/\r?\n/)) {
  const line = raw.trim();
  if (!line || /^Page\s+\d+$/i.test(line) || /\|\s*Fictional sample packet$/i.test(line)) continue;
  const id = headingId(line);
  if (id) { active = sections.find(section => section.id === id); active.status = 'pending'; continue; }
  if (active) { active.content += `${line}\n`; if (!active.pageNumbers.includes(page.number)) active.pageNumbers.push(page.number); }
 }
 return sections.map(section => ({ ...section, content: section.content.trim(), status: section.status === 'missing' ? 'missing' : section.content.trim() ? 'pending' : 'unclear', evidence: section.content.trim() ? { page: section.pageNumbers[0], excerpt: section.content.trim().slice(0, 500) } : null }));
}
