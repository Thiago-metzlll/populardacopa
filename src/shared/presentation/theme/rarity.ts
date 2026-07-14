export type Rarity = 'comum' | 'rara' | 'lendaria';

interface RarityStyle {
  border: string;
  badgeBg: string;
  badgeText: string;
  label: string;
}

export const rarityColors: Record<Rarity, RarityStyle> = {
  lendaria: {
    border: '#8432E5',
    badgeBg: '#EDDCFF',
    badgeText: '#290055',
    label: 'Lendária',
  },
  rara: {
    border: '#C3F400',
    badgeBg: '#EFFFB0',
    badgeText: '#556D00',
    label: 'Rara',
  },
  comum: {
    border: '#8E9379',
    badgeBg: '#E5E2E1',
    badgeText: '#3A3D30',
    label: 'Comum',
  },
};
