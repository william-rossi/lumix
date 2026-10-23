import type {
  Agency,
  Amenity,
  Development,
  DevelopmentStatus,
  DevelopmentType,
  Lead,
  MediaItem,
  Orientation,
  Specification,
  Unit,
  UnitStatus,
  UnitType,
} from "@/models";
import { computeUnitSlots, unitHeight } from "@/lib/massing";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const brlToCents = (value: number) => Math.round(value * 100);

const IMAGES = {
  living: "/examples/ap-1.jpg",
  kitchen: "/examples/ap-2.jpg",
  suite: "/examples/ap-3.webp",
  bath: "/examples/ap-4.webp",
  view: "/examples/ap-5.avif",
} as const;

function media(
  id: string,
  url: string,
  alt: string,
  caption: string,
  order: number,
): MediaItem {
  return { id, url, alt, caption, order, type: "image" };
}

const ORIENTATIONS: Orientation[] = [
  "north",
  "east",
  "south",
  "west",
  "northeast",
  "southeast",
  "northwest",
  "southwest",
];

interface UnitTemplate {
  suffix: string;
  name: string;
  type: UnitType;
  bedrooms: number;
  suites: number;
  bathrooms: number;
  halfBathrooms: number;
  parkingSpaces: number;
  area: number;
  balcony?: number;
  garden?: number;
  basePrice: number;
  onlyFloors?: number[];
  features?: string[];
}

function makeUnitImageSet(seedIndex: number): MediaItem[] {
  const pool = [
    { url: IMAGES.living, alt: "Sala de estar integrada com luz natural" },
    { url: IMAGES.kitchen, alt: "Cozinha com bancada em pedra" },
    { url: IMAGES.suite, alt: "Suíte com guarda-roupa planejado" },
    { url: IMAGES.bath, alt: "Banheiro com metais escovados" },
    { url: IMAGES.view, alt: "Vista da varanda para a cidade" },
  ];
  const start = seedIndex % pool.length;
  return Array.from({ length: 3 }, (_, offset) => {
    const item = pool[(start + offset) % pool.length];
    return media(
      `img_${seedIndex}_${offset}`,
      item.url,
      item.alt,
      offset === 0 ? "Living integrado" : offset === 1 ? "Cozinha" : "Suíte",
      offset,
    );
  });
}

function unitStatus(seed: number, floor: number, index: number): UnitStatus {
  const raw = Math.abs(Math.sin(seed * 31.7 + floor * 17.3 + index * 7.9) * 1000);
  const bucket = raw % 100;
  if (bucket < 8) return "sold";
  if (bucket < 21) return "reserved";
  if (bucket < 24) return "blocked";
  return "available";
}

function buildUnits(
  developmentId: string,
  templates: UnitTemplate[],
  floors: number[],
  seed: number,
): Unit[] {
  const units: Unit[] = [];
  let sortOrder = 0;

  for (const floor of floors) {
    const floorTemplates = templates.filter(
      (template) => !template.onlyFloors || template.onlyFloors.includes(floor),
    );

    floorTemplates.forEach((template, index) => {
      const status = unitStatus(seed, floor, index);
      const floorFactor = 1 + (floor - 1) * 0.0085;
      const premium =
        template.type === "penthouse" ? 1.18 : template.type === "garden" ? 1.05 : 1;
      const basePrice = Math.round(
        brlToCents(template.basePrice) * floorFactor * premium,
      );
      const common = Math.round(template.area * 0.14 * 10) / 10;
      const balcony = template.balcony ?? 0;
      const garden = template.garden ?? 0;
      const total = Math.round((template.area + balcony + garden) * 10) / 10;
      const code = `${floor}${String(index + 1).padStart(2, "0")}`;

      units.push({
        id: `${developmentId}_${code}`,
        developmentId,
        code,
        name: template.name,
        floor,
        type: template.type,
        status,
        area: {
          private: template.area,
          common,
          total,
          balcony: balcony || undefined,
          garden: garden || undefined,
        },
        rooms: {
          bedrooms: template.bedrooms,
          suites: template.suites,
          bathrooms: template.bathrooms,
          halfBathrooms: template.halfBathrooms,
          parkingSpaces: template.parkingSpaces,
          hasBalcony: balcony > 0,
          hasGarden: garden > 0,
          hasStorage: true,
        },
        pricing: {
          basePrice,
          pricePerSqm: Math.round(basePrice / total),
          iptuEstimate: Math.round(template.area * 1.35 * 100),
          condoFeeEstimate: Math.round(template.area * 11.5 * 100),
          paymentPlan: {
            downPayment: template.type === "penthouse" ? 25 : 20,
            installments: 36,
            correctionIndex: "INCC",
            balloonPayments:
              template.type === "penthouse"
                ? [
                    {
                      dueDate: new Date("2027-06-10"),
                      amount: Math.round(basePrice * 0.3),
                      description: "Parcela única na entrega das chaves",
                    },
                  ]
                : undefined,
          },
          promotions:
            status === "available" && index === 0
              ? [
                  {
                    id: `promo_${developmentId}_${code}`,
                    name: "Fluxo direto",
                    description:
                      "Condições especiais de pagamento para compra à vista.",
                    discountType: "percentage",
                    discountValue: 3,
                    validUntil: new Date("2026-12-31"),
                    conditions: "Válido para contratos assinados até 31/12.",
                  },
                ]
              : undefined,
        },
        orientation: ORIENTATIONS[(floor + index) % ORIENTATIONS.length],
        images: makeUnitImageSet(sortOrder),
        floorPlan: undefined,
        features: template.features ?? [
          "Varanda com guarda-corpo em vidro",
          "Piso em porcelanato acetinado",
          "Cozinha com bancada em quartzo",
          "Automação de iluminação",
        ],
        description:
          template.type === "penthouse"
            ? "Cobertura com pé-direito duplo, terraço privativo e vista panorâmica."
            : template.type === "garden"
              ? "Unidade térreo com jardim privativo e acesso independente."
              : "Planta flexível com living amplo, ventilação cruzada e boa insolação.",
        sortOrder: sortOrder++,
      });
    });
  }

  return units;
}

