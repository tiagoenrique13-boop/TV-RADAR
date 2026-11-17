
import React, { useEffect, useMemo, useState } from 'react'
import {
  Activity, Bell, Check, ChevronDown, ExternalLink, Plus,
  Search, SlidersHorizontal, Trash2, Tv, TrendingDown, Wallet
} from 'lucide-react'

const initialProducts = [
  { id:'c6k', brand:'TCL', model:'65C6K', name:'TCL C6K', tech:'QD-Mini LED', target:4000, great:3600, price:null, store:'', url:'', history:[] },
  { id:'c7k', brand:'TCL', model:'65C7K', name:'TCL C7K', tech:'QD-Mini LED', target:4500, great:4200, price:null, store:'', url:'', history:[] },
  { id:'c7l', brand:'TCL', model:'65C7L', name:'TCL C7L', tech:'SQD-Mini LED', target:4500, great:4200, price:null, store:'', url:'', history:[] },
  { id:'qned80', brand:'LG', model:'65QNED80', name:'LG QNED80', tech:'QNED', target:4000, great:3700, price:null, store:'', url:'', history:[] },
  { id:'qned70', brand:'LG', model:'65QNED70', name:'LG QNED70', tech:'QNED', target:3500, great:3300, price:null, store:'', url:'', history:[] },
  { id:'b5', brand:'LG', model:'OLED65B5', name:'LG OLED B5', tech:'OLED', target:6000, great:5500, price:null, store:'', url:'', history:[] },
  { id:'c5', brand:'LG', model:'OLED65C5', name:'LG OLED C5', tech:'OLED', target:6500, great:6000, price:null, store:'', url:'', history:[] },
  { id:'s90', brand:'Samsung', model:'QN65S90', name:'Samsung OLED S90', tech:'OLED', target:6500, great:6000, price:null, store:'', url:'', history:[] },
  { id:'qn90', brand:'Samsung', model:'QN65QN90', name:'Samsung Neo QLED', tech:'Mini LED', target:6000, great:5500, price:null, store:'', url:'', history:[] }
]

const money = n => n == null || n === ''
  ? '—'
  : Number(n).toLocaleString('pt-BR', { style:'currency', currency:'BRL', maximumFractionDigits:0 })

const date = d => new Date(d).toLocaleDateString('pt-BR')

const dateTime = d => new Date(d).toLocaleString('pt-BR', {
  day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'
})

const load = () => {
  try {
    const v = JSON.parse(localStorage.getItem('tv-radar-data'))
    return Array.isArray(v) && v.length ? v : initialProducts
  } catch {
    return initialProducts
  }
}

function PriceChart({ records }) {
  const values = records.map(r => Number(r.price))
  const min = Math.min(...values)
  const max = Math.max(...values)

  const points = values.map((value, index) => {
    const x = values.length === 1 ? 50 : 8 + index * 84 / (values.length - 1)
    const y = max === min ? 25 : 43 - ((value - min) / (max - min)) * 34
    return `${x},${y}`
  })

  return (
    <svg className="price-chart" viewBox="0 0 100 50" preserveAspectRatio="none">
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
        return <circle key={index} cx={x} cy={y} r="2.3" fill="#d5f34b" />
      })}
    </svg>
  )
}

