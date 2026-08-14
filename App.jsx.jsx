import { useState } from "react";

const MOCK = [
  { id:1, num:"0001234-55.2024.8.17.0001", parte_autora:"João Rodrigues Silva", parte_re:"Empresa XYZ Ltda", area:"Trabalhista", vara:"5ª Vara do Trabalho - Recife/PE", distribuicao:"12/03/2024", proximo_prazo:"2026-08-14", tipo_ato:"Audiência de instrução", valor:"R$ 48.300,00", fase:"Instrução", status:"Urgente", advogado:"Dra. Marina Souza", email_alerta:"marina@escritorio.com.br", pedido:"Verbas rescisórias, aviso prévio, FGTS + 40%, horas extras.", movs:[{data:"10/08/2026",ev:"Audiência de instrução designada"},{data:"05/06/2026",ev:"Contestação juntada pelo réu"},{data:"12/03/2024",ev:"Processo distribuído"}] },
  { id:2, num:"0009876-11.2023.4.01.3400", parte_autora:"Empresa Alpha Ltda", parte_re:"Fisco Federal (PGFN)", area:"Tributário", vara:"TRF 1ª Região - Brasília/DF", distribuicao:"07/11/2023", proximo_prazo:"2026-08-15", tipo_ato:"Contestação", valor:"R$ 320.000,00", fase:"Conhecimento", status:"Urgente", advogado:"Dr. Rafael Costa", email_alerta:"rafael@escritorio.com.br", pedido:"Nulidade de auto de infração fiscal.", movs:[{data:"08/08/2026",ev:"Intimação para contestar"},{data:"07/11/2023",ev:"Processo distribuído"}] },
  { id:3, num:"0005432-88.2024.1.00.0000", parte_autora:"Maria A. Ferreira", parte_re:"Banco Nacional S.A.", area:"Cível", vara:"2ª Vara Cível - Natal/RN", distribuicao:"22/01/2024", proximo_prazo:"2026-08-17", tipo_ato:"Recurso ordinário", valor:"R$ 15.000,00", fase:"Recurso", status:"Vencendo", advogado:"Dra. Marina Souza", email_alerta:"marina@escritorio.com.br", pedido:"Revisão contratual, dano moral.", movs:[{data:"01/08/2026",ev:"Sentença proferida: procedente"},{data:"22/01/2024",ev:"Processo distribuído"}] },
  { id:4, num:"0007654-32.2024.8.26.0100", parte_autora:"Carlos Mendes", parte_re:"INSS", area:"Previdenciário", vara:"JFRN - Mossoró/RN", distribuicao:"14/05/2024", proximo_prazo:"2026-08-19", tipo_ato:"Manifestação sobre laudo", valor:"—", fase:"Instrução", status:"Ativo", advogado:"Dra. Marina Souza", email_alerta:"marina@escritorio.com.br", pedido:"Aposentadoria por invalidez.", movs:[{data:"05/08/2026",ev:"Laudo pericial juntado"},{data:"14/05/2024",ev:"Processo distribuído"}] },
  { id:5, num:"0003210-44.2022.8.26.0100", parte_autora:"Pedro Costa", parte_re:"Seguradora BR Ltda", area:"Cível", vara:"3ª Vara Cível - Fortaleza/CE", distribuicao:"03/08/2022", proximo_prazo:null, tipo_ato:"—", valor:"R$ 22.000,00", fase:"Encerrado", status:"Encerrado", advogado:"Dr. Rafael Costa", email_alerta:"rafael@escritorio.com.br", pedido:"Indenização por sinistro.", movs:[{data:"10/01/2026",ev:"Acordo homologado"},{data:"03/08/2022",ev:"Processo distribuído"}] },
  { id:6, num:"0000111-99.2024.8.17.0010", parte_autora:"Ana Lima", parte_re:"Ministério Público", area:"Criminal", vara:"1ª Vara Criminal - Recife/PE", distribuicao:"09/09/2024", proximo_prazo:"2026-08-24", tipo_ato:"Defesa prévia", valor:"—", fase:"Conhecimento", status:"Pendente", advogado:"Dra. Marina Souza", email_alerta:"marina@escritorio.com.br", pedido:"Absolvição por insuficiência de provas.", movs:[{data:"09/08/2026",ev:"Intimação para defesa prévia"},{data:"09/09/2024",ev:"Processo distribuído"}] },
];

const USUARIOS = [
  { id:1, nome:"Dra. Marina Souza", email:"marina@escritorio.com.br", perfil:"Admin", status:"Ativo", acesso:"Total", ini:"DM", cor:"#1a3a6b", ultimo:"12/08 09:32" },
  { id:2, nome:"Dr. Rafael Costa", email:"rafael@escritorio.com.br", perfil:"Advogado", status:"Ativo", acesso:"Seus processos", ini:"RC", cor:"#185fa5", ultimo:"12/08 08:14" },
  { id:3, nome:"Ana Lima", email:"ana@escritorio.com.br", perfil:"Estagiária", status:"Ativo", acesso:"Leitura", ini:"AL", cor:"#3b6d11", ultimo:"11/08 17:55" },
  { id:4, nome:"Novo Usuário", email:"novo@empresa.com", perfil:"—", status:"Pendente", acesso:"—", ini:"NU", cor:"#888", ultimo:"—" },
];

function dias(d){ if(!d) return null; const h=new Date("2026-08-12"),p=new Date(d); return Math.ceil((p-h)/86400000); }

function Badge({s}){
  const m={Urgente:"#a32d2d|#fcebeb",Vencendo:"#854f0b|#faeeda",Ativo:"#3b6d11|#eaf3de",Encerrado:"#666|#f0f0f0",Pendente:"#185fa5|#e6f1fb",Admin:"#3c3489|#eeedfe"};
  const [c,bg]=(m[s]||"#666|#f0f0f0").split("|");
  return <span style={{display:"inline-flex",alignItems:"center",padding:"3px 8px",borderRadius:20,fontSize:11,fontWeight:500,color:c,background:bg}}>{s}</span>;
}

function Av({ini,cor="#1a3a6b",size=32}){
  return <div style={{width:size,height:size,borderRadius:"50%",background:cor,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:size*0.34,fontWeight:600,flexShrink:0}}>{ini}</div>;
}

