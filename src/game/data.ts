import type {
  AchievementDef,
  ObjectiveDef,
  ResourceKey,
  StationDef,
  UnitDef,
  UnitUpgradeDef,
} from './types'

interface UpgradeCopy {
  name: string
  description: string
}

/** Textos das melhorias de cada unidade (4 por criatura). */
const UPGRADE_COPY: Record<string, UpgradeCopy[]> = {
  esqueleto: [
    { name: 'Ferramentas Quebradas', description: 'Pás rachadas e picaretas gastas desenterram mais corpos por noite.' },
    { name: 'Armadura Enferrujada', description: 'Chapas de um campo de batalha esquecido seguram os ossos unidos por mais tempo.' },
    { name: 'Ossos Reforçados', description: 'Fêmures banhados em resina sombria aguentam o primeiro golpe — e o segundo também.' },
    { name: 'Machado Amaldiçoado', description: 'O aço sussurra nomes esquecidos e corta muito mais fundo.' },
  ],
  zumbi: [
    { name: 'Carne Fresca', description: 'Retalhos novos cobrem o fedor antigo e o corpo responde mais rápido.' },
    { name: 'Mãos Calejadas', description: 'Dedos que nunca descansam carregam mais peso por vigília.' },
    { name: 'Sangue Pútrido', description: 'A seiva escura queima as veias e alimenta cada passo.' },
    { name: 'Coroa de Vermes', description: 'Os vermes sussurram ordens — e o zumbi obedece na hora.' },
  ],
  cavaleiro: [
    { name: 'Elmo Rachado', description: 'Aço amassado protege o crânio e intimida quem ainda respira.' },
    { name: 'Montaria Espectral', description: 'Um corcel de névoa atravessa muros e chega antes do galo cantar.' },
    { name: 'Lâmina Sepulcral', description: 'A espada guardada no túmulo nunca perdeu o fio.' },
    { name: 'Juramento Negro', description: 'O pacto antigo multiplica a lealdade do cavaleiro.' },
  ],
  necromante: [
    { name: 'Grimório Manchado', description: 'Páginas arrancadas de uma torre caída aceleram cada ritual.' },
    { name: 'Cajado de Osso', description: 'O cajado responde ao pulso de quem o empunha.' },
    { name: 'Círculo de Sigilos', description: 'Runas no chão concentram a essência que vem do além.' },
    { name: 'Pacto com o Abismo', description: 'Algo lá embaixo assina o contrato — e cobra depois.' },
  ],
  golem: [
    { name: 'Costelas de Titã', description: 'Ossos grandes demais para um único corpo formam a espinha do golem.' },
    { name: 'Núcleo de Âmbar', description: 'Uma pedra quente no peito move montanhas de osso.' },
    { name: 'Braços de Ferro', description: 'Placas fundidas transformam cada golpe em demolição.' },
    { name: 'Coração de Sepultura', description: 'Um coração enterrado por séculos volta a bater.' },
  ],
  dragao: [
    { name: 'Escamas Póstumas', description: 'Endurecidas na morte, são mais duras do que eram em vida.' },
    { name: 'Asas Esfarrapadas', description: 'Membranas podres ainda erguem toneladas de osso.' },
    { name: 'Sopro Sepulcral', description: 'A chama que sai da garganta nunca aqueceu ninguém — apenas apaga.' },
    { name: 'Alma do Primeiro Dragão', description: 'A primeira chama, guardada na Cripta, volta a arder.' },
  ],
}

interface UpgradeOptions {
  baseCost: number
  growth: number
  currency: ResourceKey
  firstRequirement: number
  requirementStep: number
}

const unitUpgrades = (unitId: string, options: UpgradeOptions): UnitUpgradeDef[] =>
  (UPGRADE_COPY[unitId] ?? []).map((copy, index) => ({
    id: `${unitId}-${index + 1}`,
    unitId,
    name: copy.name,
    description: copy.description,
    cost: Math.round(options.baseCost * Math.pow(options.growth, index)),
    currency: options.currency,
    multiplier: 2,
    requirement: options.firstRequirement + index * options.requirementStep,
  }))

