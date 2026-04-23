import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { CorrelationChart, CorrelationTimeRangeToolbar } from './CorrelationChart'
import { defaultCustomRange, type ChartSeries, type TimeRangePreset } from './correlationChartModel'
import {
  DEMO_GROUPS,
  METRIC_DIMENSIONS,
  METRIC_TO_DIMENSION,
  DEMO_SERVICES,
  SERIES_COLORS,
  type CorrelationGroup,
  type Service,
  type ServiceType,
} from './correlatorDemoData'
import './App.css'

const WIZARD_SERVICES_PAGE_SIZE = 10
const WIZARD_METRICS_PAGE_SIZE = 12
const GROUP_NAME_MAX_LENGTH = 30
const ENTITY_FILTER_OPTIONS = [
  { key: 'serviceList', label: 'По списку' },
  { key: 'probes', label: 'По зондам' },
  { key: 'contracts', label: 'По контрактам' },
  { key: 'owners', label: 'По владельцам' },
  { key: 'accessPoints', label: 'По точкам доступа' },
  { key: 'metrics', label: 'По показателям' },
  { key: 'tags', label: 'По тегам' },
] as const
type EntityFilter = (typeof ENTITY_FILTER_OPTIONS)[number]['key']
const METRIC_FILTER_OPTIONS = [
  { key: 'list', label: 'По списку' },
  { key: 'dimension', label: 'По измерению' },
] as const
type MetricFilter = (typeof METRIC_FILTER_OPTIONS)[number]['key']
const SIDEBAR_STUB_SECTIONS = [
  {
    title: 'Мониторинг',
    items: ['Аналитика', 'Карта сервисов', 'События', 'Топология сети', 'Корреляция событий'],
  },
  { title: 'Отчёты', items: ['Отчёты SLA'] },
  {
    title: 'Инфраструктура',
    items: ['Сервисы', 'Контракты', 'Зонды', 'Точки доступа', 'Тесты', 'Показатели', 'SLA'],
  },
]

function truncateWithEllipsis(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value
  }
  return `${value.slice(0, maxLength)}...`
}

function WizardPagination({
  page,
  totalItems,
  pageSize,
  onPageChange,
}: {
  page: number
  totalItems: number
  pageSize: number
  onPageChange: (next: number) => void
}) {
  if (totalItems === 0) {
    return null
  }
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(Math.max(1, page), pageCount)
  const from = (safePage - 1) * pageSize + 1
  const to = Math.min(totalItems, safePage * pageSize)

  return (
    <div className="pagination-bar" role="navigation" aria-label="Пагинация списка">
      <button type="button" disabled={safePage <= 1} onClick={() => onPageChange(safePage - 1)}>
        Назад
      </button>
      <span className="pagination-info">
        {from}–{to} из {totalItems}
        {pageCount > 1 ? (
          <span className="muted">
            {' '}
            (стр. {safePage} / {pageCount})
          </span>
        ) : null}
      </span>
      <button type="button" disabled={safePage >= pageCount} onClick={() => onPageChange(safePage + 1)}>
        Вперёд
      </button>
    </div>
  )
}