export default function App() {
  const [products, setProducts] = useState(load)
  const [query, setQuery] = useState('')
  const [tech, setTech] = useState('Todas')
  const [editing, setEditing] = useState(null)
  const [tab, setTab] = useState('radar')
  const [notice, setNotice] = useState('')
  const [autoData, setAutoData] = useState({ records:[], lastUpdated:null })
  const [autoStatus, setAutoStatus] = useState('Carregando...')

  // Preserva os registros manuais neste navegador.
  useEffect(() => {
    localStorage.setItem('tv-radar-data', JSON.stringify(products))
  }, [products])

  // Busca o histórico central publicado pelo GitHub Actions.
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/price-history.json`, {
      cache:'no-store'
    })
      .then(response => {
        if (!response.ok) throw new Error('Histórico indisponível')
        return response.json()
      })
      .then(data => {
        setAutoData(data)
        setAutoStatus('Coleta conectada')
      })
      .catch(() => {
        setAutoStatus('Histórico indisponível')
      })
  }, [])

  const filtered = useMemo(() => products.filter(p =>
    `${p.brand} ${p.name} ${p.model}`.toLowerCase().includes(query.toLowerCase()) &&
    (tech === 'Todas' || p.tech.toLowerCase().includes(tech.toLowerCase()))
  ), [products, query, tech])

  const ranked = [...products]
    .filter(p => p.price)
    .sort((a, b) => a.price - b.price)

  const opportunities = products.filter(p =>
    p.price && p.price <= p.great
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
        if (!groups[record.modelId]) groups[record.modelId] = []
        groups[record.modelId].push(record)
      })

    return Object.entries(groups).map(([modelId, records]) => {
      records.sort((a, b) =>
        new Date(a.collectedAt) - new Date(b.collectedAt)
      )

      return {
        modelId,
        records,
        latest: records[records.length - 1],
        lowest: Math.min(...records.map(r => Number(r.price)))
      }
    }).sort((a, b) => a.latest.price - b.latest.price)
  }, [autoData])

  const update = (id, patch) => {
    setProducts(current =>
      current.map(p => p.id === id ? { ...p, ...patch } : p)
    )
  }

  const savePrice = (id, form) => {
    const price = Number(form.price)

    if (!price || price <= 0) {
      setNotice('Informe um preço válido.')
      return
    }

    const product = products.find(p => p.id === id)

    const item = {
      date:new Date().toISOString(),
      price,
      store:form.store.trim(),
      url:form.url.trim()
    }

    update(id, {
      price,
      store:item.store,
      url:item.url,
      history:[...(product.history || []), item]
    })

    setEditing(null)
    setNotice('Preço registrado!')
    setTimeout(() => setNotice(''), 2500)
  }

  const removeHistory = id => {
    if (confirm('Apagar o histórico manual deste modelo?')) {
      update(id, { history:[], price:null, store:'', url:'' })
    }
  }

  const status = p => {
    if (!p.price) return 'Sem preço'
    if (p.price <= p.great) return 'Oportunidade excelente'
    if (p.price <= p.target) return 'Bom preço'
    return 'Aguardar'
  }

  const statusClass = p => {
    if (!p.price) return 'neutral'
    if (p.price <= p.great) return 'great'
    if (p.price <= p.target) return 'good'
    return 'wait'
  }

  const startEdit = p => {
    setEditing({
      id:p.id,
      price:p.price || '',
      store:p.store || '',
      url:p.url || ''
    })
  }

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <div className="logo"><Tv size={22}/></div>
          <div>
            <b>TV RADAR <span>65</span></b>
            <small>Seu painel pessoal de oportunidades</small>
          </div>
        </div>
        <div className="topnote">
          <Activity size={16}/> Acompanhamento de preços
        </div>
      </header>

      <main>
        <section className="hero">
          <div>
            <div className="eyebrow">RADAR DE PREÇOS · BRASIL</div>
            <h1>A próxima TV<br/><em>no melhor preço.</em></h1>
            <p>
              Acompanhe modelos de 65”, registre ofertas e descubra
              quando vale comprar.
            </p>
          </div>
          <div className="heroicon">
            <Tv size={86} strokeWidth={1}/>
            <span>65”</span>
          </div>
        </section>

        <section className="stats">
          <div className="stat">
            <span>Modelos monitorados</span>
            <strong>{products.length}</strong>
            <small>OLED, Mini LED e QNED</small>
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
              <span className="status-dot"/> {autoStatus}
            </span>
          </div>

          {automaticModels.length > 0 ? (
            <div className="automatic-grid">
              {automaticModels.map(model => {
                const latest = model.latest
                const modelName = latest.title || latest.modelId

                return (
                  <article className="automatic-card" key={model.modelId}>
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

                    <PriceChart records={model.records}/>

                    <div className="automatic-meta lowest">
                      <span>Menor observado</span>
                      <b>{money(model.lowest)}</b>
                    </div>

                    <div className="automatic-meta offer-link">
                      <span>Última coleta: {dateTime(latest.collectedAt)}</span>
                      {latest.url && (
                        <a href={latest.url} target="_blank" rel="noreferrer">
                          Ver oferta <ExternalLink size={12}/>
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
                <p>Registre manualmente os preços que encontrar.</p>
              </div>

              <div className="filters">
                <label className="search">
                  <Search size={16}/>
                  <input
                    placeholder="Buscar TV..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                  />
                </label>

                <label className="select">
                  <SlidersHorizontal size={15}/>
                  <select
                    value={tech}
                    onChange={e => setTech(e.target.value)}
                  >
                    <option>Todas</option>
                    <option>OLED</option>
                    <option>Mini LED</option>
                    <option>QNED</option>
                  </select>
                  <ChevronDown size={14}/>
                </label>
              </div>
            </section>

            <div className="grid">
              {filtered.map(p => (
                <article className="tvcard" key={p.id}>
                  <div className="cardtop">
                    <span className="maker">{p.brand}</span>
                    <span className={`pill ${statusClass(p)}`}>
                      {status(p)}
                    </span>
                  </div>

                  <h3>{p.name}</h3>
                  <div className="model">{p.model} · 65 polegadas</div>
                  <div className="tech">{p.tech}</div>

                  <div className="pricearea">
                    <div>
                      <small>Último preço manual</small>
                      <strong>{money(p.price)}</strong>
                      <small>
                        {p.store ? `em ${p.store}` : 'Nenhuma oferta cadastrada'}
                      </small>
                    </div>

                    <div className="targets">
                      <span>Alvo {money(p.target)}</span>
                      <b>Ótimo {money(p.great)}</b>
                    </div>
                  </div>

                  <div className="bar">
                    <span style={{
                      width:p.price
                        ? `${Math.min(100, Math.max(4, (p.great / p.price) * 100))}%`
                        : '0%'
                    }}/>
                  </div>

                  <div className="cardactions">
                    <button className="primary" onClick={() => startEdit(p)}>
                      <Plus size={16}/> Registrar preço
                    </button>

                    {p.url && (
                      <a href={p.url} target="_blank" rel="noreferrer"
                        aria-label="Abrir oferta">
                        <ExternalLink size={17}/>
                      </a>
                    )}

                    <button
                      className="iconbtn"
                      title="Apagar histórico manual"
                      onClick={() => removeHistory(p.id)}
                    >
                      <Trash2 size={16}/>
                    </button>
                  </div>

                  {p.history?.length > 0 && (
                    <div className="historyline">
                      <TrendingDown size={14}/>
                      {p.history.length} registro(s) · último em{' '}
                      {date(p.history[p.history.length - 1].date)}
                    </div>
                  )}
                </article>
              ))}
            </div>
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
            ) : ranked.map((p, i) => (
              <div className="rankrow" key={p.id}>
                <b className="ranknum">0{i + 1}</b>
                <div className="rankname">
                  <strong>{p.name}</strong>
                  <small>{p.store || 'Loja não informada'} · {p.tech}</small>
                </div>
                <strong>{money(p.price)}</strong>
                <span className={`pill ${statusClass(p)}`}>{status(p)}</span>
              </div>
            ))}
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
              <Bell size={18}/>
              <div>
                <b>Sobre os alertas</b>
                <p>
                  A coleta automática atualiza o histórico no site.
                  Notificações automáticas pelo Telegram serão uma próxima etapa.
                </p>
              </div>
            </div>

            <div className="tip">
              <Wallet size={18}/>
              <div>
                <b>O que conferir antes de comprar</b>
                <p>
                  Preço à vista e parcelado, frete, cupom, vendedor,
                  nota fiscal, garantia e condições de entrega.
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
        <div className="modalback" onClick={() => setEditing(null)}>
          <form
            className="modal"
            onClick={e => e.stopPropagation()}
            onSubmit={e => {
              e.preventDefault()
              savePrice(editing.id, {
                price:e.target.price.value,
                store:e.target.store.value,
                url:e.target.url.value
              })
            }}
          >
            <div className="modalhead">
              <div>
                <small>NOVO REGISTRO</small>
                <h2>{products.find(p => p.id === editing.id)?.name}</h2>
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
              <Check size={17}/> Salvar preço
            </button>
          </form>
        </div>
      )}

      {notice && <div className="toast">{notice}</div>}
    </div>
  )
}
