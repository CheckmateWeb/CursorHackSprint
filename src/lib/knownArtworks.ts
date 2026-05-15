import type { ArtworkIdentification } from './types';

export interface KnownArtwork {
  id: string;
  /** Wikimedia Commons or stable public URL for reference matching */
  referenceUrl: string;
  identification: ArtworkIdentification;
}

/** Famous works users often upload — matched via perceptual hash */
export const KNOWN_MASTERPIECES: KnownArtwork[] = [
  {
    id: 'starry-night',
    referenceUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/1280px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg',
    identification: {
      title: 'The Starry Night',
      artist: 'Vincent van Gogh',
      year: '1889',
      movement: 'Post-Impressionism',
      medium: 'Oil on canvas',
      history:
        'Painted at the asylum in Saint-Rémy-de-Provence, this night scene compresses village, cypress, and swirling sky into emotional brushwork. Van Gogh wrote to his brother Theo that the stars were “one of the most difficult things” to paint.',
      confidence: 0.95,
      source: 'catalog',
      isKnownMasterpiece: true,
    },
  },
  {
    id: 'mona-lisa',
    referenceUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/800px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg',
    identification: {
      title: 'Mona Lisa',
      artist: 'Leonardo da Vinci',
      year: 'c. 1503–1519',
      movement: 'High Renaissance',
      medium: 'Oil on poplar panel',
      history:
        'Leonardo’s portrait of Lisa Gherardini became the world’s most famous painting through sfumato modeling and an enigmatic expression. It has hung in the Louvre since the French Revolution.',
      confidence: 0.95,
      source: 'catalog',
      isKnownMasterpiece: true,
    },
  },
  {
    id: 'the-scream',
    referenceUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Edvard_Munch%2C_1893%2C_The_Scream%2C_Nasjonalgalleriet%2C_Oslo%2C_Norway.jpg/800px-Edvard_Munch%2C_1893%2C_The_Scream%2C_Nasjonalgalleriet%2C_Oslo%2C_Norway.jpg',
    identification: {
      title: 'The Scream',
      artist: 'Edvard Munch',
      year: '1893',
      movement: 'Expressionism',
      medium: 'Tempera and pastel on cardboard',
      history:
        'Munch recalled a walk at sunset when the sky turned “blood red” and he sensed “an infinite scream passing through nature.” The image became a symbol of modern anxiety.',
      confidence: 0.95,
      source: 'catalog',
      isKnownMasterpiece: true,
    },
  },
  {
    id: 'girl-pearl',
    referenceUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/1665_Girl_with_a_Pearl_Earring.jpg/800px-1665_Girl_with_a_Pearl_Earring.jpg',
    identification: {
      title: 'Girl with a Pearl Earring',
      artist: 'Johannes Vermeer',
      year: 'c. 1665',
      movement: 'Dutch Golden Age',
      medium: 'Oil on canvas',
      history:
        'Often called the “Mona Lisa of the North,” this tronie explores light on skin and a luminous pearl. Vermeer’s precise handling of pigment remains studied by conservators today.',
      confidence: 0.95,
      source: 'catalog',
      isKnownMasterpiece: true,
    },
  },
  {
    id: 'great-wave',
    referenceUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Tsunami_by_hokusai_19th_century.jpg/1280px-Tsunami_by_hokusai_19th_century.jpg',
    identification: {
      title: 'The Great Wave off Kanagawa',
      artist: 'Katsushika Hokusai',
      year: 'c. 1831',
      movement: 'Ukiyo-e',
      medium: 'Polychrome woodblock print',
      history:
        'Part of the series Thirty-six Views of Mount Fuji, this print shows fishermen in boats dwarfed by a rogue wave. Prussian blue ink helped define the palette of modern Japanese printmaking.',
      confidence: 0.95,
      source: 'catalog',
      isKnownMasterpiece: true,
    },
  },
  {
    id: 'persistence-memory',
    referenceUrl:
      'https://upload.wikimedia.org/wikipedia/en/d/dd/The_Persistence_of_Memory.jpg',
    identification: {
      title: 'The Persistence of Memory',
      artist: 'Salvador Dalí',
      year: '1931',
      movement: 'Surrealism',
      medium: 'Oil on canvas',
      history:
        'Dalí’s melting clocks in a barren landscape suggest the fluidity of time in dreams. Painted during his association with the Surrealist group in Paris.',
      confidence: 0.95,
      source: 'catalog',
      isKnownMasterpiece: true,
    },
  },
  {
    id: 'water-lilies',
    referenceUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg/1280px-Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg',
    identification: {
      title: 'Water Lilies',
      artist: 'Claude Monet',
      year: 'c. 1906',
      movement: 'Impressionism',
      medium: 'Oil on canvas',
      history:
        'Monet painted his Giverny pond obsessively in series, dissolving lilies and reflection into near-abstraction. These works influenced mid-century Color Field painting.',
      confidence: 0.95,
      source: 'catalog',
      isKnownMasterpiece: true,
    },
  },
  {
    id: 'american-gothic',
    referenceUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Grant_Wood_-_American_Gothic_-_Google_Art_Project.jpg/800px-Grant_Wood_-_American_Gothic_-_Google_Art_Project.jpg',
    identification: {
      title: 'American Gothic',
      artist: 'Grant Wood',
      year: '1930',
      movement: 'Regionalism',
      medium: 'Oil on beaverboard',
      history:
        'Wood modeled the farmhouse window and stern couple after a cottage in Eldon, Iowa. The painting became an emblem of rural American identity during the Great Depression.',
      confidence: 0.95,
      source: 'catalog',
      isKnownMasterpiece: true,
    },
  },
];