function Prazo({d}){
  if(d===null) return <span style={{color:"#aaa"}}>—</span>;
  if(d<=0) return <span style={{color:"#e24b4a",fontWeight:600}}>Vencido</span>;
  if(d<=3) return <span style={{color:"#e24b4a",fontWeight:600}}>⚠ {d}d</span>;
  if(d<=7) return <span style={{color:"#ba7517",fontWeight:600}}>{d}d</span>;
  return <span style={{color:"#555"}}>{d}d</span>;
}

function Modal({open,onClose,title,children,footer}){
  if(!open) return null;
  return(
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999}}>
      <div style={{background:"var(--surface-2)",borderRadius:14,border:"0.5px solid var(--border)",width:500,maxHeight:"85vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.25)"}}>
        <div style={{padding:"16px 20px",borderBottom:"0.5px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",fontWeight:500,fontSize:15}}>
          {title}
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:"var(--text-muted)",padding:"2px 6px"}}>✕</button>
        </div>
        <div style={{padding:20}}>{children}</div>
        {footer&&<div style={{padding:"12px 20px",borderTop:"0.5px solid var(--border)",display:"flex",gap:8,justifyContent:"flex-end"}}>{footer}</div>}
      </div>
    </div>
  );
}

// ── BTN
function Btn({children,primary,danger,sm,onClick,style={}}){
  return(
    <button onClick={onClick} style={{display:"inline-flex",alignItems:"center",gap:6,padding:sm?"5px 11px":"8px 15px",borderRadius:7,border:`0.5px solid ${primary?"#1a3a6b":danger?"#f09595":"var(--border-strong)"}`,background:primary?"#1a3a6b":danger?"#fcebeb":"var(--surface-2)",color:primary?"#fff":danger?"#a32d2d":"var(--text-primary)",fontSize:sm?12:13,cursor:"pointer",fontFamily:"inherit",fontWeight:500,...style}}>
      {children}
    </button>
  );
}

// ── INPUT
function Inp({label,value,onChange,type="text",placeholder="",full=false}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:5,gridColumn:full?"1/-1":""}}>
      {label&&<label style={{fontSize:12,color:"var(--text-secondary)",fontWeight:500}}>{label}</label>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{padding:"8px 10px",border:"0.5px solid var(--border-strong)",borderRadius:7,background:"var(--surface-1)",color:"var(--text-primary)",fontSize:13,fontFamily:"inherit",width:"100%"}} />
    </div>
  );
}

