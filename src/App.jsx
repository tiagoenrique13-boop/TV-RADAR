
import React, { useEffect, useMemo, useState } from 'react'
import {
  Activity, Bell, Check, ChevronDown, ExternalLink, Plus,
  Search, SlidersHorizontal, Trash2, Tv, TrendingDown, Wallet
} from 'lucide-react'

const STORAGE_KEY = 'tv-radar-data'

const money = value => {
  if (value == null || value === '') return '—'
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  })
}

const date = value => {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('pt-BR')
}

const dateTime = value => {
  if (!value) return '—'
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Recupera os dados manuais já salvos neste navegador.
const loadSavedProducts = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

// Combina o catálogo novo com os registros manuais existentes.
// Os campos de preço, loja, link e histórico são preservados.
const mergeCatalog = (catalog, savedProducts) => {
  const savedById = new Map(
    savedProducts.map(product => [product.id, product])
  )

  const activeProducts = catalog
    .filter(model => model.active !== false)
    .map(model => {
      const saved = savedById.get(model.id) || {}

      return {
        ...model,
        tech: model.technology || model.tech || '',
        price: saved.price ?? null,
        store: saved.store || '',
        url: saved.url || '',
        history: Array.isArray(saved.history) ? saved.history : []
      }
    })

  // Mantém modelos antigos fora do catálogo ativo para não perder
  // registros manuais caso sejam necessários novamente.
  const catalogIds = new Set(catalog.map(model => model.id))

  const archivedProducts = savedProducts
    .filter(product => !catalogIds.has(product.id))
    .map(product => ({
      ...product,
      active: false,
      legacy: true
    }))

  return [...activeProducts, ...archivedProducts]
}

function PriceChart({ records }) {
  const values = records
    .map(record => Number(record.price))
    .filter(value => Number.isFinite(value) && value > 0)

  if (!values.length) return null

  const min = Math.min(...values)
  const max = Math.max(...values)

  const points = values.map((value, index) => {
    const x = values.length === 1
      ? 50
      : 8 + index * 84 / (values.length - 1)

    const y = max === min
      ? 25
      : 43 - ((value - min) / (max - min)) * 34

    return `${x},${y}`
  })

  return (
    <svg
      className="price-chart"
      viewBox="0 0 100 50"
      preserveAspectRatio="none"
      role="img"
      aria-label="Histórico de preços"
    >
      {points.length > 1 && (
        <polyline
          points={points.join(' ')}
          fill="none"
          stroke="#d5f34b"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      )}

      {points.map((point, index) => {
        const [x, y] = point.split(',')
        return (
          <circle
            key={index}
            cx={x}
            cy={y}
            r="2.3"
            fill="#d5f34b"
          />
        )
      })}
    </svg>
  )
}

export default function App() {
  const [products, setProducts] = useState(loadSavedProducts)
  const [catalogLoaded, setCatalogLoaded] = useState(false)
  const [catalogError, setCatalogError] = useState(false)

  const [query, setQuery] = useState('')
  const [tech, setTech] = useState('Todas')
  const [editing, setEditing] = useState(null)
  const [tab, setTab] = useState('radar')
  const [notice, setNotice] = useState('')

  const [autoData, setAutoData] = useState({
    records: [],
    lastUpdated: null
  })
  const [autoStatus, setAutoStatus] = useState('Carregando...')

  const activeProducts = useMemo(
    () => products.filter(product => product.active !== false),
    [products]
  )

  const modelById = useMemo(() => {
    return new Map(activeProducts.map(product => [product.id, product]))
  }, [activeProducts])

  // Carrega o catálogo externo e combina com os dados locais.
  useEffect(() => {
    let cancelled = false

    fetch(`${import.meta.env.BASE_URL}data/models.json`, {
      cache: 'no-store'
    })
      .then(response => {
        if (!response.ok) throw new Error('Catálogo indisponível')
        return response.json()
      })
      .then(data => {
        if (!Array.isArray(data.models)) {
          throw new Error('Formato inválido do catálogo')
        }

        if (cancelled) return

        setProducts(current => mergeCatalog(data.models, current))
        setCatalogLoaded(true)
        setCatalogError(false)
      })
      .catch(error => {
        console.error('Erro ao carregar catálogo:', error)

        if (!cancelled) {
          setCatalogError(true)
          setCatalogLoaded(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Salva somente depois de carregar o catálogo.
  // Evita sobrescrever os dados existentes com uma lista vazia.
  useEffect(() => {
    if (!catalogLoaded) return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
    } catch (error) {
      console.error('Erro ao salvar dados locais:', error)
      setNotice('Não foi possível salvar os dados neste navegador.')
    }
  }, [products, catalogLoaded])

  // Busca o histórico central publicado pelo GitHub Actions.
  useEffect(() => {
    let cancelled = false

    fetch(`${import.meta.env.BASE_URL}data/price-history.json`, {
      cache: 'no-store'
    })
      .then(response => {
        if (!response.ok) throw new Error('Histórico indisponível')
        return response.json()
      })
      .then(data => {
        if (cancelled) return

        setAutoData(data)
        setAutoStatus('Coleta conectada')
      })
      .catch(() => {
        if (!cancelled) {
          setAutoStatus('Histórico indisponível')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    return activeProducts.filter(product => {
      const searchText = [
        product.brand,
        product.name,
        product.model,
        product.technology,
        product.tech
      ].join(' ').toLowerCase()

      const matchesQuery = searchText.includes(query.toLowerCase())

      const technology = (product.technology || product.tech || '')
        .toLowerCase()

      const matchesTech =
        tech === 'Todas' ||
        technology.includes(tech.toLowerCase())

      return matchesQuery && matchesTech
    })
  }, [activeProducts, query, tech])

  const ranked = useMemo(() => {
    return activeProducts
      .filter(product => Number(product.price) > 0)
      .sort((a, b) => Number(a.price) - Number(b.price))
  }, [activeProducts])

  const opportunities = activeProducts.filter(product =>
    Number(product.price) > 0 &&
    Number(product.price) <= Number(product.great)
  )

  // Agrupa os snapshots automáticos por modelo.
  const automaticModels = useMemo(() => {
    const groups = {}

    ;(autoData.records || [])
      .filter(record =>
        record.recordType === 'snapshot' &&
        Number(record.price) > 0 &&
        record.collectedAt
      )
      .forEach(record => {
        if (!groups[record.modelId]) {
          groups[record.modelId] = []
        }

        groups[record.modelId].push(record)
      })

    return Object.entries(groups)
      .map(([modelId, records]) => {
        records.sort((a, b) =>
          new Date(a.collectedAt) - new Date(b.collectedAt)
        )

        const latest = records[records.length - 1]
        const product = modelById.get(modelId)

        return {
          modelId,
          product,
          records,
          latest,
          lowest: Math.min(...records.map(record =>
            Number(record.price)
          ))
        }
      })
      .sort((a, b) =>
        Number(a.latest.price) - Number(b.latest.price)
      )
  }, [autoData, modelById])

  const update = (id, patch) => {
    setProducts(current =>
      current.map(product =>
        product.id === id
          ? { ...product, ...patch }
          : product
      )
    )
  }

  const savePrice = (id, form) => {
    const price = Number(form.price)

    if (!Number.isFinite(price) || price <= 0) {
      setNotice('Informe um preço válido.')
      return
    }

    const product = products.find(item => item.id === id)

    if (!product) {
      setNotice('Modelo não encontrado.')
      return
    }

    const item = {
      date: new Date().toISOString(),
      price,
      store: form.store.trim(),
      url: form.url.trim()
    }

    update(id, {
      price,
      store: item.store,
      url: item.url,
      history: [...(product.history || []), item]
    })

    setEditing(null)
    setNotice('Preço registrado!')
    setTimeout(() => setNotice(''), 2500)
  }

  const removeHistory = id => {
    if (confirm('Apagar o histórico manual deste modelo?')) {
      update(id, {
        history: [],
        price: null,
        store: '',
        url: ''
      })
    }
  }

  const status = product => {
    if (!Number(product.price)) return 'Sem preço'
    if (product.price <= product.great) {
      return 'Oportunidade excelente'
    }
    if (product.price <= product.target) return 'Bom preço'
    return 'Aguardar'
  }

  const statusClass = product => {
    if (!Number(product.price)) return 'neutral'
    if (product.price <= product.great) return 'great'
    if (product.price <= product.target) return 'good'
    return 'wait'
  }

  const automaticStatus = (price, product) => {
    if (!product) return 'Modelo fora do catálogo'
    if (price <= product.great) return 'Oportunidade excelente'
    if (price <= product.target) return 'Bom preço'
    return 'Acima do alvo'
  }

  const automaticStatusClass = (price, product) => {
    if (!product) return 'neutral'
    if (price <= product.great) return 'great'
    if (price <= product.target) return 'good'
    return 'wait'
  }

  const startEdit = product => {
    setEditing({
      id: product.id,
      price: product.price || '',
      store: product.store || '',
      url: product.url || ''
    })
  }

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <div className="logo"><Tv size={22} /></div>
          <div>
            <b>TV RADAR <span>65</span></b>
            <small>Seu painel pessoal de oportunidades</small>
          </div>
        </div>

        <div className="topnote">
          <Activity size={16} /> Acompanhamento de preços
        </div>
      </header>

      <main>
        <section className="hero">
          <div>
            <div className="eyebrow">RADAR DE PREÇOS · BRASIL</div>
            <h1>A próxima TV<br /><em>no melhor preço.</em></h1>
            <p>
              Acompanhe modelos de 65”, registre ofertas e descubra
              quando vale comprar.
            </p>
          </div>

          <div className="heroicon">
            <Tv size={86} strokeWidth={1} />
            <span>65”</span>
          </div>
        </section>

        <section className="stats">
          <div className="stat">
            <span>Modelos monitorados</span>
            <strong>{activeProducts.length}</strong>
            <small>OLED e Mini LED</small>
          </div>

          <div className="stat">
            <span>Preços registrados manualmente</span>
            <strong>{ranked.length}</strong>
            <small>Seus registros neste navegador</small>
          </div>

          <div className="stat highlight">
            <span>Oportunidades manuais</span>
            <strong>{opportunities.length}</strong>
            <small>Preço no alvo excelente</small>
          </div>
        </section>

        {catalogError && (
          <div className="automatic-empty">
            Não foi possível carregar o catálogo. Confira se
            public/data/models.json está publicado.
          </div>
        )}

        <section className="automatic-panel">
          <div className="automatic-heading">
            <div>
              <div className="eyebrow">COLETA AUTOMÁTICA</div>
              <h2>Monitoramento de ofertas</h2>
              <p>
                Ofertas encontradas pelo coletor do TV Radar.
              </p>
            </div>

            <span className="auto-status">
              <span className="status-dot" /> {autoStatus}
            </span>
          </div>

          {automaticModels.length > 0 ? (
            <div className="automatic-grid">
              {automaticModels.map(model => {
                const latest = model.latest
                const product = model.product
                const modelName = product
                  ? product.name
                  : (latest.title || latest.modelId)

                return (
                  <article
                    className="automatic-card"
                    key={model.modelId}
                  >
                    <div className="automatic-model">
                      {modelName}
                    </div>

                    <strong className="automatic-price">
                      {money(latest.price)}
                    </strong>

                    <div className="automatic-meta">
                      <span>{latest.store || 'Loja não informada'}</span>
                      <span>{model.records.length} coleta(s)</span>
                    </div>

                    <span className={`pill ${
                      automaticStatusClass(
                        Number(latest.price),
                        product
                      )
                    }`}>
                      {automaticStatus(
                        Number(latest.price),
                        product
                      )}
                    </span>

                    {product && (
                      <div className="automatic-meta lowest">
                        <span>Alvo bom: {money(product.target)}</span>
                        <b>Excelente: {money(product.great)}</b>
                      </div>
                    )}

                    <PriceChart records={model.records} />

                    <div className="automatic-meta lowest">
                      <span>Menor observado</span>
                      <b>{money(model.lowest)}</b>
                    </div>

                    <div className="automatic-meta offer-link">
                      <span>
                        Última coleta: {dateTime(latest.collectedAt)}
                      </span>

                      {latest.url && (
                        <a
                          href={latest.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Ver oferta <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="automatic-empty">
              {autoStatus === 'Carregando...'
                ? 'Carregando os dados de preços...'
                : 'Ainda não há snapshots automáticos disponíveis.'}
            </div>
          )}

          <div className="automatic-footer">
            <span>
              Última execução: {autoData.lastUpdated
                ? new Date(autoData.lastUpdated).toLocaleString('pt-BR')
                : 'Ainda não disponível'}
            </span>
            <span>Fonte: Pechincha.ai</span>
          </div>

          <p className="automatic-date">
            Preços encontrados são referências. Confira frete,
            vendedor, cupons e preço final antes de comprar.
          </p>
        </section>

        <nav className="tabs">
          <button
            className={tab === 'radar' ? 'active' : ''}
            onClick={() => setTab('radar')}
          >
            Meu radar
          </button>

          <button
            className={tab === 'ranking' ? 'active' : ''}
            onClick={() => setTab('ranking')}
          >
            Melhores preços
          </button>

          <button
            className={tab === 'guide' ? 'active' : ''}
            onClick={() => setTab('guide')}
          >
            Como usar
          </button>
        </nav>

        {tab === 'radar' && (
          <>
            <section className="toolbar">
              <div>
                <h2>Modelos acompanhados</h2>
                <p>
                  Catálogo centralizado · preços registrados manualmente.
                </p>
              </div>

              <div className="filters">
                <label className="search">
                  <Search size={16} />
                  <input
                    placeholder="Buscar TV..."
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                  />
                </label>

                <label className="select">
                  <SlidersHorizontal size={15} />
                  <select
                    value={tech}
                    onChange={event => setTech(event.target.value)}
                  >
                    <option>Todas</option>
                    <option>OLED</option>
                    <option>Mini LED</option>
                  </select>
                  <ChevronDown size={14} />
                </label>
              </div>
            </section>

            {!catalogLoaded && (
              <div className="automatic-empty">
                Carregando catálogo de modelos...
              </div>
            )}

            <div className="grid">
              {filtered.map(product => (
                <article className="tvcard" key={product.id}>
                  <div className="cardtop">
                    <span className="maker">{product.brand}</span>
                    <span className={`pill ${statusClass(product)}`}>
                      {status(product)}
                    </span>
                  </div>

                  <h3>{product.name}</h3>
                  <div className="model">
                    {product.model} · 65 polegadas
                  </div>
                  <div className="tech">
                    {product.technology || product.tech}
                  </div>

                  <div className="pricearea">
                    <div>
                      <small>Último preço manual</small>
                      <strong>{money(product.price)}</strong>
                      <small>
                        {product.store
                          ? `em ${product.store}`
                          : 'Nenhuma oferta cadastrada'}
                      </small>
                    </div>

                    <div className="targets">
                      <span>Alvo {money(product.target)}</span>
                      <b>Ótimo {money(product.great)}</b>
                    </div>
                  </div>

                  <div className="bar">
                    <span style={{
                      width: product.price
                        ? `${Math.min(
                            100,
                            Math.max(
                              4,
                              (product.great / product.price) * 100
                            )
                          )}%`
                        : '0%'
                    }} />
                  </div>

                  <div className="cardactions">
                    <button
                      className="primary"
                      onClick={() => startEdit(product)}
                    >
                      <Plus size={16} /> Registrar preço
                    </button>

                    {product.url && (
                      <a
                        href={product.url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Abrir oferta"
                      >
                        <ExternalLink size={17} />
                      </a>
                    )}

                    <button
                      className="iconbtn"
                      title="Apagar histórico manual"
                      onClick={() => removeHistory(product.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {product.history?.length > 0 && (
                    <div className="historyline">
                      <TrendingDown size={14} />
                      {product.history.length} registro(s) · último em{' '}
                      {date(
                        product.history[product.history.length - 1].date
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>

            {catalogLoaded && filtered.length === 0 && (
              <div className="automatic-empty">
                Nenhum modelo encontrado para esse filtro.
              </div>
            )}
          </>
        )}

        {tab === 'ranking' && (
          <section className="panel">
            <h2>Ranking dos preços registrados</h2>
            <p className="muted">
              Preços cadastrados manualmente, ordenados do menor para o maior.
            </p>

            {ranked.length === 0 ? (
              <div className="empty">
                Ainda não há preços. Vá ao Meu radar e registre a primeira oferta.
              </div>
            ) : (
              ranked.map((product, index) => (
                <div className="rankrow" key={product.id}>
                  <b className="ranknum">
                    {String(index + 1).padStart(2, '0')}
                  </b>

                  <div className="rankname">
                    <strong>{product.name}</strong>
                    <small>
                      {product.store || 'Loja não informada'} ·{' '}
                      {product.technology || product.tech}
                    </small>
                  </div>

                  <strong>{money(product.price)}</strong>

                  <span className={`pill ${statusClass(product)}`}>
                    {status(product)}
                  </span>
                </div>
              ))
            )}
          </section>
        )}

        {tab === 'guide' && (
          <section className="panel guide">
            <h2>Como usar o radar</h2>

            <ol>
              <li>Encontre a TV em uma loja brasileira conhecida.</li>
              <li>Confira o código completo do modelo e quem é o vendedor.</li>
              <li>Registre o preço, a loja e o link da oferta.</li>
              <li>Compare com os alvos para avaliar se vale comprar.</li>
            </ol>

            <div className="tip">
              <Bell size={18} />
              <div>
                <b>Sobre os alertas</b>
                <p>
                  A coleta automática atualiza o histórico no site.
                  Notificações automáticas pelo Telegram serão uma próxima etapa.
                </p>
              </div>
            </div>

            <div className="tip">
              <Wallet size={18} />
              <div>
                <b>O que conferir antes de comprar</b>
                <p>
                  Preço à vista e parcelado, frete, cupom, vendedor,
                  nota fiscal, garantia e condições de entrega.
                </p>
              </div>
            </div>

            <div className="tip">
              <Activity size={18} />
              <div>
                <b>Catálogo centralizado</b>
                <p>
                  Os modelos e os preços-alvo são carregados de
                  public/data/models.json. Os seus preços manuais
                  continuam salvos neste navegador.
                </p>
              </div>
            </div>
          </section>
        )}

        <footer>
          <span>TV RADAR 65</span>
          <span>Histórico automático + registros manuais</span>
        </footer>
      </main>

      {editing && (
        <div
          className="modalback"
          onClick={() => setEditing(null)}
        >
          <form
            className="modal"
            onClick={event => event.stopPropagation()}
            onSubmit={event => {
              event.preventDefault()

              savePrice(editing.id, {
                price: event.target.price.value,
                store: event.target.store.value,
                url: event.target.url.value
              })
            }}
          >
            <div className="modalhead">
              <div>
                <small>NOVO REGISTRO</small>
                <h2>
                  {products.find(product => product.id === editing.id)?.name}
                </h2>
              </div>

              <button
                type="button"
                className="close"
                onClick={() => setEditing(null)}
              >
                ×
              </button>
            </div>

            <label>
              Preço encontrado (R$)
              <input
                name="price"
                type="number"
                min="1"
                step="0.01"
                placeholder="Ex.: 3799,90"
                defaultValue={editing.price}
                required
                autoFocus
              />
            </label>

            <label>
              Loja / vendedor
              <input
                name="store"
                placeholder="Ex.: Loja oficial TCL"
                defaultValue={editing.store}
              />
            </label>

            <label>
              Link da oferta
              <input
                name="url"
                type="url"
                placeholder="https://..."
                defaultValue={editing.url}
              />
            </label>

            <div className="modalhint">
              O registro fica salvo neste navegador.
            </div>

            <button className="primary full" type="submit">
              <Check size={17} /> Salvar preço
            </button>
          </form>
        </div>
      )}

      {notice && <div className="toast">{notice}</div>}
    </div>
  )
}
