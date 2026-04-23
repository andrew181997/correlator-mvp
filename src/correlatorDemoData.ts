export type ServiceType = 'Канал' | 'Доступность' | 'Узел'

export type Service = {
  id: string
  name: string
  type: ServiceType
  owner: string
  tags: string[]
  metrics: string[]
}

export type CorrelationGroup = {
  id: string
  name: string
  serviceIds: string[]
  metricNames: string[]
  showReadinessIndicator: boolean
  isDefault: boolean
}

export type MetricDimension = {
  id: string
  name: string
  metrics: readonly string[]
}

export const METRIC_DIMENSIONS: MetricDimension[] = [
  {
    id: 'cpu',
    name: 'Процессор',
    metrics: ['Загрузка CPU %', 'Очередь CPU', 'Время ожидания CPU %', 'Температура CPU C'],
  },
  {
    id: 'memory',
    name: 'Память',
    metrics: ['Использование RAM %', 'Использование Swap %', 'Свободная память MB', 'Ошибки памяти / мин'],
  },
  {
    id: 'disk',
    name: 'Диски',
    metrics: ['Чтение диска IOPS', 'Запись диска IOPS', 'Заполненность диска %', 'Очередь диска'],
  },
  {
    id: 'network',
    name: 'Сеть',
    metrics: ['Входящий трафик Mbps', 'Исходящий трафик Mbps', 'Ошибки интерфейса / мин', 'Повторные передачи TCP'],
  },
  {
    id: 'latency',
    name: 'Задержки и качество',
    metrics: ['Задержка p95 ms', 'Задержка p99 ms', 'Джиттер ms', 'Потери пакетов %'],
  },
  {
    id: 'availability',
    name: 'Доступность и ошибки',
    metrics: ['Доступность %', 'Доля ошибок %', 'Таймауты API %', 'Неуспешные авторизации / мин'],
  },
  {
    id: 'traffic',
    name: 'Трафик и сессии',
    metrics: ['Запросы в секунду', 'Активные соединения', 'Одновременные сессии', 'Пропускная способность Mbps'],
  },
  {
    id: 'platform',
    name: 'Платформа и инфраструктура',
    metrics: ['Пул потоков %', 'Пауза GC ms', 'Очередь задач', 'Температура датчика C'],
  },
]

/** 32 уникальных показателя */
export const METRIC_NAMES = METRIC_DIMENSIONS.flatMap((dimension) => dimension.metrics) as readonly string[]

export const METRIC_TO_DIMENSION = Object.fromEntries(
  METRIC_DIMENSIONS.flatMap((dimension) => dimension.metrics.map((metric) => [metric, dimension.id])),
) as Record<string, string>

/** Все показатели на каждом сервисе — корректные комбинации в мастере и на графике */
const ALL_METRICS = [...METRIC_NAMES]