/** Demo samples on the landing page — inspired-by metadata */
export const SAMPLE_IDENTIFICATIONS: Record<
  string,
  ArtworkIdentification & { displayName: string }
> = {
  starry: {
    displayName: 'Starry Reverie',
    title: 'Starry Night (inspired study)',
    artist: 'After Vincent van Gogh',
    year: '1889',
    movement: 'Post-Impressionism',
    medium: 'Digital study',
    history:
      'Your sample echoes Van Gogh’s night sky swirls and village silhouette from Saint-Rémy. The original hangs in the Museum of Modern Art, New York.',
    confidence: 0.88,
    source: 'sample',
    isKnownMasterpiece: false,
  },
  sunset: {
    displayName: 'Golden Hour',
    title: 'Impression, Sunrise (inspired study)',
    artist: 'After Claude Monet',
    year: '1872',
    movement: 'Impressionism',
    medium: 'Digital study',
    history:
      'Warm horizon bands recall Monet’s harbor sunrise that gave Impressionism its name. Critics first used “Impressionist” as an insult at the 1874 exhibition.',
    confidence: 0.85,
    source: 'sample',
    isKnownMasterpiece: false,
  },
  waterlily: {
    displayName: 'Pond Dreams',
    title: 'Water Lilies (inspired study)',
    artist: 'After Claude Monet',
    year: 'c. 1900',
    movement: 'Impressionism',
    medium: 'Digital study',
    history:
      'Violet and green reflections suggest Monet’s Giverny pond series, where he painted the same water garden until his eyesight failed.',
    confidence: 0.86,
    source: 'sample',
    isKnownMasterpiece: false,
  },
  winter: {
    displayName: 'Silent Frost',
    title: 'Winter Landscape (inspired study)',
    artist: 'After Pieter Bruegel the Elder',
    year: '1565',
    movement: 'Northern Renaissance',
    medium: 'Digital study',
    history:
      'Cool grays and muted earth tones evoke Bruegel’s Hunters in the Snow — one of the first Western landscapes to show ordinary life in winter.',
    confidence: 0.82,
    source: 'sample',
    isKnownMasterpiece: false,
  },
};