/** Criaturas que o jogador ergue na Cripta. */
export const UNITS: UnitDef[] = [
  {
    id: 'esqueleto',
    name: 'Esqueleto',
    role: 'Servo ossudo',
    description: 'O primeiro soldado de qualquer necromante. Fraco, silencioso e infinitamente substituível.',
    sigil: 'skull',
    cost: 15,
    costGrowth: 1.15,
    produces: 'gold',
    baseRate: 0.5,
    evolvesTo: 'zumbi',
    evolutionCost: 10,
    upgrades: unitUpgrades('esqueleto', { baseCost: 120, growth: 6, currency: 'gold', firstRequirement: 1, requirementStep: 5 }),
  },
  {
    id: 'zumbi',
    name: 'Zumbi',
    role: 'Carne apodrecida',
    description: 'Caroço de carne que não sente dor. Onde o esqueleto falha, o zumbi simplesmente continua andando.',
    sigil: 'zombie',
    cost: 120,
    costGrowth: 1.15,
    produces: 'gold',
    baseRate: 3,
    evolvesTo: 'cavaleiro',
    evolutionCost: 10,
    upgrades: unitUpgrades('zumbi', { baseCost: 900, growth: 6, currency: 'gold', firstRequirement: 1, requirementStep: 5 }),
  },
  {
    id: 'cavaleiro',
    name: 'Cavaleiro Morto',
    role: 'Guarda sepulcral',
    description: 'Ainda lembra do juramento que fez em vida. Cumpre ordens com a lâmina que o matou.',
    sigil: 'knight',
    cost: 1_100,
    costGrowth: 1.15,
    produces: 'gold',
    baseRate: 14,
    upgrades: unitUpgrades('cavaleiro', { baseCost: 9_000, growth: 6, currency: 'gold', firstRequirement: 1, requirementStep: 5 }),
  },
  {
    id: 'necromante',
    name: 'Necromante',
    role: 'Aprendiz do Lich',
    description: 'Rouba a essência daqueles que já se foram e a entrega a você, gota por gota.',
    sigil: 'necromancer',
    cost: 12_000,
    costGrowth: 1.15,
    produces: 'essence',
    baseRate: 3,
    upgrades: unitUpgrades('necromante', { baseCost: 45, growth: 6, currency: 'essence', firstRequirement: 1, requirementStep: 5 }),
  },
  {
    id: 'golem',
    name: 'Golem de Ossos',
    role: 'Demolidor',
    description: 'Costelas de gigantes amarradas por magia. Traz ossos suficientes para erguer um exército.',
    sigil: 'golem',
    cost: 130_000,
    costGrowth: 1.15,
    produces: 'bones',
    baseRate: 40,
    upgrades: unitUpgrades('golem', { baseCost: 30_000, growth: 6, currency: 'gold', firstRequirement: 1, requirementStep: 5 }),
  },
  {
    id: 'dragao',
    name: 'Dragão Morto-Vivo',
    role: 'Açoite alado',
    description: 'A Cripta o guardou por três invernos. Quando ele levanta voo, a essência escorre do céu.',
    sigil: 'dragon',
    cost: 1_400_000,
    costGrowth: 1.15,
    produces: 'essence',
    baseRate: 30,
    upgrades: unitUpgrades('dragao', { baseCost: 180, growth: 6, currency: 'essence', firstRequirement: 1, requirementStep: 5 }),
  },
]

/** Construções do mapa: as estações são melhoradas com ouro. */
export const STATIONS: StationDef[] = [
  {
    id: 'cemiterio',
    name: 'Cemitério',
    role: 'Ossos',
    description: 'A terra fofa onde você começa. Cada nível aumenta tudo o que rende ossos — inclusive suas conjurações.',
    sigil: 'cemiterio',
    baseCost: 250,
    costGrowth: 1.6,
    bonusPerLevel: 0.25,
    effect: 'bones',
    group: 'estacoes',
  },
  {
    id: 'cripta',
    name: 'Cripta',
    role: 'Criação de Monstros',
    description: 'Bancadas frias onde a carne e o osso se juntam. Cada nível multiplica o ouro trazido pelos mortos.',
    sigil: 'cripta',
    baseCost: 800,
    costGrowth: 1.7,
    bonusPerLevel: 0.2,
    effect: 'gold',
    group: 'estacoes',
  },
  {
    id: 'acampamento',
    name: 'Acampamento',
    role: 'Recursos',
    description: 'Caldeirão sempre fervendo. O acampamento melhora a produção geral do seu reino.',
    sigil: 'acampamento',
    baseCost: 2_500,
    costGrowth: 1.8,
    bonusPerLevel: 0.15,
    effect: 'global',
    group: 'estacoes',
  },
  {
    id: 'forja',
    name: 'Forja Sombria',
    role: 'Upgrades',
    description: 'A bigorna que nunca esfria destila essência das almas mais teimosas.',
    sigil: 'forja',
    baseCost: 9_000,
    costGrowth: 1.9,
    bonusPerLevel: 0.3,
    effect: 'essence',
    group: 'estacoes',
  },
  {
    id: 'torre',
    name: 'Torre do Necromante',
    role: 'Melhorias Gerais',
    description: 'Seu posto de comando. Cada nível concede mais ossos a cada conjuração no Cemitério.',
    sigil: 'torre',
    baseCost: 150,
    costGrowth: 2.2,
    bonusPerLevel: 1,
    effect: 'click',
    group: 'outros',
  },
  {
    id: 'portal',
    name: 'Portal das Sombras',
    role: 'Novas Regiões',
    description: 'Uma fenda para reinos onde a morte já venceu. Cada nível amplifica toda a sua produção.',
    sigil: 'portal',
    baseCost: 250_000,
    costGrowth: 3.2,
    bonusPerLevel: 0.5,
    effect: 'global',
    group: 'outros',
  },
]