/** 22 сервиса (требование: +20 к исходным) */
export const DEMO_SERVICES: Service[] = [
  { id: 'srv-1', name: 'Moscow Core Router 01', type: 'Узел', owner: 'NOC', tags: ['core', 'msk'], metrics: ALL_METRICS },
  { id: 'srv-2', name: 'SPB Access Channel 17', type: 'Канал', owner: 'OPS', tags: ['access', 'spb'], metrics: ALL_METRICS },
  { id: 'srv-3', name: 'DC Availability Probe', type: 'Доступность', owner: 'SLA', tags: ['dc', 'probe'], metrics: ALL_METRICS },
  { id: 'srv-4', name: 'KZN Edge Router 03', type: 'Узел', owner: 'NOC', tags: ['edge', 'kzn'], metrics: ALL_METRICS },
  { id: 'srv-5', name: 'EKB Metro Switch 12', type: 'Узел', owner: 'NOC', tags: ['metro', 'ekb'], metrics: ALL_METRICS },
  { id: 'srv-6', name: 'NSK WAN Link Alpha', type: 'Канал', owner: 'OPS', tags: ['wan', 'nsk'], metrics: ALL_METRICS },
  { id: 'srv-7', name: 'NN VoIP Trunk 04', type: 'Канал', owner: 'Voice', tags: ['voip', 'nn'], metrics: ALL_METRICS },
  { id: 'srv-8', name: 'Samara CDN Edge', type: 'Узел', owner: 'CDN', tags: ['cdn', 'sam'], metrics: ALL_METRICS },
  { id: 'srv-9', name: 'Rostov DB Replica', type: 'Узел', owner: 'DBA', tags: ['db', 'rst'], metrics: ALL_METRICS },
  { id: 'srv-10', name: 'Volgograd API Gateway', type: 'Узел', owner: 'DevOps', tags: ['api', 'vlg'], metrics: ALL_METRICS },
  { id: 'srv-11', name: 'Perm Satellite Uplink', type: 'Канал', owner: 'OPS', tags: ['sat', 'perm'], metrics: ALL_METRICS },
  { id: 'srv-12', name: 'Ufa Power Monitoring', type: 'Доступность', owner: 'Facilities', tags: ['power', 'ufa'], metrics: ALL_METRICS },
  { id: 'srv-13', name: 'Krasnodar Wi‑Fi Controller', type: 'Узел', owner: 'WiFi', tags: ['wifi', 'krd'], metrics: ALL_METRICS },
  { id: 'srv-14', name: 'Sochi Event Streaming', type: 'Канал', owner: 'Media', tags: ['stream', 'sch'], metrics: ALL_METRICS },
  { id: 'srv-15', name: 'Voronezh Security Probe', type: 'Доступность', owner: 'Sec', tags: ['sec', 'vrn'], metrics: ALL_METRICS },
  { id: 'srv-16', name: 'Tula BGP Route Reflector', type: 'Узел', owner: 'NOC', tags: ['bgp', 'tul'], metrics: ALL_METRICS },
  { id: 'srv-17', name: 'Yaroslavl Storage Array', type: 'Узел', owner: 'Storage', tags: ['san', 'yar'], metrics: ALL_METRICS },
  { id: 'srv-18', name: 'Tver Kubernetes Node', type: 'Узел', owner: 'Platform', tags: ['k8s', 'tve'], metrics: ALL_METRICS },
  { id: 'srv-19', name: 'Kaliningrad Transatlantic', type: 'Канал', owner: 'OPS', tags: ['ix', 'kgd'], metrics: ALL_METRICS },
  { id: 'srv-20', name: 'Irkutsk DC Cooling', type: 'Доступность', owner: 'DC', tags: ['cool', 'irk'], metrics: ALL_METRICS },
  { id: 'srv-21', name: 'Vladivostok Maritime Link', type: 'Канал', owner: 'OPS', tags: ['marine', 'vvo'], metrics: ALL_METRICS },
  { id: 'srv-22', name: 'Yakutsk Remote Site', type: 'Доступность', owner: 'SLA', tags: ['remote', 'yak'], metrics: ALL_METRICS },
]