// ── SEL
function Sel({label,value,onChange,options,full=false}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:5,gridColumn:full?"1/-1":""}}>
      {label&&<label style={{fontSize:12,color:"var(--text-secondary)",fontWeight:500}}>{label}</label>}
      <select value={value} onChange={onChange} style={{padding:"8px 10px",border:"0.5px solid var(--border-strong)",borderRadius:7,background:"var(--surface-1)",color:"var(--text-primary)",fontSize:13,fontFamily:"inherit",width:"100%"}}>
        {options.map(o=><option key={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────
function Dashboard({ps,onNav,onAbrir}){
  const urg=ps.filter(p=>{ const d=dias(p.proximo_prazo); return d!==null&&d<=3; });
  const v7=ps.filter(p=>{ const d=dias(p.proximo_prazo); return d!==null&&d>3&&d<=7; });
  const enc=ps.filter(p=>p.status==="Encerrado");
  const areas=ps.reduce((a,p)=>{a[p.area]=(a[p.area]||0)+1;return a},{});
  const maxA=Math.max(...Object.values(areas),1);
  const cores=["#1a3a6b","#2d5fa6","#185fa5","#378add","#85b7eb","#b5d4f4"];

  const card={background:"var(--surface-2)",border:"0.5px solid var(--border)",borderRadius:12,padding:16};

  return(
    <div>
      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
        {[
          {l:"Total de processos",v:ps.length,sub:`${ps.length-enc.length} ativos`,c:"inherit"},
          {l:"Vencendo em 7 dias",v:v7.length,sub:"Atenção",c:v7.length?"#ba7517":"inherit"},
          {l:"Urgente (≤3 dias)",v:urg.length,sub:"Ação imediata",c:urg.length?"#e24b4a":"inherit"},
          {l:"Encerrados",v:enc.length,sub:"Concluídos",c:"#3b6d11"},
        ].map(k=>(
          <div key={k.l} style={card}>
            <div style={{fontSize:12,color:"var(--text-secondary)",marginBottom:6}}>{k.l}</div>
            <div style={{fontSize:30,fontWeight:600,color:k.c,lineHeight:1}}>{k.v}</div>
            <div style={{fontSize:12,color:"var(--text-muted)",marginTop:4}}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:18}}>
        {/* Alertas */}
        <div style={card}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <span style={{fontSize:14,fontWeight:500}}>Alertas de prazo</span>
            <span style={{fontSize:12,color:"#1a3a6b",cursor:"pointer"}} onClick={()=>onNav("alertas")}>ver todos →</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {ps.filter(p=>{ const d=dias(p.proximo_prazo); return d!==null&&d<=7; }).sort((a,b)=>dias(a.proximo_prazo)-dias(b.proximo_prazo)).slice(0,4).map(p=>{
              const d=dias(p.proximo_prazo);
              const urg=d<=3;
              return(
                <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,border:`0.5px solid ${urg?"#f09595":"#fac775"}`,background:urg?"#fcebeb":"#faeeda"}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:urg?"#e24b4a":"#ba7517",flexShrink:0}} />
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontFamily:"monospace",fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.num}</div>
                    <div style={{fontSize:11,color:"#666"}}>{p.tipo_ato} · {d}d</div>
                  </div>
                  <Btn sm onClick={()=>onAbrir(p.id)}>Ver</Btn>
                </div>
              );
            })}
            {ps.filter(p=>{ const d=dias(p.proximo_prazo); return d!==null&&d<=7; }).length===0&&<div style={{textAlign:"center",padding:20,color:"var(--text-muted)",fontSize:13}}>Nenhum prazo urgente ✓</div>}
          </div>
        </div>

        {/* Áreas */}
        <div style={card}>
          <div style={{fontSize:14,fontWeight:500,marginBottom:14}}>Distribuição por área</div>
          {Object.entries(areas).map(([area,qtd],i)=>(
            <div key={area} style={{display:"flex",alignItems:"center",gap:8,marginBottom:9}}>
              <div style={{width:96,fontSize:11,color:"var(--text-secondary)",textAlign:"right",flexShrink:0}}>{area}</div>
              <div style={{flex:1,height:18,background:"var(--surface-1)",borderRadius:4,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${Math.round(qtd/maxA*100)}%`,background:cores[i]||"#1a3a6b",borderRadius:4,display:"flex",alignItems:"center",paddingLeft:7,fontSize:11,color:"#fff",fontWeight:600}}>{qtd}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabela recente */}
      <div style={card}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <span style={{fontSize:14,fontWeight:500}}>Processos recentes</span>
          <span style={{fontSize:12,color:"#1a3a6b",cursor:"pointer"}} onClick={()=>onNav("processos")}>ver todos →</span>
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead>
              <tr>{["Nº do processo","Parte autora","Área","Prazo","Status",""].map(h=><th key={h} style={{textAlign:"left",fontSize:11,color:"var(--text-muted)",padding:"7px 10px",borderBottom:"0.5px solid var(--border)",textTransform:"uppercase",letterSpacing:".04em",whiteSpace:"nowrap"}}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {ps.slice(0,5).map(p=>(
                <tr key={p.id} style={{cursor:"pointer"}} onClick={()=>onAbrir(p.id)}>
                  <td style={{padding:"9px 10px",borderBottom:"0.5px solid var(--border)",fontFamily:"monospace",fontSize:11}}>{p.num.slice(0,22)}…</td>
                  <td style={{padding:"9px 10px",borderBottom:"0.5px solid var(--border)"}}>{p.parte_autora}</td>
                  <td style={{padding:"9px 10px",borderBottom:"0.5px solid var(--border)",fontSize:12}}>{p.area}</td>
                  <td style={{padding:"9px 10px",borderBottom:"0.5px solid var(--border)"}}><Prazo d={dias(p.proximo_prazo)} /></td>
                  <td style={{padding:"9px 10px",borderBottom:"0.5px solid var(--border)"}}><Badge s={p.status} /></td>
                  <td style={{padding:"9px 10px",borderBottom:"0.5px solid var(--border)"}}><Btn sm>Abrir</Btn></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// LISTA PROCESSOS
// ─────────────────────────────────────────────
function ListaProcessos({ps,onAbrir,onNovo}){
  const [q,setQ]=useState("");
  const [fSt,setFSt]=useState("Todos");
  const [fAr,setFAr]=useState("Todas");
  const areas=["Todas",...new Set(ps.map(p=>p.area))];
  const sts=["Todos","Ativo","Urgente","Vencendo","Pendente","Encerrado"];
  const fil=ps.filter(p=>{
    const m=!q||[p.num,p.parte_autora,p.parte_re,p.area].some(s=>s.toLowerCase().includes(q.toLowerCase()));
    return m&&(fSt==="Todos"||p.status===fSt)&&(fAr==="Todas"||p.area===fAr);
  });
  return(
    <div>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:220,background:"var(--surface-1)",border:"0.5px solid var(--border)",borderRadius:7,padding:"7px 12px"}}>
          <span style={{fontSize:16,color:"var(--text-muted)"}}>🔍</span>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar por nº, parte, área…" style={{border:"none",background:"transparent",fontSize:13,outline:"none",width:"100%",color:"var(--text-primary)",fontFamily:"inherit"}} />
          <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 8px",borderRadius:20,background:"#eeedfe",color:"#3c3489",fontSize:10,fontWeight:600,border:"0.5px solid #afa9ec",whiteSpace:"nowrap"}}>✦ IA</span>
        </div>
        <select value={fSt} onChange={e=>setFSt(e.target.value)} style={{padding:"7px 10px",border:"0.5px solid var(--border-strong)",borderRadius:7,background:"var(--surface-1)",color:"var(--text-primary)",fontSize:12,fontFamily:"inherit"}}>
          {sts.map(s=><option key={s}>{s}</option>)}
        </select>
        <select value={fAr} onChange={e=>setFAr(e.target.value)} style={{padding:"7px 10px",border:"0.5px solid var(--border-strong)",borderRadius:7,background:"var(--surface-1)",color:"var(--text-primary)",fontSize:12,fontFamily:"inherit"}}>
          {areas.map(a=><option key={a}>{a}</option>)}
        </select>
        <Btn primary onClick={onNovo}>＋ Novo processo</Btn>
      </div>
      <div style={{background:"var(--surface-2)",border:"0.5px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead>
              <tr>{["Nº do processo","Partes","Área","Vara / Tribunal","Próximo prazo","Status","Ações"].map(h=><th key={h} style={{textAlign:"left",fontSize:10,color:"var(--text-muted)",padding:"8px 12px",borderBottom:"0.5px solid var(--border)",textTransform:"uppercase",letterSpacing:".04em",whiteSpace:"nowrap"}}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {fil.length===0&&<tr><td colSpan={7} style={{textAlign:"center",padding:32,color:"var(--text-muted)"}}>Nenhum processo encontrado</td></tr>}
              {fil.map(p=>(
                <tr key={p.id}>
                  <td style={{padding:"10px 12px",borderBottom:"0.5px solid var(--border)",fontFamily:"monospace",fontSize:11,whiteSpace:"nowrap"}}>{p.num}</td>
                  <td style={{padding:"10px 12px",borderBottom:"0.5px solid var(--border)"}}>
                    <div style={{fontWeight:600,fontSize:13}}>{p.parte_autora}</div>
                    <div style={{fontSize:11,color:"var(--text-muted)"}}>vs. {p.parte_re}</div>
                  </td>
                  <td style={{padding:"10px 12px",borderBottom:"0.5px solid var(--border)",fontSize:12}}>{p.area}</td>
                  <td style={{padding:"10px 12px",borderBottom:"0.5px solid var(--border)",fontSize:11,color:"var(--text-secondary)"}}>{p.vara}</td>
                  <td style={{padding:"10px 12px",borderBottom:"0.5px solid var(--border)"}}>
                    <Prazo d={dias(p.proximo_prazo)} />
                    {p.tipo_ato!=="—"&&<div style={{fontSize:10,color:"var(--text-muted)",marginTop:2}}>{p.tipo_ato}</div>}
                  </td>
                  <td style={{padding:"10px 12px",borderBottom:"0.5px solid var(--border)"}}><Badge s={p.status} /></td>
                  <td style={{padding:"10px 12px",borderBottom:"0.5px solid var(--border)"}}><Btn sm onClick={()=>onAbrir(p.id)}>Detalhes</Btn></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{marginTop:8,fontSize:12,color:"var(--text-muted)"}}>{fil.length} processo(s) encontrado(s)</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DETALHE
// ─────────────────────────────────────────────
function Detalhe({p,onVoltar}){
  const d=dias(p.proximo_prazo);
  const campos=[["Parte autora",p.parte_autora],["Parte ré",p.parte_re],["Advogado",p.advogado],["Distribuição",p.distribuicao],["Próximo prazo",p.proximo_prazo?p.proximo_prazo.split("-").reverse().join("/"):"—"],["Tipo de ato",p.tipo_ato],["Valor da causa",p.valor],["Fase",p.fase],["E-mail alertas",p.email_alerta]];
  return(
    <div>
      <Btn sm onClick={onVoltar} style={{marginBottom:14}}>← Voltar</Btn>
      <div style={{borderRadius:12,overflow:"hidden",border:"0.5px solid var(--border)",marginBottom:14}}>
        <div style={{background:"linear-gradient(135deg,#1a3a6b,#2d5fa6)",padding:"20px 24px",color:"#fff"}}>
          <div style={{fontFamily:"monospace",fontSize:17,fontWeight:700,marginBottom:4}}>{p.num}</div>
          <div style={{fontSize:13,opacity:.85}}>{p.area} · {p.vara}</div>
          <div style={{marginTop:10,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
            <Badge s={p.status} />
            {d!==null&&d<=7&&<span style={{background:"rgba(255,255,255,.2)",color:"#fff",fontSize:11,padding:"3px 10px",borderRadius:20}}>Prazo: {d}d — {p.tipo_ato}</span>}
          </div>
        </div>
        <div style={{background:"var(--surface-2)",padding:"18px 24px"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:18}}>
            {campos.map(([l,v])=>(
              <div key={l} style={{background:"var(--surface-1)",borderRadius:8,padding:"9px 12px"}}>
                <div style={{fontSize:11,color:"var(--text-muted)",marginBottom:2}}>{l}</div>
                <div style={{fontSize:13,fontWeight:500}}>{v}</div>
              </div>
            ))}
          </div>
          {p.pedido&&<>
            <div style={{fontSize:13,fontWeight:600,marginBottom:6}}>Objeto e pedidos</div>
            <div style={{background:"var(--surface-1)",borderRadius:8,padding:"10px 14px",fontSize:13,color:"var(--text-secondary)",marginBottom:18}}>{p.pedido}</div>
          </>}
          <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Histórico de movimentações</div>
          {p.movs.map((m,i)=>(
            <div key={i} style={{display:"flex",gap:10,paddingBottom:14}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:i===0?"#1a3a6b":"#3b6d11",flexShrink:0,marginTop:2}} />
                {i<p.movs.length-1&&<div style={{width:1,flex:1,background:"var(--border)",marginTop:3}} />}
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:500}}>{m.ev}</div>
                <div style={{fontSize:11,color:"var(--text-muted)"}}>{m.data}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// NOVO PROCESSO
// ─────────────────────────────────────────────
function NovoProcesso({onSalvar,onCancelar}){
  const [tab,setTab]=useState(0);
  const [ok,setOk]=useState(false);
  const [f,setF]=useState({num:"",area:"Trabalhista",fase:"Conhecimento",parte_autora:"",parte_re:"",vara:"",distribuicao:"",proximo_prazo:"",tipo_ato:"",valor:"",email_alerta:"",pedido:""});
  const s=(k,v)=>setF(x=>({...x,[k]:v}));

  function salvar(){
    if(!f.num||!f.parte_autora){alert("Informe o nº do processo e a parte autora.");return;}
    onSalvar({...f,id:Date.now(),status:"Ativo",advogado:"Dra. Marina Souza",movs:[{data:new Date().toLocaleDateString("pt-BR"),ev:"Processo cadastrado no sistema"}]});
    setOk(true); setTimeout(()=>{setOk(false);onCancelar();},1800);
  }

  if(ok) return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:280,gap:14}}>
      <div style={{width:64,height:64,borderRadius:"50%",background:"#eaf3de",display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,color:"#3b6d11"}}>✓</div>
      <div style={{fontSize:17,fontWeight:600}}>Processo cadastrado com sucesso!</div>
      <div style={{fontSize:13,color:"var(--text-secondary)"}}>Alertas de prazo configurados · redirecionando…</div>
    </div>
  );

  const tabStyle=(i)=>({padding:"9px 16px",fontSize:13,cursor:"pointer",color:tab===i?"#1a3a6b":"var(--text-secondary)",borderBottom:tab===i?"2px solid #1a3a6b":"2px solid transparent",fontWeight:tab===i?600:400,background:"none",border:"none",borderBottom:tab===i?"2px solid #1a3a6b":"2px solid transparent",fontFamily:"inherit"});

  return(
    <div>
      <div style={{display:"flex",borderBottom:"0.5px solid var(--border)",marginBottom:18}}>
        {["Digitação manual","Enviar PDF (IA)","Importar Excel (IA)"].map((t,i)=>(
          <button key={i} style={tabStyle(i)} onClick={()=>setTab(i)}>{t}</button>
        ))}
      </div>

      {tab===0&&(
        <div style={{background:"var(--surface-2)",border:"0.5px solid var(--border)",borderRadius:12,padding:20}}>
          <div style={{fontSize:14,fontWeight:600,marginBottom:18}}>Dados do processo</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <Inp label="Número do processo (CNJ) *" value={f.num} onChange={e=>s("num",e.target.value)} placeholder="0000000-00.0000.0.00.0000" full />
            <Sel label="Área jurídica" value={f.area} onChange={e=>s("area",e.target.value)} options={["Trabalhista","Cível","Tributário","Criminal","Previdenciário","Família","Empresarial"]} />
            <Sel label="Fase processual" value={f.fase} onChange={e=>s("fase",e.target.value)} options={["Conhecimento","Instrução","Sentença","Recurso","Execução"]} />
            <Inp label="Parte autora *" value={f.parte_autora} onChange={e=>s("parte_autora",e.target.value)} placeholder="Nome completo ou razão social" />
            <Inp label="Parte ré" value={f.parte_re} onChange={e=>s("parte_re",e.target.value)} placeholder="Nome completo ou razão social" />
            <Inp label="Vara / Tribunal" value={f.vara} onChange={e=>s("vara",e.target.value)} placeholder="Ex: 5ª Vara do Trabalho de Natal/RN" full />
            <Inp label="Data de distribuição" value={f.distribuicao} onChange={e=>s("distribuicao",e.target.value)} type="date" />
            <Inp label="Próximo prazo processual" value={f.proximo_prazo} onChange={e=>s("proximo_prazo",e.target.value)} type="date" />
            <Inp label="Tipo de ato" value={f.tipo_ato} onChange={e=>s("tipo_ato",e.target.value)} placeholder="Ex: Audiência, Contestação…" />
            <Inp label="Valor da causa" value={f.valor} onChange={e=>s("valor",e.target.value)} placeholder="R$ 0,00" />
            <Inp label="E-mail para alertas" value={f.email_alerta} onChange={e=>s("email_alerta",e.target.value)} type="email" placeholder="advogado@escritorio.com.br" full />
            <div style={{display:"flex",flexDirection:"column",gap:5,gridColumn:"1/-1"}}>
              <label style={{fontSize:12,color:"var(--text-secondary)",fontWeight:500}}>Objeto da ação e pedidos</label>
              <textarea value={f.pedido} onChange={e=>s("pedido",e.target.value)} placeholder="Descreva resumidamente o objeto e os pedidos principais…" style={{padding:"8px 10px",border:"0.5px solid var(--border-strong)",borderRadius:7,background:"var(--surface-1)",color:"var(--text-primary)",fontSize:13,fontFamily:"inherit",minHeight:80,resize:"vertical",width:"100%"}} />
            </div>
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:18}}>
            <Btn onClick={onCancelar}>Cancelar</Btn>
            <Btn primary onClick={salvar}>✓ Cadastrar processo</Btn>
          </div>
        </div>
      )}

      {tab===1&&(
        <div style={{background:"var(--surface-2)",border:"0.5px solid var(--border)",borderRadius:12,padding:20}}>
          <div style={{marginBottom:16}}>
            <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:20,background:"#eeedfe",color:"#3c3489",fontSize:11,fontWeight:600,border:"0.5px solid #afa9ec",marginBottom:8}}>✦ Leitura automática por IA</span>
            <p style={{fontSize:13,color:"var(--text-secondary)",marginTop:6}}>Faça upload do PDF do processo. A IA extrai e preenche automaticamente todos os campos — partes, número, prazos, vara e pedidos. Você revisa e confirma antes de salvar.</p>
          </div>
          <div style={{border:"1.5px dashed var(--border-strong)",borderRadius:12,padding:36,textAlign:"center",background:"var(--surface-1)",cursor:"pointer"}}>
            <div style={{fontSize:40,marginBottom:10}}>📄</div>
            <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>Arraste o PDF aqui ou clique para selecionar</div>
            <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:14}}>Petição inicial, decisão, despacho, certidão · PDF até 20 MB</div>
            <Btn primary sm>↑ Selecionar arquivo</Btn>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginTop:14}}>
            {[["🧠","Extração inteligente","Identifica partes, datas e prazos"],["👁","Revisão humana","Você confere antes de salvar"],["🔒","Privacidade","Documento processado e descartado"]].map(([ic,t,d])=>(
              <div key={t} style={{background:"var(--surface-1)",borderRadius:8,padding:"12px",textAlign:"center"}}>
                <div style={{fontSize:22,marginBottom:6}}>{ic}</div>
                <div style={{fontWeight:600,fontSize:13,marginBottom:2}}>{t}</div>
                <div style={{fontSize:11,color:"var(--text-muted)"}}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab===2&&(
        <div style={{background:"var(--surface-2)",border:"0.5px solid var(--border)",borderRadius:12,padding:20}}>
          <div style={{marginBottom:16}}>
            <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:20,background:"#eeedfe",color:"#3c3489",fontSize:11,fontWeight:600,border:"0.5px solid #afa9ec",marginBottom:8}}>✦ Importação inteligente via IA</span>
            <p style={{fontSize:13,color:"var(--text-secondary)",marginTop:6}}>Envie sua planilha Excel. A IA mapeia automaticamente as colunas, mesmo em formatos diferentes, e importa todos os processos de uma vez.</p>
          </div>
          <div style={{border:"1.5px dashed var(--border-strong)",borderRadius:12,padding:36,textAlign:"center",background:"var(--surface-1)",cursor:"pointer"}}>
            <div style={{fontSize:40,marginBottom:10}}>📊</div>
            <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>Arraste a planilha aqui ou clique para selecionar</div>
            <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:14}}>.xlsx · .xls · .csv · até 5 MB</div>
            <Btn primary sm>↑ Selecionar planilha</Btn>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginTop:14}}>
            {[["📐","Mapeamento automático","Adapta qualquer modelo de planilha"],["📋","Importação em lote","Centenas de processos de uma vez"],["✏️","Revisão prévia","Confirme antes de importar"]].map(([ic,t,d])=>(
              <div key={t} style={{background:"var(--surface-1)",borderRadius:8,padding:"12px",textAlign:"center"}}>
                <div style={{fontSize:22,marginBottom:6}}>{ic}</div>
                <div style={{fontWeight:600,fontSize:13,marginBottom:2}}>{t}</div>
                <div style={{fontSize:11,color:"var(--text-muted)"}}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// ALERTAS
// ─────────────────────────────────────────────
function Alertas({ps}){
  const com=ps.filter(p=>p.proximo_prazo).sort((a,b)=>new Date(a.proximo_prazo)-new Date(b.proximo_prazo));
  const urg=com.filter(p=>dias(p.proximo_prazo)<=3).length;
  const at=com.filter(p=>{ const d=dias(p.proximo_prazo); return d>3&&d<=7; }).length;
  const ok=com.filter(p=>dias(p.proximo_prazo)>7).length;
  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:18}}>
        <div style={{background:"var(--surface-2)",border:"0.5px solid var(--border)",borderRadius:12,padding:16,display:"flex",alignItems:"center",gap:20}}>
          {[[urg,"Urgentes (≤3d)","#e24b4a"],[at,"Atenção (≤7d)","#ba7517"],[ok,"No prazo","#3b6d11"]].map(([v,l,c],i)=>(
            <div key={l} style={{textAlign:"center",flex:1}}>
              {i>0&&<div style={{width:0.5,height:40,background:"var(--border)",position:"absolute"}} />}
              <div style={{fontSize:28,fontWeight:700,color:c}}>{v}</div>
              <div style={{fontSize:11,color:"var(--text-muted)",marginTop:2}}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{background:"var(--surface-2)",border:"0.5px solid var(--border)",borderRadius:12,padding:16}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:10}}>Configurar alertas por e-mail</div>
          <input defaultValue="marina@escritorio.com.br" style={{padding:"7px 10px",border:"0.5px solid var(--border-strong)",borderRadius:7,background:"var(--surface-1)",color:"var(--text-primary)",fontSize:12,width:"100%",marginBottom:10,fontFamily:"inherit"}} />
          <div style={{display:"flex",gap:14}}>
            {["7 dias antes","3 dias antes","1 dia antes"].map((l,i)=>(
              <label key={l} style={{display:"flex",alignItems:"center",gap:5,fontSize:12,cursor:"pointer"}}>
                <input type="checkbox" defaultChecked={i<2} style={{cursor:"pointer"}} /> {l}
              </label>
            ))}
          </div>
        </div>
      </div>
      <div style={{background:"var(--surface-2)",border:"0.5px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead>
            <tr>{["Processo","Evento","Data do prazo","Prazo restante","Alerta e-mail","Status"].map(h=><th key={h} style={{textAlign:"left",fontSize:10,color:"var(--text-muted)",padding:"8px 12px",borderBottom:"0.5px solid var(--border)",textTransform:"uppercase",letterSpacing:".04em",whiteSpace:"nowrap"}}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {com.map(p=>{
              const d=dias(p.proximo_prazo);
              return(
                <tr key={p.id}>
                  <td style={{padding:"10px 12px",borderBottom:"0.5px solid var(--border)",fontFamily:"monospace",fontSize:11}}>{p.num.slice(0,22)}…</td>
                  <td style={{padding:"10px 12px",borderBottom:"0.5px solid var(--border)",fontSize:12}}>{p.tipo_ato}</td>
                  <td style={{padding:"10px 12px",borderBottom:"0.5px solid var(--border)",fontSize:12}}>{p.proximo_prazo.split("-").reverse().join("/")}</td>
                  <td style={{padding:"10px 12px",borderBottom:"0.5px solid var(--border)"}}><Prazo d={d} /></td>
                  <td style={{padding:"10px 12px",borderBottom:"0.5px solid var(--border)"}}>{d<=7?<Badge s="Ativo" />:<span style={{fontSize:11,color:"var(--text-muted)"}}>Pendente</span>}</td>
                  <td style={{padding:"10px 12px",borderBottom:"0.5px solid var(--border)"}}><Badge s={p.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PERFIL
// ─────────────────────────────────────────────
function Perfil(){
  const [ok,setOk]=useState(false);
  const [f,setF]=useState({nome:"Marina Cristina Souza",email:"marina@escritorio.com.br",tel:"(81) 99999-1234",oab:"PE 45.678",escritorio:"Souza & Associados Advocacia",esp:"Trabalhista",end:"Av. Boa Viagem, 2000, Recife/PE"});
  const s=(k,v)=>setF(x=>({...x,[k]:v}));
  return(
    <div style={{maxWidth:640,margin:"0 auto"}}>
      <div style={{background:"var(--surface-2)",border:"0.5px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
        <div style={{height:80,background:"linear-gradient(135deg,#1a3a6b,#2d5fa6)"}} />
        <div style={{padding:"0 22px 22px"}}>
          <div style={{display:"flex",alignItems:"flex-end",gap:14,marginBottom:16}}>
            <div style={{width:64,height:64,borderRadius:"50%",background:"#1a3a6b",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:22,fontWeight:700,border:"3px solid var(--surface-2)",marginTop:-32}}>DM</div>
            <div style={{flex:1}}>
              <div style={{fontSize:18,fontWeight:700}}>Dra. Marina Souza</div>
              <div style={{fontSize:13,color:"var(--text-secondary)"}}>OAB/PE 45.678 · Advogada</div>
            </div>
            <Btn sm style={{marginBottom:4}}>📷 Foto</Btn>
          </div>
          <div style={{height:0.5,background:"var(--border)",margin:"0 0 16px"}} />
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <Inp label="Nome completo" value={f.nome} onChange={e=>s("nome",e.target.value)} />
            <Inp label="E-mail" value={f.email} onChange={e=>s("email",e.target.value)} type="email" />
            <Inp label="Telefone / WhatsApp" value={f.tel} onChange={e=>s("tel",e.target.value)} />
            <Inp label="Número OAB" value={f.oab} onChange={e=>s("oab",e.target.value)} />
            <Inp label="Escritório / Empresa" value={f.escritorio} onChange={e=>s("escritorio",e.target.value)} />
            <Sel label="Especialidade" value={f.esp} onChange={e=>s("esp",e.target.value)} options={["Trabalhista","Cível","Tributário","Criminal","Previdenciário","Família"]} />
            <Inp label="Endereço do escritório" value={f.end} onChange={e=>s("end",e.target.value)} full />
            <Inp label="Nova senha (em branco = não alterar)" type="password" placeholder="••••••••" full />
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:18}}>
            <Btn>Cancelar</Btn>
            <Btn primary onClick={()=>{setOk(true);setTimeout(()=>setOk(false),2000);}}>
              {ok?"✓ Salvo!":"💾 Salvar perfil"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────
function Admin({ps}){
  const [us,setUs]=useState(USUARIOS);
  const [modal,setModal]=useState(false);
  const [nu,setNu]=useState({nome:"",email:"",perfil:"Advogado"});
  const sn=(k,v)=>setNu(x=>({...x,[k]:v}));
  function aprovar(id){setUs(u=>u.map(x=>x.id===id?{...x,status:"Ativo",acesso:"Seus processos"}:x));}
  function remover(id){setUs(u=>u.filter(x=>x.id!==id));}
  function criar(){
    if(!nu.nome||!nu.email)return;
    setUs(u=>[...u,{id:Date.now(),...nu,status:"Ativo",acesso:"Seus processos",ini:nu.nome.split(" ").map(n=>n[0]).slice(0,2).join("").toUpperCase(),cor:"#378add",ultimo:"—"}]);
    setModal(false);setNu({nome:"",email:"",perfil:"Advogado"});
  }
  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:18}}>
        {[["Usuários ativos",us.filter(u=>u.status==="Ativo").length,"inherit"],["Aguardando aprovação",us.filter(u=>u.status==="Pendente").length,"#ba7517"],["Processos no sistema",ps.length,"#1a3a6b"]].map(([l,v,c])=>(
          <div key={l} style={{background:"var(--surface-2)",border:"0.5px solid var(--border)",borderRadius:12,padding:16}}>
            <div style={{fontSize:12,color:"var(--text-secondary)",marginBottom:6}}>{l}</div>
            <div style={{fontSize:28,fontWeight:700,color:c}}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{background:"var(--surface-2)",border:"0.5px solid var(--border)",borderRadius:12,marginBottom:14,overflow:"hidden"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",borderBottom:"0.5px solid var(--border)"}}>
          <span style={{fontSize:14,fontWeight:600}}>Gestão de usuários</span>
          <Btn primary sm onClick={()=>setModal(true)}>＋ Criar usuário</Btn>
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead>
              <tr>{["Usuário","E-mail","Perfil","Status","Acesso","Último acesso","Ações"].map(h=><th key={h} style={{textAlign:"left",fontSize:10,color:"var(--text-muted)",padding:"8px 12px",borderBottom:"0.5px solid var(--border)",textTransform:"uppercase",letterSpacing:".04em",whiteSpace:"nowrap"}}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {us.map(u=>(
                <tr key={u.id}>
                  <td style={{padding:"10px 12px",borderBottom:"0.5px solid var(--border)"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}><Av ini={u.ini} cor={u.cor} size={28} /><span style={{fontWeight:500}}>{u.nome}</span></div>
                  </td>
                  <td style={{padding:"10px 12px",borderBottom:"0.5px solid var(--border)",fontSize:12,color:"var(--text-secondary)"}}>{u.email}</td>
                  <td style={{padding:"10px 12px",borderBottom:"0.5px solid var(--border)"}}><Badge s={u.perfil==="Admin"?"Admin":u.perfil} /></td>
                  <td style={{padding:"10px 12px",borderBottom:"0.5px solid var(--border)"}}>
                    {u.status==="Ativo"?<span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:20,fontSize:11,background:"#eaf3de",color:"#3b6d11",border:"0.5px solid #c0dd97"}}>● Ativo</span>:<span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:20,fontSize:11,background:"var(--surface-1)",color:"var(--text-muted)",border:"0.5px solid var(--border)"}}>○ Aguardando</span>}
                  </td>
                  <td style={{padding:"10px 12px",borderBottom:"0.5px solid var(--border)",fontSize:12}}>{u.acesso}</td>
                  <td style={{padding:"10px 12px",borderBottom:"0.5px solid var(--border)",fontSize:12,color:"var(--text-muted)"}}>{u.ultimo}</td>
                  <td style={{padding:"10px 12px",borderBottom:"0.5px solid var(--border)"}}>
                    <div style={{display:"flex",gap:6}}>
                      {u.status==="Pendente"?<><Btn primary sm onClick={()=>aprovar(u.id)}>Aprovar</Btn><Btn danger sm onClick={()=>remover(u.id)}>Recusar</Btn></>:<Btn sm onClick={()=>remover(u.id)}>🗑</Btn>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{background:"var(--surface-2)",border:"0.5px solid var(--border)",borderRadius:12,padding:16}}>
        <div style={{fontSize:14,fontWeight:600,marginBottom:12}}>Log de acessos recentes</div>
        {us.filter(u=>u.ultimo!=="—").map(u=>(
          <div key={u.id} style={{display:"flex",gap:10,alignItems:"center",padding:"7px 0",borderBottom:"0.5px solid var(--border)",fontSize:12}}>
            <span style={{color:"var(--text-muted)",minWidth:110}}>{u.ultimo}</span>
            <Av ini={u.ini} cor={u.cor} size={22} />
            <span style={{flex:1}}>{u.email}</span>
            <span style={{color:"var(--text-secondary)"}}>Login · Browser</span>
          </div>
        ))}
      </div>
      <Modal open={modal} onClose={()=>setModal(false)} title="Criar novo usuário"
        footer={<><Btn onClick={()=>setModal(false)}>Cancelar</Btn><Btn primary onClick={criar}>✓ Criar usuário</Btn></>}>
        <div style={{display:"grid",gridTemplateColumns:"1fr",gap:12}}>
          <Inp label="Nome completo" value={nu.nome} onChange={e=>sn("nome",e.target.value)} placeholder="Nome completo" />
          <Inp label="E-mail" value={nu.email} onChange={e=>sn("email",e.target.value)} type="email" placeholder="email@escritorio.com.br" />
          <Sel label="Perfil de acesso" value={nu.perfil} onChange={e=>sn("perfil",e.target.value)} options={["Admin","Advogado","Estagiário","Somente leitura"]} />
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────
// APP RAIZ
// ─────────────────────────────────────────────
export default function App(){
  const [tela,setTela]=useState("dashboard");
  const [pAtivo,setPAtivo]=useState(null);
  const [ps,setPs]=useState(MOCK);
  const [mAlert,setMAlert]=useState(false);

  const urgCount=ps.filter(p=>{ const d=dias(p.proximo_prazo); return d!==null&&d<=3; }).length;

  function abrirP(id){ setPAtivo(ps.find(p=>p.id===id)); setTela("detalhe"); }
  function salvarP(dados){ setPs(x=>[dados,...x]); }

  const NAV=[
    {id:"dashboard",ic:"📊",lb:"Dashboard",sec:"Principal"},
    {id:"processos",ic:"📁",lb:"Processos",badge:ps.filter(p=>p.status!=="Encerrado").length},
    {id:"alertas",ic:"🔔",lb:"Alertas",badge:urgCount||null},
    {id:"novo",ic:"＋",lb:"Novo processo",sec:"Cadastro"},
    {id:"perfil",ic:"👤",lb:"Meu perfil",sec:"Sistema"},
    {id:"admin",ic:"🛡",lb:"Administração"},
  ];

  const TITULOS={dashboard:"Dashboard",processos:"Processos",alertas:"Alertas de prazo",novo:"Novo processo",perfil:"Meu perfil",admin:"Administração",detalhe:"Detalhe do processo"};

  return(
    <div style={{display:"flex",height:"100vh",overflow:"hidden",fontFamily:"var(--font-sans)",background:"var(--surface-0)",color:"var(--text-primary)",fontSize:14}}>
      {/* SIDEBAR */}
      <div style={{width:224,minWidth:224,background:"var(--surface-2)",borderRight:"0.5px solid var(--border)",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"18px 14px",borderBottom:"0.5px solid var(--border)",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:8,background:"#1a3a6b",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>⚖️</div>
          <div>
            <div style={{fontSize:15,fontWeight:700}}>JurisTrack</div>
            <div style={{fontSize:11,color:"var(--text-muted)"}}>Gestão Jurídica</div>
          </div>
        </div>
        <nav style={{flex:1,padding:"10px 8px",display:"flex",flexDirection:"column",gap:1,overflowY:"auto"}}>
          {NAV.map((item,i)=>(
            <div key={item.id}>
              {item.sec&&<div style={{fontSize:10,fontWeight:600,color:"var(--text-muted)",letterSpacing:".06em",textTransform:"uppercase",padding:"10px 8px 4px"}}>{item.sec}</div>}
              <div onClick={()=>setTela(item.id)} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 10px",borderRadius:7,cursor:"pointer",background:tela===item.id?"#1a3a6b":"transparent",color:tela===item.id?"#fff":"var(--text-secondary)",fontSize:13,fontWeight:tela===item.id?600:400,transition:"background .12s"}}>
                <span style={{fontSize:15}}>{item.ic}</span>
                {item.lb}
                {item.badge>0&&<span style={{marginLeft:"auto",background:"#e24b4a",color:"#fff",fontSize:10,padding:"1px 6px",borderRadius:10,fontWeight:700}}>{item.badge}</span>}
              </div>
            </div>
          ))}
        </nav>
        <div style={{padding:"10px 8px",borderTop:"0.5px solid var(--border)"}}>
          <div onClick={()=>setTela("perfil")} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:7,cursor:"pointer"}}>
            <Av ini="DM" size={30} />
            <div>
              <div style={{fontSize:13,fontWeight:600}}>Dra. Marina</div>
              <div style={{fontSize:11,color:"var(--text-muted)"}}>Advogada · Admin</div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* TOPBAR */}
        <div style={{height:52,borderBottom:"0.5px solid var(--border)",display:"flex",alignItems:"center",padding:"0 20px",gap:10,background:"var(--surface-2)",flexShrink:0}}>
          <div style={{flex:1,fontSize:15,fontWeight:600}}>{TITULOS[tela]||tela}</div>
          <button onClick={()=>setMAlert(true)} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:7,border:"0.5px solid var(--border-strong)",background:"var(--surface-2)",color:"var(--text-primary)",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
            🔔 {urgCount>0&&<span style={{background:"#e24b4a",color:"#fff",borderRadius:10,fontSize:10,padding:"1px 5px",fontWeight:700}}>{urgCount}</span>} Alertas
          </button>
          <Btn primary sm onClick={()=>setTela("novo")}>＋ Novo processo</Btn>
        </div>

        {/* CONTEÚDO */}
        <div style={{flex:1,overflowY:"auto",padding:20}}>
          {tela==="dashboard"&&<Dashboard ps={ps} onNav={setTela} onAbrir={abrirP} />}
          {tela==="processos"&&<ListaProcessos ps={ps} onAbrir={abrirP} onNovo={()=>setTela("novo")} />}
          {tela==="detalhe"&&pAtivo&&<Detalhe p={pAtivo} onVoltar={()=>setTela("processos")} />}
          {tela==="novo"&&<NovoProcesso onSalvar={salvarP} onCancelar={()=>setTela("processos")} />}
          {tela==="alertas"&&<Alertas ps={ps} />}
          {tela==="perfil"&&<Perfil />}
          {tela==="admin"&&<Admin ps={ps} />}
        </div>
      </div>

      {/* MODAL ALERTAS RÁPIDO */}
      <Modal open={mAlert} onClose={()=>setMAlert(false)} title="🔔 Alertas de prazo"
        footer={<><Btn onClick={()=>setMAlert(false)}>Fechar</Btn><Btn primary onClick={()=>{setMAlert(false);setTela("alertas");}}>Ver todos</Btn></>}>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {ps.filter(p=>{ const d=dias(p.proximo_prazo); return d!==null&&d<=7; }).sort((a,b)=>dias(a.proximo_prazo)-dias(b.proximo_prazo)).map(p=>{
            const d=dias(p.proximo_prazo);
            return(
              <div key={p.id} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 12px",borderRadius:8,border:`0.5px solid ${d<=3?"#f09595":"#fac775"}`,background:d<=3?"#fcebeb":"#faeeda"}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:d<=3?"#e24b4a":"#ba7517",marginTop:4,flexShrink:0}} />
                <div>
                  <div style={{fontSize:12,fontFamily:"monospace",fontWeight:700}}>{p.num}</div>
                  <div style={{fontSize:12,color:"#555"}}>{p.tipo_ato} · {d} dia{d!==1?"s":""} — {p.proximo_prazo.split("-").reverse().join("/")}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