function buildUnitsMapping(
  units: Unit[],
  towerWidth: number,
  towerDepth: number,
  floorHeight: number,
) {
  const byFloor = new Map<number, Unit[]>();
  for (const unit of units) {
    const list = byFloor.get(unit.floor) ?? [];
    list.push(unit);
    byFloor.set(unit.floor, list);
  }

  return units.map((unit) => {
    const floorUnits = (byFloor.get(unit.floor) ?? []).sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
    const index = floorUnits.findIndex((item) => item.id === unit.id);
    const slots = computeUnitSlots(floorUnits.length, towerWidth, towerDepth);
    const slot = slots[index] ?? slots[0];

    return {
      unitId: unit.id,
      meshNames: [`unit-${unit.id}`],
      floorLevel: unit.floor,
      position: {
        x: Number(slot.x.toFixed(2)),
        y: Number(unitHeight(unit.floor, floorHeight).toFixed(2)),
        z: Number(slot.z.toFixed(2)),
      },
      color: undefined,
    };
  });
}

function pricingRange(units: Unit[]) {
  const available = units.filter((unit) => unit.status === "available");
  const pool = available.length > 0 ? available : units;
  return pool.reduce(
    (acc, unit) => ({
      minPrice: Math.min(acc.minPrice, unit.pricing.basePrice),
      maxPrice: Math.max(acc.maxPrice, unit.pricing.basePrice),
      minSqm: Math.min(acc.minSqm, unit.pricing.pricePerSqm),
      maxSqm: Math.max(acc.maxSqm, unit.pricing.pricePerSqm),
    }),
    {
      minPrice: Number.POSITIVE_INFINITY,
      maxPrice: 0,
      minSqm: Number.POSITIVE_INFINITY,
      maxSqm: 0,
    },
  );
}