/** 10 преднастроенных групп корреляции */
export const DEMO_GROUPS: CorrelationGroup[] = [
  {
    id: 'grp-0',
    name: '20 сервисов - сводная корреляция',
    serviceIds: [
      'srv-1',
      'srv-2',
      'srv-3',
      'srv-4',
      'srv-5',
      'srv-6',
      'srv-7',
      'srv-8',
      'srv-9',
      'srv-10',
      'srv-11',
      'srv-12',
      'srv-13',
      'srv-14',
      'srv-15',
      'srv-16',
      'srv-17',
      'srv-18',
      'srv-19',
      'srv-20',
    ],
    metricNames: [
      'Загрузка CPU %',
      'Использование RAM %',
      'Заполненность диска %',
      'Входящий трафик Mbps',
      'Исходящий трафик Mbps',
      'Задержка p95 ms',
      'Потери пакетов %',
      'Доступность %',
    ],
    showReadinessIndicator: true,
    isDefault: true,
  },
  {
    id: 'grp-1',
    name: 'SLA Critical',
    serviceIds: ['srv-2', 'srv-3'],
    metricNames: ['Доступность %', 'Задержка p95 ms', 'Потери пакетов %'],
    showReadinessIndicator: true,
    isDefault: false,
  },
  {
    id: 'grp-2',
    name: 'Core Network Health',
    serviceIds: ['srv-1', 'srv-4'],
    metricNames: ['Загрузка CPU %', 'Использование RAM %', 'Доступность %'],
    showReadinessIndicator: true,
    isDefault: false,
  },
  {
    id: 'grp-3',
    name: 'East WAN Performance',
    serviceIds: ['srv-6', 'srv-11', 'srv-19'],
    metricNames: ['Задержка p95 ms', 'Задержка p99 ms', 'Потери пакетов %', 'Пропускная способность Mbps'],
    showReadinessIndicator: true,
    isDefault: false,
  },
  {
    id: 'grp-4',
    name: 'Voice & Media QoS',
    serviceIds: ['srv-7', 'srv-14'],
    metricNames: ['Джиттер ms', 'Потери пакетов %', 'Задержка p95 ms', 'Пропускная способность Mbps'],
    showReadinessIndicator: false,
    isDefault: false,
  },
  {
    id: 'grp-5',
    name: 'Database & Replication',
    serviceIds: ['srv-9', 'srv-17'],
    metricNames: ['Задержка p95 ms', 'Очередь задач', 'Активные соединения', 'Доля ошибок %'],
    showReadinessIndicator: true,
    isDefault: false,
  },
  {
    id: 'grp-6',
    name: 'API & Edge Security',
    serviceIds: ['srv-10', 'srv-15', 'srv-8'],
    metricNames: ['Доля ошибок %', 'Таймауты API %', 'Запросы в секунду', 'Неуспешные авторизации / мин'],
    showReadinessIndicator: true,
    isDefault: false,
  },
  {
    id: 'grp-7',
    name: 'Metro & Wi‑Fi Access',
    serviceIds: ['srv-5', 'srv-13'],
    metricNames: ['Активные соединения', 'Одновременные сессии', 'Доступность %', 'Повторные передачи TCP'],
    showReadinessIndicator: false,
    isDefault: false,
  },
  {
    id: 'grp-8',
    name: 'DC Facilities & Power',
    serviceIds: ['srv-12', 'srv-20'],
    metricNames: ['Температура датчика C', 'Температура CPU C', 'Чтение диска IOPS', 'Запись диска IOPS'],
    showReadinessIndicator: true,
    isDefault: false,
  },
  {
    id: 'grp-9',
    name: 'Platform & Compute',
    serviceIds: ['srv-18', 'srv-1'],
    metricNames: ['Загрузка CPU %', 'Использование RAM %', 'Пул потоков %', 'Пауза GC ms'],
    showReadinessIndicator: true,
    isDefault: false,
  },
  {
    id: 'grp-10',
    name: 'Global BGP & DNS',
    serviceIds: ['srv-16', 'srv-22', 'srv-4'],
    metricNames: ['Ошибки интерфейса / мин', 'Потери пакетов %', 'Задержка p99 ms', 'Доступность %'],
    showReadinessIndicator: false,
    isDefault: false,
  },
]

export const SERIES_COLORS = [
  '#2563eb',
  '#dc2626',
  '#16a34a',
  '#9333ea',
  '#d97706',
  '#db2777',
  '#0891b2',
  '#4f46e5',
  '#ca8a04',
  '#059669',
  '#ea580c',
  '#7c3aed',
  '#0d9488',
  '#be123c',
  '#65a30d',
  '#0369a1',
  '#c026d3',
  '#b45309',
  '#15803d',
  '#1d4ed8',
  '#991b1b',
  '#0f766e',
  '#5b21b6',
  '#a16207',
]