export const UNIT_BY_ID: Record<string, UnitDef> = Object.fromEntries(UNITS.map((unit) => [unit.id, unit]))
export const STATION_BY_ID: Record<string, StationDef> = Object.fromEntries(STATIONS.map((station) => [station.id, station]))
export const ALL_UPGRADES: UnitUpgradeDef[] = UNITS.flatMap((unit) => unit.upgrades)

export const RESOURCES: Record<ResourceKey, { label: string; sigil: string }> = {
  gold: { label: 'Ouro', sigil: 'coin' },
  bones: { label: 'Ossos', sigil: 'bone' },
  essence: { label: 'Essência', sigil: 'crystal' },
}

/** Objetivos iniciais — cada um é concluído uma única vez. */
export const OBJECTIVES: ObjectiveDef[] = [
  { id: 'esqueletos-5', text: 'Construa 5 Esqueletos', target: 5, reward: 150, current: (state) => state.units.esqueleto ?? 0 },
  { id: 'cliques-25', text: 'Conjure 25 vezes no Cemitério', target: 25, reward: 300, current: (state) => state.clicks },
  { id: 'cemiterio-3', text: 'Melhore o Cemitério para o nível 3', target: 3, reward: 600, current: (state) => state.stations.cemiterio ?? 0 },
  { id: 'zumbis-5', text: 'Erga 5 Zumbis', target: 5, reward: 1_200, current: (state) => state.units.zumbi ?? 0 },
  { id: 'nivel-5', text: 'Alcance o Nível 5', target: 5, reward: 4_000, current: (state) => state.level },
  { id: 'cavaleiros-10', text: 'Comande 10 Cavaleiros Mortos', target: 10, reward: 18_000, current: (state) => state.units.cavaleiro ?? 0 },
  { id: 'cripta-5', text: 'Melhore a Cripta para o nível 5', target: 5, reward: 45_000, current: (state) => state.stations.cripta ?? 0 },
  { id: 'portal-1', text: 'Abra o Portal das Sombras', target: 1, reward: 250_000, current: (state) => state.stations.portal ?? 0 },
]

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'primeiro-morto', name: 'Primeiro Morto', description: 'Erga seu primeiro esqueleto.', unlocked: (state) => (state.units.esqueleto ?? 0) >= 1 },
  { id: 'cemiterio-cheio', name: 'Cemitério Cheio', description: 'Tenha 50 esqueletos sob seu comando.', unlocked: (state) => (state.units.esqueleto ?? 0) >= 50 },
  { id: 'maos-calejadas', name: 'Mãos Calejadas', description: 'Conjure 250 vezes no Cemitério.', unlocked: (state) => state.clicks >= 250 },
  { id: 'legiao', name: 'Legião Ossuda', description: 'Some 100 criaturas em seu exército.', unlocked: (state) => UNITS.reduce((total, unit) => total + (state.units[unit.id] ?? 0), 0) >= 100 },
  { id: 'aprendiz', name: 'Aprendiz de Lich', description: 'Erga um Necromante.', unlocked: (state) => (state.units.necromante ?? 0) >= 1 },
  { id: 'fortuna', name: 'Fortuna Sombria', description: 'Acumule 1.000.000 de ouro em caixa.', unlocked: (state) => state.gold >= 1_000_000 },
  { id: 'nivel-10', name: 'Lich Supremo', description: 'Alcance o Nível 10.', unlocked: (state) => state.level >= 10 },
  { id: 'dragao', name: 'O Dragão Desperta', description: 'Erga um Dragão Morto-Vivo.', unlocked: (state) => (state.units.dragao ?? 0) >= 1 },
  { id: 'alem-portal', name: 'Além do Portal', description: 'Abra o Portal das Sombras.', unlocked: (state) => (state.stations.portal ?? 0) >= 1 },
]
