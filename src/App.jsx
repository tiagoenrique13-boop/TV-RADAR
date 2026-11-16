import React, { useEffect, useMemo, useState } from 'react'
import { Activity, Bell, Check, ChevronDown, ExternalLink, Plus, Search, SlidersHorizontal, Trash2, Tv, TrendingDown, Wallet } from 'lucide-react'

const initialProducts = [
  { id:'c6k', brand:'TCL', model:'65C6K', name:'TCL C6K', tech:'QD-Mini LED', target:4000, great:3600, price:null, store:'', url:'', history:[] },
  { id:'c7k', brand:'TCL', model:'65C7K', name:'TCL C7K', tech:'QD-Mini LED', target:4500, great:4200, price:null, store:'', url:'', history:[] },
  { id:'c7l', brand:'TCL', model:'65C7L', name:'TCL C7L', tech:'QD-Mini LED', target:4500, great:4200, price:null, store:'', url:'', history:[] },
  { id:'qned80', brand:'LG', model:'65QNED80', name:'LG QNED80', tech:'QNED Mini LED*', target:4000, great:3700, price:null, store:'', url:'', history:[] },
  { id:'qned70', brand:'LG', model:'65QNED70', name:'LG QNED70', tech:'QNED', target:3500, great:3300, price:null, store:'', url:'', history:[] },
  { id:'b5', brand:'LG', model:'OLED65B5', name:'LG OLED B5', tech:'OLED', target:6000, great:5500, price:null, store:'', url:'', history:[] },
  { id:'c5', brand:'LG', model:'OLED65C5', name:'LG OLED C5', tech:'OLED', target:6500, great:6000, price:null, store:'', url:'', history:[] },
  { id:'s90', brand:'Samsung', model:'QN65S90', name:'Samsung OLED S90', tech:'OLED', target:6500, great:6000, price:null, store:'', url:'', history:[] },
  { id:'qn90', brand:'Samsung', model:'QN65QN90', name:'Samsung Neo QLED', tech:'Mini LED', target:6000, great:5500, price:null, store:'', url:'', history:[] }
]
const money = n => n == null || n === '' ? '—' : Number(n).toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const date = d => new Date(d).toLocaleDateString('pt-BR')
const load = () => { try { const v=JSON.parse(localStorage.getItem('tv-radar-data')); return Array.isArray(v)&&v.length?v:initialProducts } catch { return initialProducts } }

