export const options: Record<string, string[]> = {
  'attribute.value_type': ['bool', 'number', 'choice'],
  'business_claim.status': ['pending', 'approved', 'rejected'],
  'business_alias.kind': ['former_name', 'short_name', 'local_spelling', 'other'],
  'business.status': ['pending', 'active', 'suspended', 'deleted'],
  'business.source': ['owner', 'team', 'osm', 'import', 'demo'],
  'location.level': ['state', 'district', 'city', 'locality', 'landmark'],
  'concept.type': ['category', 'service'],
  'concept_alias.kind': ['main', 'synonym', 'misspelling', 'local', 'abbreviation'],
  'app_user.role': ['owner', 'creator', 'admin', 'customer'],
  'review.status': ['pending', 'approved', 'rejected'],
  'creator.status': ['pending', 'active', 'suspended'],
  'lead.status': ['new', 'contacted', 'booked', 'lost', 'spam'],
  'lead.source': ['web', 'whatsapp', 'missed_call', 'phone', 'creator'],
  'payout.status': ['pending', 'paid', 'cancelled'],
  'business_subscription.plan': ['verified', 'featured', 'premium'],
  'business_media.kind': ['logo', 'photo', 'menu']
};
export const references: Record<string, string> = {
  business_id: 'business',
  city_id: 'location',
  locality_id: 'location',
  concept_id: 'concept',
  attribute_id: 'attribute',
  owner_user_id: 'app_user',
  user_id: 'app_user',
  creator_id: 'creator',
  payout_id: 'payout',
  location_id: 'location',
  search_id: 'search_log',
  option_id: 'attribute_option',
  reviewed_by: 'app_user',
  changed_by: 'app_user',
  lead_id: 'lead'
};
export function reference(model: string, field: string) {
  return field === 'parent_id' ? model : references[field];
}
export function human(value: string) {
  const labels: Record<string, string> = {
    business_id: 'Place',
    city_id: 'City',
    locality_id: 'Locality',
    owner_user_id: 'Owner',
    user_id: 'User',
    creator_id: 'Creator',
    payout_id: 'Payout',
    parent_id: 'Parent',
    concept_id: 'Category or service',
    attribute_id: 'Attribute',
    location_id: 'Location',
    is_24x7: 'Open 24 hours',
    geom_verified: 'Coordinates verified',
    is_active: 'Active',
    weekday: 'Weekday (0–6)',
    flat_fee_inr: 'Flat fee (INR)',
    commission_pct: 'Commission (%)'
  };
  if (labels[value]) return labels[value];
  return value.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
