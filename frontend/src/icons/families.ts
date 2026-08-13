export interface IconDef {
  key: string;
  name: string;
  d: string;
}

export interface FamilyDef {
  id: string;
  name: string;
  hue: string;
  color: string;
  light: string;
  dark: string;
  icons: IconDef[];
}

export const FAMILIES: FamilyDef[] = [
  { id: 'data', name: 'Data / storage', hue: 'blue', color: '#4c8df6', light: '#7aabfa', dark: '#2b5fc4', icons: [
    { key: 'db.relational', name: 'Relational database', d: 'M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3z M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6 M20 12c0 1.7-3.6 3-8 3s-8-1.3-8-3' },
    { key: 'db.document', name: 'Document store', d: 'M12 3l8.5 4.2L12 11.4 3.5 7.2z M3.5 11.9l8.5 4.2 8.5-4.2 M3.5 16.6l8.5 4.2 8.5-4.2' },
    { key: 'db.cache', name: 'Cache', d: 'M13.2 2.5L4.8 13.6h6.2l-1 7.9 8.2-11.1h-6.2z' },
    { key: 'db.object', name: 'Object storage', d: 'M4.4 4.8h15.2l-2.1 15.6a1.6 1.6 0 01-1.6 1.4H8.1a1.6 1.6 0 01-1.6-1.4z M5.7 9.4h12.6' },
    { key: 'db.warehouse', name: 'Data warehouse', d: 'M3.5 4.5h17v6h-17z M3.5 13.5h17v6h-17z M9.2 4.5v6 M14.8 13.5v6' }
  ] },
  { id: 'api', name: 'API / service', hue: 'violet', color: '#a273f2', light: '#bb96f7', dark: '#6f45bd', icons: [
    { key: 'svc.generic', name: 'Service', d: 'M12 2.6l8.2 4.6v9.6L12 21.4l-8.2-4.6V7.2z M12 9.4a2.6 2.6 0 100 5.2 2.6 2.6 0 100-5.2' },
    { key: 'svc.rest', name: 'REST endpoint', d: 'M10 5.2h4a1.8 1.8 0 011.8 1.8v10a1.8 1.8 0 01-1.8 1.8h-4a1.8 1.8 0 01-1.8-1.8V7a1.8 1.8 0 011.8-1.8z M1.4 9.2h3.2 M3 7.4l1.8 1.8L3 11 M22.6 14.8h-3.2 M21 13l1.8 1.8L21 16.6' },
    { key: 'svc.auth', name: 'Authentication', d: 'M12 2.6l7.5 2.8v5.8c0 4.7-3.1 8.1-7.5 9.4-4.4-1.3-7.5-4.7-7.5-9.4V5.4z M12 9.8a1.9 1.9 0 100 3.8 1.9 1.9 0 100-3.8 M12 13.6v2.2' },
    { key: 'svc.balancer', name: 'Load balancer', d: 'M2.5 12h4.6 M7.1 12l3.8-5.6h8.4 M7.1 12l3.8 5.6h8.4 M17.2 3.9l2.9 2.5-2.9 2.5 M17.2 15.1l2.9 2.5-2.9 2.5' },
    { key: 'svc.gateway', name: 'Gateway', d: 'M3 4.5h18l-7 8.2v6.4l-4 2.4v-8.8z' }
  ] },
  { id: 'queue', name: 'Queue / stream', hue: 'accent', color: '#e05fb0', light: '#ee8ac9', dark: '#a83c81', icons: [
    { key: 'q.queue', name: 'Message queue', d: 'M2.6 7.4h8.2 M2.6 12h8.2 M2.6 16.6h8.2 M20.4 3.6v16.8 M13.4 12h4 M15.6 9.8l2.2 2.2-2.2 2.2' },
    { key: 'q.stream', name: 'Event stream', d: 'M2.8 7.6c3 0 3-2.4 6-2.4s3 2.4 6 2.4 3-2.4 6-2.4 M2.8 12.6c3 0 3-2.4 6-2.4s3 2.4 6 2.4 3-2.4 6-2.4 M2.8 17.6c3 0 3-2.4 6-2.4s3 2.4 6 2.4 3-2.4 6-2.4' },
    { key: 'q.pubsub', name: 'Pub / sub', d: 'M12 10a2 2 0 100 4 2 2 0 100-4 M8.3 8.3a5.2 5.2 0 000 7.4 M15.7 8.3a5.2 5.2 0 010 7.4 M5.5 5.5a9.2 9.2 0 000 13 M18.5 5.5a9.2 9.2 0 010 13' }
  ] },
  { id: 'ext', name: 'External / third-party', hue: 'neutral', color: '#8d949e', light: '#aab0b8', dark: '#5f656d', icons: [
    { key: 'ext.api', name: 'External API', d: 'M7 19.5a4.3 4.3 0 01-.4-8.6 5.5 5.5 0 0110.5-1.1 4.1 4.1 0 01-.6 8.1z M9.2 16.6l3.9-3.9 M10.4 12.7h2.9v2.9' },
    { key: 'ext.payment', name: 'Payment gateway', d: 'M2.8 6h18.4v12H2.8z M2.8 10.2h18.4 M6.4 14.4h4.2' },
    { key: 'ext.email', name: 'Notification service', d: 'M3 5.8h18v12.4H3z M3 5.8l9 6.6 9-6.6' },
    { key: 'ext.cdn', name: 'CDN', d: 'M12 2.8a9.2 9.2 0 100 18.4 9.2 9.2 0 100-18.4 M2.8 12h18.4 M12 2.8c2.7 2.8 2.7 15.6 0 18.4 M12 2.8c-2.7 2.8-2.7 15.6 0 18.4' }
  ] },
  { id: 'infra', name: 'Infra / server', hue: 'green', color: '#46b980', light: '#74d0a2', dark: '#2b8259', icons: [
    { key: 'infra.server', name: 'Server instance', d: 'M3.2 4.6h17.6v6H3.2z M3.2 13.4h17.6v6H3.2z M6.6 7.6h1.4 M6.6 16.4h1.4' },
    { key: 'infra.container', name: 'Container', d: 'M12 2.6l8.4 4.4v10L12 21.4 3.6 17V7z M3.6 7l8.4 4.4L20.4 7 M12 11.4v10' },
    { key: 'infra.cloud', name: 'Cloud provider', d: 'M6.8 18.6a4.3 4.3 0 01.4-8.6 5.6 5.6 0 0110.6-1.1 4.1 4.1 0 01-.6 9.7z' },
    { key: 'infra.observability', name: 'Observability', d: 'M2.6 12.4h4.2l2.6-6.2 4 12.4 2.6-6.2h5.4' }
  ] }
];

export function getFamilyById(id: string): FamilyDef {
  return FAMILIES.find(f => f.id === id) || FAMILIES[0];
}

export function getIconByKey(iconKey: string): { icon: IconDef; family: FamilyDef } {
  for (const fam of FAMILIES) {
    const icon = fam.icons.find(i => i.key === iconKey);
    if (icon) return { icon, family: fam };
  }
  return { icon: FAMILIES[0].icons[0], family: FAMILIES[0] };
}