export default function App(){
  const [products,setProducts]=useState(load)
  const [query,setQuery]=useState('')
  const [tech,setTech]=useState('Todas')
  const [editing,setEditing]=useState(null)
  const [tab,setTab]=useState('radar')
  const [notice,setNotice]=useState('')
  useEffect(()=>localStorage.setItem('tv-radar-data',JSON.stringify(products)),[products])
  const filtered=useMemo(()=>products.filter(p=>(`${p.brand} ${p.name} ${p.model}`.toLowerCase().includes(query.toLowerCase()))&&(tech==='Todas'||p.tech.toLowerCase().includes(tech.toLowerCase()))),[products,query,tech])
  const ranked=[...products].filter(p=>p.price).sort((a,b)=>a.price-b.price)
  const opportunities=products.filter(p=>p.price&&p.price<=p.great)
  const update=(id,patch)=>setProducts(ps=>ps.map(p=>p.id===id?{...p,...patch}:p))
  const savePrice=(id,form)=>{
    const price=Number(form.price)
    if(!price||price<=0){setNotice('Informe um preço válido.');return}
    const p=products.find(x=>x.id===id)
    const item={date:new Date().toISOString(),price,store:form.store.trim(),url:form.url.trim()}
    update(id,{price,store:item.store,url:item.url,history:[...(p.history||[]),item]})
    setEditing(null);setNotice('Preço registrado!')
    setTimeout(()=>setNotice(''),2500)
  }
  const removeHistory=id=>{if(confirm('Apagar o histórico deste modelo?'))update(id,{history:[],price:null,store:'',url:''})}
  const status=p=>!p.price?'Sem preço':p.price<=p.great?'Oportunidade excelente':p.price<=p.target?'Bom preço':'Aguardar'
  const statusClass=p=>!p.price?'neutral':p.price<=p.great?'great':p.price<=p.target?'good':'wait'
  const startEdit=p=>setEditing({id:p.id,price:p.price||'',store:p.store||'',url:p.url||''})
  return <div className="app">
    <header className="top"><div className="brand"><div className="logo"><Tv size={22}/></div><div><b>TV RADAR <span>65</span></b><small>Seu painel pessoal de oportunidades</small></div></div><div className="topnote"><Activity size={16}/> Acompanhamento simples</div></header>
    <main>
      <section className="hero"><div><div className="eyebrow">RADAR DE PREÇOS · BRASIL</div><h1>A próxima TV<br/><em>no melhor preço.</em></h1><p>Acompanhe modelos de 65”, registre ofertas e descubra quando vale comprar.</p></div><div className="heroicon"><Tv size={86} strokeWidth={1}/><span>65”</span></div></section>
      <section className="stats">
        <div className="stat"><span>Modelos monitorados</span><strong>{products.length}</strong><small>OLED, Mini LED e QNED</small></div>
        <div className="stat"><span>Preços registrados</span><strong>{ranked.length}</strong><small>Atualize quando encontrar oferta</small></div>
        <div className="stat highlight"><span>Oportunidades agora</span><strong>{opportunities.length}</strong><small>Preço no alvo excelente</small></div>
      </section>
      <nav className="tabs"><button className={tab==='radar'?'active':''} onClick={()=>setTab('radar')}>Meu radar</button><button className={tab==='ranking'?'active':''} onClick={()=>setTab('ranking')}>Melhores preços</button><button className={tab==='guide'?'active':''} onClick={()=>setTab('guide')}>Como usar</button></nav>
      {tab==='radar'&&<>
        <section className="toolbar"><div><h2>Modelos acompanhados</h2><p>Registre o preço que encontrar nas lojas.</p></div><div className="filters"><label className="search"><Search size={16}/><input placeholder="Buscar TV..." value={query} onChange={e=>setQuery(e.target.value)}/></label><label className="select"><SlidersHorizontal size={15}/><select value={tech} onChange={e=>setTech(e.target.value)}><option>Todas</option><option>OLED</option><option>Mini LED</option><option>QNED</option></select><ChevronDown size={14}/></label></div></section>
        <div className="grid">{filtered.map(p=><article className="tvcard" key={p.id}><div className="cardtop"><span className="maker">{p.brand}</span><span className={`pill ${statusClass(p)}`}>{status(p)}</span></div><h3>{p.name}</h3><div className="model">{p.model} · 65 polegadas</div><div className="tech">{p.tech}</div><div className="pricearea"><div><small>Último preço registrado</small><strong>{money(p.price)}</strong><small>{p.store?`em ${p.store}`:'Nenhuma oferta cadastrada'}</small></div><div className="targets"><span>Alvo {money(p.target)}</span><b>Ótimo {money(p.great)}</b></div></div><div className="bar"><span style={{width:p.price?`${Math.min(100,Math.max(4,(p.great/p.price)*100))}%`:'0%'}}/></div><div className="cardactions"><button className="primary" onClick={()=>startEdit(p)}><Plus size={16}/> Registrar preço</button>{p.url&&<a href={p.url} target="_blank" rel="noreferrer" aria-label="Abrir oferta"><ExternalLink size={17}/></a>}<button className="iconbtn" title="Apagar histórico" onClick={()=>removeHistory(p.id)}><Trash2 size={16}/></button></div>{p.history?.length>0&&<div className="historyline"><TrendingDown size={14}/> {p.history.length} registro(s) · último em {date(p.history[p.history.length-1].date)}</div>}</article>)}</div>
      </>}
      {tab==='ranking'&&<section className="panel"><h2>Ranking dos preços registrados</h2><p className="muted">Só aparecem modelos com preço informado por você. Não são cotações automáticas.</p>{ranked.length===0?<div className="empty">Ainda não há preços. Vá ao Meu radar e registre a primeira oferta.</div>:ranked.map((p,i)=><div className="rankrow" key={p.id}><b className="ranknum">0{i+1}</b><div className="rankname"><strong>{p.name}</strong><small>{p.store||'Loja não informada'} · {p.tech}</small></div><strong>{money(p.price)}</strong><span className={`pill ${statusClass(p)}`}>{status(p)}</span></div>)}</section>}
      {tab==='guide'&&<section className="panel guide"><h2>Como usar o radar</h2><ol><li>Encontre a TV em uma loja brasileira conhecida.</li><li>Confira o código completo do modelo e quem é o vendedor.</li><li>Registre o preço, a loja e o link da oferta.</li><li>Compare com os alvos. “Oportunidade excelente” significa que o preço chegou ao alvo ótimo que definimos.</li></ol><div className="tip"><Bell size={18}/><div><b>Sobre os alertas</b><p>Esta versão não consulta lojas automaticamente nem envia notificações. Ela classifica os preços que você registra. A automação pode ser adicionada depois, sem complicar o projeto agora.</p></div></div><div className="tip"><Wallet size={18}/><div><b>O que conferir antes de comprar</b><p>Preço à vista e parcelado, frete, cupom, CNPJ do vendedor, nota fiscal, garantia e histórico no Zoom/Buscapé.</p></div></div></section>}
      <footer><span>TV RADAR 65</span><span>Dados salvos neste navegador · Projeto pessoal</span></footer>
    </main>
    {editing&&<div className="modalback" onClick={()=>setEditing(null)}><form className="modal" onClick={e=>e.stopPropagation()} onSubmit={e=>{e.preventDefault();savePrice(editing.id,{price:e.target.price.value,store:e.target.store.value,url:e.target.url.value})}}><div className="modalhead"><div><small>NOVO REGISTRO</small><h2>{products.find(p=>p.id===editing.id)?.name}</h2></div><button type="button" className="close" onClick={()=>setEditing(null)}>×</button></div><label>Preço encontrado (R$)<input name="price" type="number" min="1" step="0.01" placeholder="Ex.: 3799,90" defaultValue={editing.price} required autoFocus/></label><label>Loja / vendedor<input name="store" placeholder="Ex.: Loja oficial TCL" defaultValue={editing.store}/></label><label>Link da oferta<input name="url" type="url" placeholder="https://..." defaultValue={editing.url}/></label><div className="modalhint">O registro fica salvo neste navegador e entra no ranking.</div><button className="primary full" type="submit"><Check size={17}/> Salvar preço</button></form></div>}
    {notice&&<div className="toast">{notice}</div>}
  </div>
}