function IconEdit({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconDelete({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconDefaultGroup({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6-4.4-6 4.4 2.3-7-6-4.6h7.6L12 2z" />
    </svg>
  )
}

function App() {
  const [groups, setGroups] = useState<CorrelationGroup[]>(DEMO_GROUPS)
  const [activeGroupId, setActiveGroupId] = useState<string>(DEMO_GROUPS[0].id)
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null)

  const activeGroup = groups.find((group) => group.id === activeGroupId) ?? groups[0]

  const upsertGroup = (input: CorrelationGroup, mode: 'create' | 'edit') => {
    setGroups((current) => {
      let next = current

      if (input.isDefault) {
        next = next.map((group) => ({ ...group, isDefault: false }))
      }

      if (mode === 'create') {
        return [...next, input]
      }

      return next.map((group) => (group.id === input.id ? input : group))
    })
    setActiveGroupId(input.id)
  }

  const deleteGroup = (groupId: string) => {
    setGroups((current) => {
      const next = current.filter((group) => group.id !== groupId)
      const hasDefault = next.some((group) => group.isDefault)
      if (!hasDefault && next[0]) {
        next[0] = { ...next[0], isDefault: true }
      }
      return next
    })
    setActiveGroupId((current) => (current === groupId ? groups[0]?.id ?? '' : current))
    setDeleteGroupId(null)
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <CorrelatorPage
            key={activeGroup?.id}
            groups={groups}
            services={DEMO_SERVICES}
            activeGroup={activeGroup}
            onActivate={setActiveGroupId}
            onDeleteRequest={setDeleteGroupId}
          />
        }
      />
      <Route
        path="/groups/new"
        element={
          <CorrelationWizardPage
            mode="create"
            services={DEMO_SERVICES}
            onSave={upsertGroup}
          />
        }
      />
      <Route
        path="/groups/:groupId/edit"
        element={
          <CorrelationWizardPage
            mode="edit"
            groups={groups}
            services={DEMO_SERVICES}
            onSave={upsertGroup}
          />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />

      {deleteGroupId ? (
        <DeleteModal
          onCancel={() => setDeleteGroupId(null)}
          onConfirm={() => deleteGroup(deleteGroupId)}
        />
      ) : null}
    </Routes>
  )
}

function getServiceEntityValues(service: Service, entity: EntityFilter): string[] {
  switch (entity) {
    case 'serviceList':
      return [service.name]
    case 'owners':
      return [service.owner]
    case 'contracts':
      return [`Контракт ${service.type}`, `CTR-${service.id.replace('srv-', '')}`]
    case 'accessPoints':
      return [
        `${service.name.split(' ')[0]} POP`,
        `AP-${service.tags[0]?.toUpperCase() ?? service.id.toUpperCase()}`,
      ]
    case 'probes':
      return service.type === 'Доступность'
        ? ['Проба доступности', 'SLA probe']
        : ['Сервисный зонд']
    case 'metrics':
      return service.metrics
    case 'tags':
      return service.tags
    default:
      return []
  }
}

type CorrelatorPageProps = {
  groups: CorrelationGroup[]
  services: Service[]
  activeGroup?: CorrelationGroup
  onActivate: (groupId: string) => void
  onDeleteRequest: (groupId: string) => void
}

function CorrelatorPage({
  groups,
  services,
  activeGroup,
  onActivate,
  onDeleteRequest,
}: CorrelatorPageProps) {
  const navigate = useNavigate()
  const [timePreset, setTimePreset] = useState<TimeRangePreset>('day')
  const [customFrom, setCustomFrom] = useState(() => defaultCustomRange().from)
  const [customTo, setCustomTo] = useState(() => defaultCustomRange().to)
  const [focusedSeriesKey, setFocusedSeriesKey] = useState<string | null>(null)
  const [serviceSearch, setServiceSearch] = useState('')
  const [expandedServiceIds, setExpandedServiceIds] = useState<string[]>([])

  const selectedServices = services.filter((service) => activeGroup?.serviceIds.includes(service.id))
  const serviceDimensionGroups = useMemo(
    () =>
      selectedServices.map((service) => {
        const dimensions = METRIC_DIMENSIONS.filter((dimension) =>
          dimension.metrics.some(
            (metric) => service.metrics.includes(metric) && activeGroup?.metricNames.includes(metric),
          ),
        )
        return { service, dimensions }
      }),
    [activeGroup?.metricNames, selectedServices],
  )
  const [enabledServiceDimensions, setEnabledServiceDimensions] = useState<string[]>(() =>
    serviceDimensionGroups.flatMap(({ service, dimensions }) =>
      dimensions.map((dimension) => `${service.id}::${dimension.id}`),
    ),
  )
  const filteredServiceDimensionGroups = useMemo(
    () =>
      serviceDimensionGroups.filter(({ service, dimensions }) => {
        const query = serviceSearch.toLowerCase().trim()
        return (
          query.length === 0 ||
          service.name.toLowerCase().includes(query) ||
          dimensions.some((dimension) => dimension.name.toLowerCase().includes(query))
        )
      }),
    [serviceDimensionGroups, serviceSearch],
  )

  const legendRows = selectedServices.flatMap((service, serviceIndex) => {
    const availableMetrics = service.metrics.filter((metric) => activeGroup?.metricNames.includes(metric))
    const metricsInEnabledDimensions = availableMetrics.filter(
      (metric) => enabledServiceDimensions.includes(`${service.id}::${METRIC_TO_DIMENSION[metric]}`) || false,
    )
    return metricsInEnabledDimensions.map((metricName, metricIndex) => ({
      key: `${service.id}__${metricName}`,
      label: `${metricName} (${service.name})`,
      color: SERIES_COLORS[(serviceIndex + metricIndex) % SERIES_COLORS.length],
      muted: focusedSeriesKey ? focusedSeriesKey !== `${service.id}__${metricName}` : false,
    }))
  })

  const displayedLegendRows = focusedSeriesKey
    ? legendRows.filter((row) => row.key === focusedSeriesKey)
    : legendRows

  const chartSeries: ChartSeries[] = displayedLegendRows.map((row, index) => ({
    key: row.key,
    dataKey: `v${index}`,
    label: row.label,
    color: row.color,
  }))

  return (
    <div className="app-shell">
      <aside className="sidebar-stub" aria-label="Боковое меню (заглушка)">
        {SIDEBAR_STUB_SECTIONS.map((section) => (
          <section key={section.title} className="sidebar-stub-section">
            <h3>{section.title}</h3>
            <ul>
              {section.items.map((item) => (
                <li key={item}>
                  <span className="sidebar-stub-item" aria-disabled="true">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </aside>

      <main className="layout">
        <header className="topbar">
          <h1>Коррелятор сервисов</h1>
          <button className="primary" onClick={() => navigate('/groups/new')}>
            Создать группу корреляции
          </button>
        </header>

        <section className="workspace">
          <section className="view">
            <section className="panel panel--groups-top" aria-label="Группы корреляции">
              <h2>Группы корреляции</h2>
              <ul className="group-list group-list--compact">
                {groups.map((group) => {
                  const isLongGroupName = group.name.length > GROUP_NAME_MAX_LENGTH
                  const groupName = truncateWithEllipsis(group.name, GROUP_NAME_MAX_LENGTH)
                  return (
                    <li
                      key={group.id}
                      className={group.id === activeGroup?.id ? 'group-item active' : 'group-item'}
                    >
                      <div className="group-row">
                        <button type="button" className="group-link" onClick={() => onActivate(group.id)}>
                          <span className="group-name" title={isLongGroupName ? group.name : undefined}>
                            {groupName}
                          </span>
                          {group.isDefault ? (
                            <span
                              className="group-default-badge"
                              title="Группа открывается по умолчанию при входе в коррелятор"
                            >
                              <IconDefaultGroup className="group-default-icon" />
                              <span className="visually-hidden">Открывается по умолчанию</span>
                            </span>
                          ) : null}
                        </button>
                        <div className="group-actions">
                          <button
                            type="button"
                            className="icon-button"
                            aria-label={`Редактировать группу «${group.name}»`}
                            onClick={(event) => {
                              event.stopPropagation()
                              navigate(`/groups/${group.id}/edit`)
                            }}
                          >
                            <IconEdit />
                          </button>
                          <button
                            type="button"
                            className="icon-button icon-button--danger"
                            aria-label={`Удалить группу «${group.name}»`}
                            onClick={(event) => {
                              event.stopPropagation()
                              onDeleteRequest(group.id)
                            }}
                          >
                            <IconDelete />
                          </button>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>

            <h2>{activeGroup?.name ?? 'Группа не выбрана'}</h2>
            <p className="muted">
              Индикатор готовности:{' '}
              <strong>{activeGroup?.showReadinessIndicator ? 'Включен' : 'Выключен'}</strong>
            </p>

            <CorrelationTimeRangeToolbar
              value={timePreset}
              onChange={setTimePreset}
              customFrom={customFrom}
              customTo={customTo}
              onCustomFromChange={setCustomFrom}
              onCustomToChange={setCustomTo}
            />

            <CorrelationChart
              series={chartSeries}
              timePreset={timePreset}
              customFrom={customFrom}
              customTo={customTo}
            />

            <div className="legend">
              {legendRows.map((row) => (
                <button
                  type="button"
                  key={row.key}
                  className={row.muted ? 'legend-item muted' : 'legend-item'}
                  onClick={() => setFocusedSeriesKey((current) => (current === row.key ? null : row.key))}
                >
                  <span className="dot" style={{ backgroundColor: row.color }} />
                  {row.label}
                </button>
              ))}
            </div>
          </section>

          <aside className="panel panel--services" aria-label="Сервисы и измерения">
            <div className="service-metrics-panel">
              <h3>Измерения и показатели</h3>
              <div className="filters service-filters">
                <label>
                  Поиск по сервису или измерению
                  <input
                    value={serviceSearch}
                    onChange={(event) => setServiceSearch(event.target.value)}
                    placeholder="Например: Moscow или Сеть"
                  />
                </label>
              </div>
              <div className="service-card-actions">
                <button
                  type="button"
                  onClick={() => {
                    setEnabledServiceDimensions(
                      serviceDimensionGroups.flatMap(({ service, dimensions }) =>
                        dimensions.map((dimension) => `${service.id}::${dimension.id}`),
                      ),
                    )
                    setFocusedSeriesKey(null)
                  }}
                >
                  Вкл. все измерения
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEnabledServiceDimensions([])
                    setFocusedSeriesKey(null)
                  }}
                >
                  Выкл. все измерения
                </button>
              </div>
              <div className="dimension-grid">
                {filteredServiceDimensionGroups.map(({ service, dimensions }) => {
                  const activeCount = dimensions.filter((dimension) =>
                    enabledServiceDimensions.includes(`${service.id}::${dimension.id}`),
                  ).length
                  const isExpanded = expandedServiceIds.includes(service.id)
                  return (
                    <article key={service.id} className="service-dimensions-card">
                      <button
                        type="button"
                        className="service-dimensions-head"
                        onClick={() =>
                          setExpandedServiceIds((current) =>
                            current.includes(service.id)
                              ? current.filter((id) => id !== service.id)
                              : [...current, service.id],
                          )
                        }
                      >
                        <strong>{service.name}</strong>
                        <span className="muted">
                          {service.type} · {activeCount}/{dimensions.length} измерений
                        </span>
                      </button>
                      {isExpanded ? (
                        <div className="service-dimensions-body">
                          {dimensions.map((dimension) => {
                            const dimensionKey = `${service.id}::${dimension.id}`
                            return (
                              <label key={dimensionKey} className="metric-checkbox">
                                <input
                                  type="checkbox"
                                  checked={enabledServiceDimensions.includes(dimensionKey)}
                                  onChange={(event) => {
                                    setFocusedSeriesKey(null)
                                    if (event.target.checked) {
                                      setEnabledServiceDimensions((current) => [...new Set([...current, dimensionKey])])
                                      return
                                    }
                                    setEnabledServiceDimensions((current) =>
                                      current.filter((item) => item !== dimensionKey),
                                    )
                                  }}
                                />
                                <span>
                                  <strong>{dimension.name}</strong>
                                  <small className="muted dimension-metrics-preview">
                                    {dimension.metrics
                                      .filter(
                                        (metric) =>
                                          service.metrics.includes(metric) && activeGroup?.metricNames.includes(metric),
                                      )
                                      .join(', ')}
                                  </small>
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      ) : null}
                    </article>
                  )
                })}
                {filteredServiceDimensionGroups.length === 0 ? (
                  <p className="muted">Нет сервисов по выбранным фильтрам.</p>
                ) : null}
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  )
}

type WizardProps = {
  mode: 'create' | 'edit'
  groups?: CorrelationGroup[]
  services: Service[]
  onSave: (group: CorrelationGroup, mode: 'create' | 'edit') => void
}

function CorrelationWizardPage({ mode, groups, services, onSave }: WizardProps) {
  const navigate = useNavigate()
  const { groupId } = useParams()
  const target = groups?.find((group) => group.id === groupId)

  const [step, setStep] = useState(1)
  const [serviceTypeFilter, setServiceTypeFilter] = useState<ServiceType | 'Все'>('Все')
  const [entityFilter, setEntityFilter] = useState<EntityFilter>('owners')
  const [entitySearch, setEntitySearch] = useState('')
  const [entityMenuOpen, setEntityMenuOpen] = useState(false)
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(
    target?.serviceIds ?? [],
  )
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(target?.metricNames ?? [])
  const [name, setName] = useState(target?.name ?? '')
  const [showReadiness, setShowReadiness] = useState(target?.showReadinessIndicator ?? true)
  const [isDefault, setIsDefault] = useState(target?.isDefault ?? false)
  const [submitted, setSubmitted] = useState(false)
  const [servicePage, setServicePage] = useState(1)
  const [metricsPage, setMetricsPage] = useState(1)
  const [metricFilter, setMetricFilter] = useState<MetricFilter>('list')
  const [metricSearch, setMetricSearch] = useState('')
  const [metricMenuOpen, setMetricMenuOpen] = useState(false)

  const entityAutocompleteOptions = useMemo(
    () =>
      [...new Set(services.flatMap((service) => getServiceEntityValues(service, entityFilter)))]
        .filter((value) => value.length > 0)
        .sort((left, right) => left.localeCompare(right, 'ru')),
    [entityFilter, services],
  )

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const typeFits = serviceTypeFilter === 'Все' || service.type === serviceTypeFilter
      const entityValues = getServiceEntityValues(service, entityFilter)
      const entityFits =
        entitySearch.trim().length === 0 ||
        entityValues.some((value) => value.toLowerCase().includes(entitySearch.toLowerCase().trim()))
      return typeFits && entityFits
    })
  }, [entityFilter, entitySearch, serviceTypeFilter, services])

  const availableMetrics = useMemo(() => {
    const fromSelected = services
      .filter((service) => selectedServiceIds.includes(service.id))
      .flatMap((service) => service.metrics)
    return [...new Set(fromSelected)].sort((left, right) => left.localeCompare(right))
  }, [selectedServiceIds, services])

  const servicePageCount = Math.max(1, Math.ceil(filteredServices.length / WIZARD_SERVICES_PAGE_SIZE))
  const safeServicePage = Math.min(Math.max(1, servicePage), servicePageCount)

  const filteredMetrics = useMemo(() => {
    const query = metricSearch.toLowerCase().trim()
    if (query.length === 0) {
      return availableMetrics
    }

    return availableMetrics.filter((metric) => {
      if (metricFilter === 'list') {
        return metric.toLowerCase().includes(query)
      }
      const dimensionId = METRIC_TO_DIMENSION[metric]
      const dimensionName = METRIC_DIMENSIONS.find((dimension) => dimension.id === dimensionId)?.name ?? ''
      return dimensionName.toLowerCase().includes(query)
    })
  }, [availableMetrics, metricFilter, metricSearch])

  const metricAutocompleteOptions = useMemo(() => {
    if (metricFilter === 'list') {
      return availableMetrics
    }

    return [...new Set(availableMetrics.map((metric) => METRIC_TO_DIMENSION[metric]))]
      .map((dimensionId) => METRIC_DIMENSIONS.find((dimension) => dimension.id === dimensionId)?.name ?? '')
      .filter((value) => value.length > 0)
      .sort((left, right) => left.localeCompare(right, 'ru'))
  }, [availableMetrics, metricFilter])

  const metricsPageCount = Math.max(1, Math.ceil(filteredMetrics.length / WIZARD_METRICS_PAGE_SIZE))
  const safeMetricsPage = Math.min(Math.max(1, metricsPage), metricsPageCount)

  const paginatedServices = useMemo(() => {
    const start = (safeServicePage - 1) * WIZARD_SERVICES_PAGE_SIZE
    return filteredServices.slice(start, start + WIZARD_SERVICES_PAGE_SIZE)
  }, [filteredServices, safeServicePage])

  const paginatedMetrics = useMemo(() => {
    const start = (safeMetricsPage - 1) * WIZARD_METRICS_PAGE_SIZE
    return filteredMetrics.slice(start, start + WIZARD_METRICS_PAGE_SIZE)
  }, [filteredMetrics, safeMetricsPage])

  if (mode === 'edit' && !target) {
    return <Navigate to="/" replace />
  }

  const isStep1Valid = selectedServiceIds.length > 0
  const isStep3Valid = name.trim().length > 0

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (!isStep3Valid) return

    const finalGroup: CorrelationGroup = {
      id: target?.id ?? `grp-${crypto.randomUUID()}`,
      name: name.trim(),
      serviceIds: selectedServiceIds,
      metricNames: selectedMetrics,
      showReadinessIndicator: showReadiness,
      isDefault,
    }

    onSave(finalGroup, mode)
    navigate('/')
  }

  return (
    <main className="wizard-fullscreen">
      <header className="wizard-header">
        <h1>{mode === 'create' ? 'Создание группы корреляции' : 'Редактирование группы'}</h1>
        <p className="muted">Шаг {step} из 3</p>
      </header>

      <form onSubmit={onSubmit} className="wizard-card wizard-card--fullscreen">
        <div className="steps">
          <span className={step === 1 ? 'step active' : 'step'}>1. Выбор сервисов</span>
          <span className={step === 2 ? 'step active' : 'step'}>2. Выбор показателей</span>
          <span className={step === 3 ? 'step active' : 'step'}>3. Настройки</span>
        </div>

        <div className="wizard-body-scroll">
        {step === 1 ? (
          <section>
            <div className="filters">
              <label>
                Тип сервиса
                <select
                  value={serviceTypeFilter}
                  onChange={(event) => {
                    setServiceTypeFilter(event.target.value as ServiceType | 'Все')
                    setServicePage(1)
                  }}
                >
                  <option value="Все">Все</option>
                  <option value="Канал">Канал</option>
                  <option value="Доступность">Доступность</option>
                  <option value="Узел">Узел</option>
                </select>
              </label>
              <div className="entity-search">
                <button
                  type="button"
                  className="entity-search-trigger"
                  onClick={() => setEntityMenuOpen((current) => !current)}
                  aria-expanded={entityMenuOpen}
                >
                  {ENTITY_FILTER_OPTIONS.find((option) => option.key === entityFilter)?.label}
                </button>
                {entityMenuOpen ? (
                  <div className="entity-search-menu" role="menu">
                    {ENTITY_FILTER_OPTIONS.map((entityOption) => (
                      <button
                        key={entityOption.key}
                        type="button"
                        role="menuitemradio"
                        aria-checked={entityOption.key === entityFilter}
                        className={entityOption.key === entityFilter ? 'entity-search-item active' : 'entity-search-item'}
                        onClick={() => {
                          setEntityFilter(entityOption.key)
                          setEntitySearch('')
                          setServicePage(1)
                          setEntityMenuOpen(false)
                        }}
                      >
                        {entityOption.label}
                      </button>
                    ))}
                  </div>
                ) : null}
                <label className="entity-search-input-wrap">
                  <span className="visually-hidden">Поиск по выбранной сущности</span>
                  <input
                    value={entitySearch}
                    onChange={(event) => {
                      setEntitySearch(event.target.value)
                      setServicePage(1)
                    }}
                    list="entity-search-options"
                    placeholder={`${ENTITY_FILTER_OPTIONS.find((option) => option.key === entityFilter)?.label}:`}
                  />
                </label>
                <datalist id="entity-search-options">
                  {entityAutocompleteOptions.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              </div>
            </div>

            <label className="master-checkbox">
              <input
                type="checkbox"
                checked={filteredServices.length > 0 && filteredServices.every((service) => selectedServiceIds.includes(service.id))}
                onChange={(event) => {
                  const filteredIds = filteredServices.map((service) => service.id)
                  if (event.target.checked) {
                    setSelectedServiceIds([...new Set([...selectedServiceIds, ...filteredIds])])
                    return
                  }
                  setSelectedServiceIds(selectedServiceIds.filter((id) => !filteredIds.includes(id)))
                }}
              />
              Выбрать все в текущем фильтре
            </label>

            <div className="list wizard-list">
              {paginatedServices.map((service) => (
                <label key={service.id} className="list-item">
                  <input
                    type="checkbox"
                    checked={selectedServiceIds.includes(service.id)}
                    onChange={(event) => {
                      if (event.target.checked) {
                        setSelectedServiceIds([...selectedServiceIds, service.id])
                        return
                      }
                      setSelectedServiceIds(selectedServiceIds.filter((id) => id !== service.id))
                    }}
                  />
                  <span>{service.name}</span>
                  <small>{service.type}</small>
                </label>
              ))}
            </div>
            <WizardPagination
              page={safeServicePage}
              totalItems={filteredServices.length}
              pageSize={WIZARD_SERVICES_PAGE_SIZE}
              onPageChange={setServicePage}
            />
          </section>
        ) : null}

        {step === 2 ? (
          <section>
            <div className="filters filters--metrics">
              <div className="entity-search">
                <button
                  type="button"
                  className="entity-search-trigger"
                  onClick={() => setMetricMenuOpen((current) => !current)}
                  aria-expanded={metricMenuOpen}
                >
                  {METRIC_FILTER_OPTIONS.find((option) => option.key === metricFilter)?.label}
                </button>
                {metricMenuOpen ? (
                  <div className="entity-search-menu" role="menu">
                    {METRIC_FILTER_OPTIONS.map((metricOption) => (
                      <button
                        key={metricOption.key}
                        type="button"
                        role="menuitemradio"
                        aria-checked={metricOption.key === metricFilter}
                        className={metricOption.key === metricFilter ? 'entity-search-item active' : 'entity-search-item'}
                        onClick={() => {
                          setMetricFilter(metricOption.key)
                          setMetricSearch('')
                          setMetricsPage(1)
                          setMetricMenuOpen(false)
                        }}
                      >
                        {metricOption.label}
                      </button>
                    ))}
                  </div>
                ) : null}
                <label className="entity-search-input-wrap">
                  <span className="visually-hidden">Поиск показателей</span>
                  <input
                    value={metricSearch}
                    onChange={(event) => {
                      setMetricSearch(event.target.value)
                      setMetricsPage(1)
                    }}
                    placeholder={
                      metricFilter === 'dimension'
                        ? 'Например: Память'
                        : 'Например: Загрузка CPU %'
                    }
                    list="metric-filter-options"
                  />
                </label>
                <datalist id="metric-filter-options">
                  {metricAutocompleteOptions.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              </div>
            </div>
            <label className="master-checkbox">
              <input
                type="checkbox"
                checked={
                  filteredMetrics.length > 0 &&
                  filteredMetrics.every((metric) => selectedMetrics.includes(metric))
                }
                onChange={(event) => {
                  if (event.target.checked) {
                    setSelectedMetrics((current) => [...new Set([...current, ...filteredMetrics])])
                    return
                  }
                  setSelectedMetrics((current) =>
                    current.filter((selectedMetric) => !filteredMetrics.includes(selectedMetric)),
                  )
                }}
              />
              Выбрать все показатели в текущем фильтре
            </label>

            <div className="list wizard-list">
              {paginatedMetrics.map((metric) => (
                <label key={metric} className="list-item">
                  <input
                    type="checkbox"
                    checked={selectedMetrics.includes(metric)}
                    onChange={(event) => {
                      if (event.target.checked) {
                        setSelectedMetrics([...selectedMetrics, metric])
                        return
                      }
                      setSelectedMetrics(selectedMetrics.filter((item) => item !== metric))
                    }}
                  />
                  <span>{metric}</span>
                </label>
              ))}
              {filteredMetrics.length === 0 ? (
                <p className="muted">Нет показателей. Вернитесь к выбору сервисов.</p>
              ) : null}
            </div>
            <WizardPagination
              page={safeMetricsPage}
              totalItems={filteredMetrics.length}
              pageSize={WIZARD_METRICS_PAGE_SIZE}
              onPageChange={setMetricsPage}
            />
          </section>
        ) : null}

        {step === 3 ? (
          <section>
            <label>
              Название группы корреляции *
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            {submitted && !isStep3Valid ? (
              <p className="error">Введите название группы.</p>
            ) : null}

            <label className="master-checkbox">
              <input
                type="checkbox"
                checked={showReadiness}
                onChange={(event) => setShowReadiness(event.target.checked)}
              />
              Показывать индикатор готовности сервиса
            </label>

            <label className="master-checkbox">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(event) => setIsDefault(event.target.checked)}
              />
              Открывать группу по умолчанию
            </label>
          </section>
        ) : null}
        </div>

        <footer className="actions wizard-footer">
          <button type="button" onClick={() => (step === 1 ? navigate('/') : setStep(step - 1))}>
            {step === 1 ? 'Отмена' : 'Назад'}
          </button>
          {step < 3 ? (
            <button
              type="button"
              className="primary"
              disabled={step === 1 && !isStep1Valid}
              onClick={() => {
                if (step === 1) {
                  setMetricsPage(1)
                }
                setStep(step + 1)
              }}
            >
              Далее
            </button>
          ) : (
            <button type="submit" className="primary">
              Сохранить
            </button>
          )}
        </footer>
      </form>
    </main>
  )
}

function DeleteModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="backdrop">
      <div className="modal">
        <h3>Пожалуйста, подтвердите Ваше действие</h3>
        <div className="actions">
          <button className="danger" onClick={onConfirm}>
            Удалить
          </button>
          <button onClick={onCancel}>Отмена</button>
        </div>
      </div>
    </div>
  )
}

export default App