function makeModel3d(
  id: string,
  units: Unit[],
  massing: {
    floors: number;
    unitsPerFloor: number;
    towerWidth: number;
    towerDepth: number;
    floorHeight: number;
  },
): Development["model3d"] {
  const height = massing.floors * massing.floorHeight;
  return {
    id,
    url: `/models/${id}.glb`,
    format: "glb",
    version: "1.4.0",
    fileSize: 1_840_000,
    bounds: {
      min: { x: -massing.towerWidth / 2, y: 0, z: -massing.towerDepth / 2 },
      max: { x: massing.towerWidth / 2, y: height, z: massing.towerDepth / 2 },
    },
    unitsMapping: buildUnitsMapping(
      units,
      massing.towerWidth,
      massing.towerDepth,
      massing.floorHeight,
    ),
    cameraPresets: [
      {
        id: "overview",
        name: "Vista geral",
        position: {
          x: massing.towerWidth * 1.7,
          y: height * 0.82,
          z: massing.towerDepth * 2.1,
        },
        target: { x: 0, y: height * 0.42, z: 0 },
        fov: 34,
      },
      {
        id: "top",
        name: "Vista aérea",
        position: { x: 0.1, y: height * 1.8, z: massing.towerDepth * 0.9 },
        target: { x: 0, y: height * 0.4, z: 0 },
        fov: 38,
      },
    ],
    lightingPreset: {
      ambientIntensity: 0.55,
      directionalLights: [
        { position: { x: 14, y: 22, z: 10 }, intensity: 2.1, color: "#fff3df" },
        { position: { x: -16, y: 10, z: -12 }, intensity: 0.7, color: "#cdd8e6" },
      ],
    },
    materials: [],
    massing: {
      mode: "procedural",
      ...massing,
    },
    storage: {
      provider: "mongodb-gridfs",
      fileId: `gridfs_${id}`,
      checksum: `sha256:${id}-mock`,
      compressed: true,
      compression: "meshopt",
      uploadedAt: new Date("2026-08-14T12:00:00Z"),
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Amenities & specifications                                                 */
/* -------------------------------------------------------------------------- */

const AMENITY_LIBRARY: Record<string, Amenity> = {
  pool: {
    id: "pool",
    name: "Piscina com raia de 20m",
    icon: "waves",
    category: "leisure",
  },
  gym: {
    id: "gym",
    name: "Academia equipada",
    icon: "dumbbell",
    category: "sports",
  },
  coworking: {
    id: "coworking",
    name: "Coworking e sala de reunião",
    icon: "briefcase",
    category: "convenience",
  },
  spa: {
    id: "spa",
    name: "Spa com sauna seca",
    icon: "sparkles",
    category: "wellness",
  },
  pet: {
    id: "pet",
    name: "Pet place com banho",
    icon: "paw",
    category: "convenience",
  },
  rooftop: {
    id: "rooftop",
    name: "Rooftop com vista aberta",
    icon: "sun",
    category: "leisure",
  },
  concierge: {
    id: "concierge",
    name: "Concierge 24h",
    icon: "bell",
    category: "security",
  },
  bike: {
    id: "bike",
    name: "Bicicletário com oficina",
    icon: "bike",
    category: "sustainability",
  },
  ev: {
    id: "ev",
    name: "Carregadores elétricos",
    icon: "zap",
    category: "technology",
  },
  security: {
    id: "security",
    name: "Segurança perimetral e biometria",
    icon: "shield",
    category: "security",
  },
  garden: {
    id: "garden",
    name: "Praça ajardinada",
    icon: "leaf",
    category: "sustainability",
  },
  party: {
    id: "party",
    name: "Salão de festas gourmet",
    icon: "users",
    category: "leisure",
  },
  kids: {
    id: "kids",
    name: "Espaço infantil",
    icon: "blocks",
    category: "leisure",
  },
  laundry: {
    id: "laundry",
    name: "Lavanderia compartilhada",
    icon: "washer",
    category: "convenience",
  },
  lobby: {
    id: "lobby",
    name: "Lobby com pé-direito duplo",
    icon: "building",
    category: "convenience",
  },
  delivery: {
    id: "delivery",
    name: "Delivery locker refrigerado",
    icon: "package",
    category: "convenience",
  },
};

const BASE_SPECIFICATIONS: Specification[] = [
  {
    category: "Estrutura",
    items: [
      { name: "Estrutura", value: "Concreto armado moldado in loco", highlight: true },
      { name: "Fachada", value: "Concreto aparente, vidro e brises metálicos" },
      { name: "Esquadrias", value: "Alumínio com vidro duplo e controle solar" },
      { name: "Laje", value: "Laje nervurada com isolamento acústico" },
    ],
  },
  {
    category: "Acabamentos",
    items: [
      { name: "Piso", value: "Porcelanato acetinado 90×90 cm", highlight: true },
      { name: "Cozinha", value: "Bancada em quartzo e cuba esculpida" },
      { name: "Banheiros", value: "Metais escovados e louças suspensas" },
      { name: "Marcenaria", value: "Armários planejados nos dormitórios" },
    ],
  },
  {
    category: "Infraestrutura",
    items: [
      { name: "Climatização", value: "Infraestrutura para split em todos os ambientes" },
      { name: "Automação", value: "Cenas de iluminação e cortinas motorizadas" },
      { name: "Água", value: "Aquecimento central a gás com retorno" },
      { name: "Energia", value: "Medição individual e gerador para áreas comuns" },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Agencies                                                                   */
/* -------------------------------------------------------------------------- */

export const agencies: Agency[] = [
  {
    id: "agency_almeida",
    name: "Almeida Vasconcelos",
    slug: "almeida-vasconcelos",
    coverImage: IMAGES.living,
    description:
      "Curadoria de empreendimentos autorais em São Paulo. Trabalhamos com incorporadoras que tratam arquitetura como parte da cidade, não como produto de prateleira.",
    address: {
      street: "Rua dos Pinheiros",
      number: "870",
      complement: "Conjunto 42",
      neighborhood: "Pinheiros",
      city: "São Paulo",
      state: "SP",
      zipCode: "05422-001",
      country: "Brasil",
      coordinates: { lat: -23.5673, lng: -46.6921 },
    },
    phone: "+55 11 3814-2200",
    email: "contato@almeidavasconcelos.com.br",
    website: "https://almeidavasconcelos.com.br",
    creci: "CRECI-SP 12.345-J",
    createdAt: new Date("2019-03-11T09:00:00Z"),
    updatedAt: new Date("2026-09-02T14:30:00Z"),
    isActive: true,
  },
  {
    id: "agency_mare",
    name: "Maré Empreendimentos",
    slug: "mare-empreendimentos",
    coverImage: IMAGES.view,
    description:
      "Do Rio para o Rio. Empreendimentos de médio porte com foco em mobilidade, vista e convivência — do Centro a Botafogo.",
    address: {
      street: "Rua Visconde de Pirajá",
      number: "550",
      complement: "Sala 1204",
      neighborhood: "Ipanema",
      city: "Rio de Janeiro",
      state: "RJ",
      zipCode: "22410-002",
      country: "Brasil",
      coordinates: { lat: -22.9838, lng: -43.2096 },
    },
    phone: "+55 21 2523-8080",
    email: "ola@mareempreendimentos.com.br",
    website: "https://mareempreendimentos.com.br",
    creci: "CRECI-RJ 8.902-J",
    createdAt: new Date("2020-07-22T09:00:00Z"),
    updatedAt: new Date("2026-08-19T11:10:00Z"),
    isActive: true,
  },
  {
    id: "agency_nortesul",
    name: "Norte Sul Imobiliária",
    slug: "norte-sul",
    coverImage: IMAGES.suite,
    description:
      "Especialista em Minas Gerais. Da Serra do Curral ao centro de Belo Horizonte, conectamos famílias a endereços com história.",
    address: {
      street: "Rua Antônio de Albuquerque",
      number: "1020",
      complement: "Loja 3",
      neighborhood: "Savassi",
      city: "Belo Horizonte",
      state: "MG",
      zipCode: "30112-011",
      country: "Brasil",
      coordinates: { lat: -19.9321, lng: -43.9367 },
    },
    phone: "+55 31 3287-4455",
    email: "contato@nortesulimoveis.com.br",
    website: "https://nortesulimoveis.com.br",
    creci: "CRECI-MG 5.441-J",
    createdAt: new Date("2016-11-04T09:00:00Z"),
    updatedAt: new Date("2026-06-27T16:45:00Z"),
    isActive: true,
  },
  {
    id: "agency_sul",
    name: "Sul Arquitetura",
    slug: "sul-arquitetura",
    coverImage: IMAGES.bath,
    description:
      "Casas e empreendimentos de baixa densidade em Santa Catarina. Projetos que respeitam o vento, o sol e o tempo de morar.",
    address: {
      street: "Rua Bocaiúva",
      number: "1840",
      complement: "Casa 2",
      neighborhood: "Centro",
      city: "Florianópolis",
      state: "SC",
      zipCode: "88015-530",
      country: "Brasil",
      coordinates: { lat: -27.5949, lng: -48.5482 },
    },
    phone: "+55 48 3224-7711",
    email: "estudio@sularquitetura.com.br",
    website: "https://sularquitetura.com.br",
    creci: "CRECI-SC 3.208-J",
    createdAt: new Date("2021-01-18T09:00:00Z"),
    updatedAt: new Date("2026-07-30T10:20:00Z"),
    isActive: true,
  },
];

/* -------------------------------------------------------------------------- */
/* Developments                                                               */
/* -------------------------------------------------------------------------- */

function buildDevelopment(config: {
  id: string;
  agencyId: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  status: DevelopmentStatus;
  type: DevelopmentType;
  address: Development["address"];
  coverImage: string;
  gallery: MediaItem[];
  floors: number[];
  templates: UnitTemplate[];
  seed: number;
  massing: {
    floors: number;
    unitsPerFloor: number;
    towerWidth: number;
    towerDepth: number;
    floorHeight: number;
  };
  amenities: string[];
  highlights: string[];
  nearby: Array<{ label: string; category: string; minutes: number }>;
  launchDate: string;
  deliveryDate: string;
  featured?: boolean;
}): Development {
  const units = buildUnits(
    config.id,
    config.templates,
    config.floors,
    config.seed,
  );
  const range = pricingRange(units);
  const model3d = makeModel3d(`model_${config.id}`, units, config.massing);

  return {
    id: config.id,
    agencyId: config.agencyId,
    name: config.name,
    slug: config.slug,
    description: config.description,
    tagline: config.tagline,
    address: config.address,
    status: config.status,
    type: config.type,
    launchDate: new Date(config.launchDate),
    deliveryDate: new Date(config.deliveryDate),
    coverImage: config.coverImage,
    gallery: config.gallery,
    model3d,
    units,
    amenities: config.amenities.map((key) => AMENITY_LIBRARY[key]),
    specifications: BASE_SPECIFICATIONS,
    pricing: {
      minPrice: range.minPrice,
      maxPrice: range.maxPrice,
      currency: "BRL",
      pricePerSqmRange: { min: range.minSqm, max: range.maxSqm },
    },
    highlights: config.highlights,
    nearby: config.nearby,
    createdAt: new Date("2026-05-12T09:00:00Z"),
    updatedAt: new Date("2026-09-28T09:00:00Z"),
    isPublished: true,
    featured: config.featured ?? false,
    seo: {
      title: `${config.name} — ${config.address.neighborhood}, ${config.address.city}`,
      description: config.tagline,
      keywords: [
        config.name,
        `apartamento ${config.address.neighborhood}`,
        `imóvel ${config.address.city}`,
        "empreendimento 3D",
      ],
    },
  };
}

export const developments: Development[] = [
  buildDevelopment({
    id: "dev_alto",
    agencyId: "agency_almeida",
    name: "Residencial Alto do Parque",
    slug: "alto-do-parque",
    tagline: "Onde a cidade encontra o silêncio.",
    description:
      "Um edifício de 15 andares desenhado para quem quer morar em Pinheiros sem abrir mão de luz, ventilação e vista. As plantas foram organizadas para capturar o sol da manhã e o verde da rua, com varandas profundas que funcionam como uma extensão da sala. No térreo, uma praça aberta devolve ao bairro parte do terreno.",
    status: "under_construction",
    type: "residential",
    address: {
      street: "Rua Cristiano Viana",
      number: "1240",
      neighborhood: "Pinheiros",
      city: "São Paulo",
      state: "SP",
      zipCode: "05411-000",
      country: "Brasil",
      coordinates: { lat: -23.5593, lng: -46.6928 },
    },
    coverImage: IMAGES.living,
    gallery: [
      media("g_alto_1", IMAGES.living, "Living integrado com varanda", "Living integrado", 0),
      media("g_alto_2", IMAGES.kitchen, "Cozinha com bancada em quartzo", "Cozinha", 1),
      media("g_alto_3", IMAGES.suite, "Suíte com armários planejados", "Suíte", 2),
      media("g_alto_4", IMAGES.bath, "Banheiro com metais escovados", "Banheiro", 3),
      media("g_alto_5", IMAGES.view, "Vista da varanda para Pinheiros", "Vista", 4),
    ],
    floors: Array.from({ length: 15 }, (_, index) => index + 1),
    templates: [
      {
        suffix: "A",
        name: "Studio com varanda",
        type: "1_bedroom",
        bedrooms: 1,
        suites: 0,
        bathrooms: 1,
        halfBathrooms: 0,
        parkingSpaces: 1,
        area: 58,
        balcony: 7,
        basePrice: 780_000,
        onlyFloors: Array.from({ length: 13 }, (_, index) => index + 1),
      },
      {
        suffix: "B",
        name: "Apartamento 2 quartos",
        type: "2_bedrooms",
        bedrooms: 2,
        suites: 1,
        bathrooms: 2,
        halfBathrooms: 0,
        parkingSpaces: 1,
        area: 82,
        balcony: 10,
        basePrice: 1_180_000,
        onlyFloors: Array.from({ length: 13 }, (_, index) => index + 1),
      },
      {
        suffix: "C",
        name: "Apartamento 3 quartos",
        type: "3_bedrooms",
        bedrooms: 3,
        suites: 1,
        bathrooms: 2,
        halfBathrooms: 1,
        parkingSpaces: 2,
        area: 104,
        balcony: 13,
        basePrice: 1_640_000,
        onlyFloors: Array.from({ length: 13 }, (_, index) => index + 1),
      },
      {
        suffix: "PH",
        name: "Cobertura duplex",
        type: "penthouse",
        bedrooms: 3,
        suites: 3,
        bathrooms: 4,
        halfBathrooms: 1,
        parkingSpaces: 3,
        area: 186,
        balcony: 42,
        basePrice: 2_980_000,
        onlyFloors: [14, 15],
        features: [
          "Terraço privativo com piscina",
          "Pé-direito duplo no living",
          "Lareira ecológica",
          "Vista panorâmica de 270°",
        ],
      },
    ],
    seed: 3,
    massing: {
      floors: 15,
      unitsPerFloor: 3,
      towerWidth: 19,
      towerDepth: 16,
      floorHeight: 3.2,
    },
    amenities: [
      "pool",
      "gym",
      "coworking",
      "spa",
      "pet",
      "rooftop",
      "bike",
      "ev",
      "security",
      "garden",
    ],
    highlights: [
      "A 400 m da estação Fradique Coutinho",
      "Praça pública no térreo",
      "Varandas com profundidade de 2,4 m",
      "Certificação de eficiência energética",
    ],
    nearby: [
      { label: "Metrô Fradique Coutinho", category: "Mobilidade", minutes: 5 },
      { label: "Praça Benedito Calixto", category: "Lazer", minutes: 8 },
      { label: "Mercado de Pinheiros", category: "Conveniência", minutes: 9 },
      { label: "Colégio Santa Cruz", category: "Educação", minutes: 7 },
      { label: "Hospital das Clínicas", category: "Saúde", minutes: 12 },
    ],
    launchDate: "2025-03-10",
    deliveryDate: "2027-11-30",
    featured: true,
  }),
  buildDevelopment({
    id: "dev_lume",
    agencyId: "agency_mare",
    name: "Edifício Lume",
    slug: "edificio-lume",
    tagline: "A cidade acende. Você chega.",
    description:
      "Um edifício compacto e eficiente a cinco minutos do metrô de Botafogo. São 20 andares com plantas de 32 a 74 m², pensadas para uma geração que trabalha em casa, cozinha em casa e recebe em casa. O rooftop é aberto a todos os moradores e funciona como uma sala de estar coletiva sobre o bairro.",
    status: "launching",
    type: "residential",
    address: {
      street: "Rua São Clemente",
      number: "312",
      neighborhood: "Botafogo",
      city: "Rio de Janeiro",
      state: "RJ",
      zipCode: "22260-000",
      country: "Brasil",
      coordinates: { lat: -22.9519, lng: -43.1919 },
    },
    coverImage: IMAGES.view,
    gallery: [
      media("g_lume_1", IMAGES.view, "Vista do rooftop para o Pão de Açúcar", "Rooftop", 0),
      media("g_lume_2", IMAGES.living, "Living compacto com mobiliário planejado", "Living", 1),
      media("g_lume_3", IMAGES.kitchen, "Cozinha integrada", "Cozinha", 2),
      media("g_lume_4", IMAGES.suite, "Dormitório com luz natural", "Dormitório", 3),
      media("g_lume_5", IMAGES.bath, "Banheiro compacto", "Banheiro", 4),
    ],
    floors: Array.from({ length: 20 }, (_, index) => index + 1),
    templates: [
      {
        suffix: "A",
        name: "Studio essencial",
        type: "studio",
        bedrooms: 0,
        suites: 0,
        bathrooms: 1,
        halfBathrooms: 0,
        parkingSpaces: 0,
        area: 32,
        balcony: 0,
        basePrice: 390_000,
      },
      {
        suffix: "B",
        name: "Studio com varanda",
        type: "studio",
        bedrooms: 0,
        suites: 0,
        bathrooms: 1,
        halfBathrooms: 0,
        parkingSpaces: 1,
        area: 38,
        balcony: 4,
        basePrice: 462_000,
      },
      {
        suffix: "C",
        name: "1 quarto com varanda",
        type: "1_bedroom",
        bedrooms: 1,
        suites: 0,
        bathrooms: 1,
        halfBathrooms: 0,
        parkingSpaces: 1,
        area: 48,
        balcony: 6,
        basePrice: 548_000,
      },
      {
        suffix: "D",
        name: "1 suíte com vista",
        type: "1_bedroom",
        bedrooms: 1,
        suites: 1,
        bathrooms: 1,
        halfBathrooms: 1,
        parkingSpaces: 1,
        area: 54,
        balcony: 8,
        basePrice: 612_000,
      },
      {
        suffix: "E",
        name: "2 quartos com varanda",
        type: "2_bedrooms",
        bedrooms: 2,
        suites: 0,
        bathrooms: 1,
        halfBathrooms: 1,
        parkingSpaces: 1,
        area: 68,
        balcony: 9,
        basePrice: 798_000,
      },
      {
        suffix: "F",
        name: "2 suítes com varanda",
        type: "2_bedrooms",
        bedrooms: 2,
        suites: 2,
        bathrooms: 2,
        halfBathrooms: 0,
        parkingSpaces: 2,
        area: 74,
        balcony: 11,
        basePrice: 928_000,
      },
    ],
    seed: 7,
    massing: {
      floors: 20,
      unitsPerFloor: 6,
      towerWidth: 17,
      towerDepth: 15,
      floorHeight: 3,
    },
    amenities: [
      "rooftop",
      "gym",
      "coworking",
      "laundry",
      "delivery",
      "bike",
      "pet",
      "lobby",
      "security",
    ],
    highlights: [
      "470 m do metrô Botafogo",
      "Rooftop com cozinha coletiva",
      "Plantas flexíveis de 32 a 74 m²",
      "Aluguel por temporada permitido",
    ],
    nearby: [
      { label: "Metrô Botafogo", category: "Mobilidade", minutes: 6 },
      { label: "Praia de Botafogo", category: "Lazer", minutes: 9 },
      { label: "Shopping Rio Sul", category: "Conveniência", minutes: 12 },
      { label: "Casa & Gourmet", category: "Conveniência", minutes: 4 },
      { label: "Hospital Copa D'Or", category: "Saúde", minutes: 10 },
    ],
    launchDate: "2026-01-20",
    deliveryDate: "2028-06-30",
    featured: true,
  }),
  buildDevelopment({
    id: "dev_vila",
    agencyId: "agency_nortesul",
    name: "Vila Serrana",
    slug: "vila-serrana",
    tagline: "Morar com o tempo da serra.",
    description:
      "Quatro andares, quatro casas por andar e um jardim que atravessa o quarteirão. Vila Serrana foi desenhada em diálogo com o relevo do bairro, criando terraços escalonados e uma rua interna arborizada. Cada unidade tem entrada independente e pelo menos duas frentes de ventilação.",
    status: "ready",
    type: "residential",
    address: {
      street: "Rua Lindenberg",
      number: "85",
      neighborhood: "Serra",
      city: "Belo Horizonte",
      state: "MG",
      zipCode: "30220-260",
      country: "Brasil",
      coordinates: { lat: -19.9372, lng: -43.9168 },
    },
    coverImage: IMAGES.suite,
    gallery: [
      media("g_vila_1", IMAGES.suite, "Sala com vista para o jardim", "Sala", 0),
      media("g_vila_2", IMAGES.living, "Living com pé-direito alto", "Living", 1),
      media("g_vila_3", IMAGES.bath, "Banheiro com pedra natural", "Banheiro", 2),
      media("g_vila_4", IMAGES.kitchen, "Cozinha aberta para o jardim", "Cozinha", 3),
      media("g_vila_5", IMAGES.view, "Terraço com vista da serra", "Terraço", 4),
    ],
    floors: [1, 2, 3, 4],
    templates: [
      {
        suffix: "A",
        name: "Casa jardim",
        type: "garden",
        bedrooms: 3,
        suites: 1,
        bathrooms: 2,
        halfBathrooms: 1,
        parkingSpaces: 2,
        area: 128,
        balcony: 18,
        garden: 32,
        basePrice: 1_240_000,
      },
      {
        suffix: "B",
        name: "Casa terraço",
        type: "3_bedrooms",
        bedrooms: 3,
        suites: 2,
        bathrooms: 3,
        halfBathrooms: 1,
        parkingSpaces: 2,
        area: 142,
        balcony: 24,
        basePrice: 1_480_000,
      },
      {
        suffix: "C",
        name: "Casa varanda",
        type: "3_bedrooms",
        bedrooms: 3,
        suites: 2,
        bathrooms: 3,
        halfBathrooms: 0,
        parkingSpaces: 2,
        area: 156,
        balcony: 30,
        basePrice: 1_690_000,
      },
      {
        suffix: "D",
        name: "Casa mirante",
        type: "4_bedrooms",
        bedrooms: 4,
        suites: 2,
        bathrooms: 3,
        halfBathrooms: 1,
        parkingSpaces: 3,
        area: 168,
        balcony: 36,
        basePrice: 1_920_000,
        onlyFloors: [4],
      },
    ],
    seed: 11,
    massing: {
      floors: 4,
      unitsPerFloor: 4,
      towerWidth: 26,
      towerDepth: 19,
      floorHeight: 3.6,
    },
    amenities: ["garden", "pool", "gym", "party", "kids", "concierge", "bike", "ev"],
    highlights: [
      "Entrada independente por unidade",
      "Jardim de 1.200 m² compartilhado",
      "A 6 min da Savassi",
      "Obra entregue em 2026",
    ],
    nearby: [
      { label: "Savassi", category: "Lazer", minutes: 7 },
      { label: "Praça da Liberdade", category: "Lazer", minutes: 12 },
      { label: "Mercado Central", category: "Conveniência", minutes: 15 },
      { label: "Colégio Loyola", category: "Educação", minutes: 9 },
      { label: "Hospital Mater Dei", category: "Saúde", minutes: 11 },
    ],
    launchDate: "2024-05-15",
    deliveryDate: "2026-03-20",
    featured: true,
  }),
  buildDevelopment({
    id: "dev_casa",
    agencyId: "agency_sul",
    name: "Casa Nativa",
    slug: "casa-nativa",
    tagline: "Três andares. Oito casas. Um jeito de viver.",
    description:
      "Um condomínio de baixa densidade na Lagoa da Conceição, com oito casas suspensas entre a restinga e o morro. A estrutura em madeira engenheirada reduz o impacto da obra e permite plantas amplas com poucos pilares. Cada casa tem churrasqueira, ducha externa e vista para a lagoa.",
    status: "under_construction",
    type: "residential",
    address: {
      street: "Servidão do Canto da Lagoa",
      number: "210",
      neighborhood: "Lagoa da Conceição",
      city: "Florianópolis",
      state: "SC",
      zipCode: "88062-400",
      country: "Brasil",
      coordinates: { lat: -27.6048, lng: -48.4672 },
    },
    coverImage: IMAGES.bath,
    gallery: [
      media("g_casa_1", IMAGES.bath, "Banheiro com vista para a restinga", "Banheiro", 0),
      media("g_casa_2", IMAGES.suite, "Suíte com varanda", "Suíte", 1),
      media("g_casa_3", IMAGES.living, "Living com estrutura aparente", "Living", 2),
      media("g_casa_4", IMAGES.kitchen, "Cozinha em madeira", "Cozinha", 3),
      media("g_casa_5", IMAGES.view, "Vista da Lagoa da Conceição", "Vista", 4),
    ],
    floors: [1, 2, 3, 4],
    templates: [
      {
        suffix: "A",
        name: "Casa restinga",
        type: "3_bedrooms",
        bedrooms: 3,
        suites: 2,
        bathrooms: 3,
        halfBathrooms: 0,
        parkingSpaces: 2,
        area: 148,
        balcony: 28,
        basePrice: 1_980_000,
      },
      {
        suffix: "B",
        name: "Casa lagoa",
        type: "3_bedrooms",
        bedrooms: 3,
        suites: 3,
        bathrooms: 4,
        halfBathrooms: 0,
        parkingSpaces: 2,
        area: 164,
        balcony: 34,
        basePrice: 2_340_000,
      },
    ],
    seed: 17,
    massing: {
      floors: 4,
      unitsPerFloor: 2,
      towerWidth: 21,
      towerDepth: 17,
      floorHeight: 3.4,
    },
    amenities: ["garden", "pool", "spa", "ev", "security", "pet"],
    highlights: [
      "Estrutura em madeira engenheirada",
      "Acesso direto à Lagoa da Conceição",
      "Oito unidades, baixa densidade",
      "Paisagismo com espécies nativas",
    ],
    nearby: [
      { label: "Lagoa da Conceição", category: "Lazer", minutes: 4 },
      { label: "Praia Mole", category: "Lazer", minutes: 12 },
      { label: "Centro de Florianópolis", category: "Mobilidade", minutes: 20 },
      { label: "Aeroporto Hercílio Luz", category: "Mobilidade", minutes: 25 },
      { label: "Mercado da Lagoa", category: "Conveniência", minutes: 6 },
    ],
    launchDate: "2026-02-10",
    deliveryDate: "2028-01-15",
    featured: false,
  }),
  buildDevelopment({
    id: "dev_patio",
    agencyId: "agency_almeida",
    name: "Pátio Girassol",
    slug: "patio-girassol",
    tagline: "Um quarteirão inteiro pensado para morar.",
    description:
      "Um edifício de cinco andares na Vila Madalena que troca densidade por convivência. As 15 unidades se organizam em torno de um pátio arborizado, com varandas voltadas para o miolo do quarteirão. A obra foi entregue em 2025 e o paisagismo já está maduro.",
    status: "ready",
    type: "residential",
    address: {
      street: "Rua Girassol",
      number: "540",
      neighborhood: "Vila Madalena",
      city: "São Paulo",
      state: "SP",
      zipCode: "05433-001",
      country: "Brasil",
      coordinates: { lat: -23.5551, lng: -46.6895 },
    },
    coverImage: IMAGES.kitchen,
    gallery: [
      media("g_patio_1", IMAGES.kitchen, "Cozinha aberta para o pátio", "Cozinha", 0),
      media("g_patio_2", IMAGES.living, "Living com esquadrias amplas", "Living", 1),
      media("g_patio_3", IMAGES.suite, "Suíte com vista para o jardim", "Suíte", 2),
      media("g_patio_4", IMAGES.bath, "Banheiro revestido em pedra", "Banheiro", 3),
      media("g_patio_5", IMAGES.view, "Pátio arborizado", "Pátio", 4),
    ],
    floors: [1, 2, 3, 4, 5],
    templates: [
      {
        suffix: "A",
        name: "Apartamento 1 quarto",
        type: "1_bedroom",
        bedrooms: 1,
        suites: 0,
        bathrooms: 1,
        halfBathrooms: 0,
        parkingSpaces: 1,
        area: 48,
        balcony: 6,
        basePrice: 590_000,
      },
      {
        suffix: "B",
        name: "Apartamento 2 quartos",
        type: "2_bedrooms",
        bedrooms: 2,
        suites: 1,
        bathrooms: 2,
        halfBathrooms: 0,
        parkingSpaces: 1,
        area: 72,
        balcony: 9,
        basePrice: 890_000,
      },
      {
        suffix: "C",
        name: "Apartamento 3 quartos",
        type: "3_bedrooms",
        bedrooms: 3,
        suites: 1,
        bathrooms: 2,
        halfBathrooms: 1,
        parkingSpaces: 2,
        area: 96,
        balcony: 14,
        basePrice: 1_250_000,
      },
    ],
    seed: 23,
    massing: {
      floors: 5,
      unitsPerFloor: 3,
      towerWidth: 22,
      towerDepth: 14,
      floorHeight: 3.1,
    },
    amenities: ["garden", "pool", "gym", "party", "concierge", "pet", "delivery"],
    highlights: [
      "Pátio central de 600 m²",
      "Obra entregue e paisagismo maduro",
      "A 300 m do metrô Vila Madalena",
      "Apenas 15 unidades",
    ],
    nearby: [
      { label: "Metrô Vila Madalena", category: "Mobilidade", minutes: 4 },
      { label: "Praça da Vila Madalena", category: "Lazer", minutes: 6 },
      { label: "Mercado da Vila", category: "Conveniência", minutes: 3 },
      { label: "Escola Vera Cruz", category: "Educação", minutes: 10 },
      { label: "Hospital Sírio-Libanês", category: "Saúde", minutes: 14 },
    ],
    launchDate: "2023-04-18",
    deliveryDate: "2025-09-30",
    featured: false,
  }),
];

/* -------------------------------------------------------------------------- */
/* Leads                                                                      */
/* -------------------------------------------------------------------------- */

export const leads: Lead[] = [
  {
    id: "lead_001",
    developmentId: "dev_alto",
    unitId: "dev_alto_1202",
    name: "Beatriz Camargo",
    email: "beatriz.camargo@email.com",
    phone: "+55 11 99812-4477",
    message: "Tenho interesse no apartamento de 3 quartos. Gostaria de agendar visita.",
    source: "website",
    status: "qualified",
    assignedAgentId: "agent_marina",
    createdAt: new Date("2026-10-20T14:22:00Z"),
    updatedAt: new Date("2026-10-21T09:10:00Z"),
  },
  {
    id: "lead_002",
    developmentId: "dev_alto",
    unitId: "dev_alto_501",
    name: "Rafael Nogueira",
    email: "rafael.nogueira@email.com",
    phone: "+55 11 98765-1200",
    message: "Quero saber sobre o fluxo de pagamento do studio.",
    source: "social_media",
    status: "new",
    createdAt: new Date("2026-10-21T18:05:00Z"),
    updatedAt: new Date("2026-10-21T18:05:00Z"),
  },
  {
    id: "lead_003",
    developmentId: "dev_lume",
    unitId: "dev_lume_1503",
    name: "Carolina Reis",
    email: "carolina.reis@email.com",
    phone: "+55 21 99654-3321",
    message: "Preciso de um studio perto do metrô, com vaga. Ainda tem?",
    source: "portal",
    status: "contacted",
    assignedAgentId: "agent_diego",
    createdAt: new Date("2026-10-19T11:40:00Z"),
    updatedAt: new Date("2026-10-20T15:30:00Z"),
  },
  {
    id: "lead_004",
    developmentId: "dev_lume",
    unitId: "dev_lume_1806",
    name: "Thiago Menezes",
    email: "thiago.menezes@email.com",
    phone: "+55 21 98877-9090",
    message: "Quero visitar o decorado. Tenho horário à tarde.",
    source: "website",
    status: "visiting",
    createdAt: new Date("2026-10-18T09:15:00Z"),
    updatedAt: new Date("2026-10-22T10:00:00Z"),
  },
  {
    id: "lead_005",
    developmentId: "dev_vila",
    unitId: "dev_vila_203",
    name: "Helena Duarte",
    email: "helena.duarte@email.com",
    phone: "+55 31 99112-0088",
    message: "Gostaria de entender a diferença entre a casa terraço e a varanda.",
    source: "referral",
    status: "proposal",
    assignedAgentId: "agent_marina",
    createdAt: new Date("2026-10-15T16:00:00Z"),
    updatedAt: new Date("2026-10-22T12:20:00Z"),
  },
  {
    id: "lead_006",
    developmentId: "dev_casa",
    unitId: "dev_casa_202",
    name: "Marcos Vinícius",
    email: "marcos.vinicius@email.com",
    phone: "+55 48 99543-2210",
    message: "Sou investidor e queria a planta da casa lagoa.",
    source: "social_media",
    status: "closed_won",
    assignedAgentId: "agent_diego",
    createdAt: new Date("2026-10-02T10:30:00Z"),
    updatedAt: new Date("2026-10-16T17:45:00Z"),
  },
  {
    id: "lead_007",
    developmentId: "dev_alto",
    unitId: "dev_alto_1401",
    name: "Juliana Prado",
    email: "juliana.prado@email.com",
    phone: "+55 11 99431-8802",
    message: "Quero comparar a cobertura com o apartamento de 3 quartos.",
    source: "website",
    status: "contacted",
    assignedAgentId: "agent_marina",
    createdAt: new Date("2026-10-22T09:20:00Z"),
    updatedAt: new Date("2026-10-22T16:05:00Z"),
  },
  {
    id: "lead_008",
    developmentId: "dev_alto",
    unitId: "dev_alto_702",
    name: "André Salles",
    email: "andre.salles@email.com",
    phone: "+55 11 98890-1123",
    message: "Financiamento pelo banco. Podem enviar uma simulação?",
    source: "referral",
    status: "new",
    assignedAgentId: undefined,
    createdAt: new Date("2026-10-22T19:42:00Z"),
    updatedAt: new Date("2026-10-22T19:42:00Z"),
  },
  {
    id: "lead_009",
    developmentId: "dev_alto",
    unitId: "dev_alto_604",
    name: "Camila Ferraz",
    email: "camila.ferraz@email.com",
    phone: "+55 11 97654-3301",
    message: "Gostaria de visitar o decorado no sábado pela manhã.",
    source: "website",
    status: "visiting",
    assignedAgentId: "agent_marina",
    createdAt: new Date("2026-10-20T12:11:00Z"),
    updatedAt: new Date("2026-10-21T10:30:00Z"),
  },
  {
    id: "lead_010",
    developmentId: "dev_patio",
    unitId: "dev_patio_402",
    name: "Eduardo Lima",
    email: "eduardo.lima@email.com",
    phone: "+55 11 99102-7744",
    message: "Tenho interesse em uma unidade pronta para morar.",
    source: "walk_in",
    status: "proposal",
    assignedAgentId: "agent_marina",
    createdAt: new Date("2026-10-18T15:30:00Z"),
    updatedAt: new Date("2026-10-21T18:20:00Z"),
  },
];

/* -------------------------------------------------------------------------- */
/* Selectors                                                                  */
/* -------------------------------------------------------------------------- */

export function getAgencyById(id: string) {
  return agencies.find((agency) => agency.id === id);
}

export function getAgencyBySlug(slug: string) {
  return agencies.find((agency) => agency.slug === slug);
}

export function getDevelopmentBySlug(slug: string) {
  return developments.find((development) => development.slug === slug);
}

export function getDevelopmentById(id: string) {
  return developments.find((development) => development.id === id);
}

export function getDevelopmentsByAgency(agencyId: string) {
  return developments.filter((development) => development.agencyId === agencyId);
}

export function getUnitsByDevelopment(developmentId: string) {
  return developments
    .find((development) => development.id === developmentId)
    ?.units ?? [];
}

export function getFeaturedDevelopments() {
  return developments.filter((development) => development.featured === true);
}

export function getCities() {
  const map = new Map<string, { city: string; state: string; count: number }>();
  for (const development of developments) {
    const key = `${development.address.city}-${development.address.state}`;
    const entry = map.get(key);
    if (entry) entry.count += 1;
    else {
      map.set(key, {
        city: development.address.city,
        state: development.address.state,
        count: 1,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

export function platformStats() {
  const units = developments.flatMap((development) => development.units);
  const available = units.filter((unit) => unit.status === "available");
  return {
    developments: developments.length,
    agencies: agencies.length,
    units: units.length,
    availableUnits: available.length,
    cities: getCities().length,
    minPrice: Math.min(...available.map((unit) => unit.pricing.basePrice)),
  };
}
