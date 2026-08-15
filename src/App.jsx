import { useState, useEffect, useCallback } from "react";
import { supabase, AuthService, ProcessoService, MovimentacaoService, AdminService } from "./lib/supabase.js";

// ─── UTILS ────────────────────────────────────────────────────────────────────
function diasRestantes(dataStr) {
  if (!dataStr) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const prazo = new Date(dataStr);
  return Math.ceil((prazo - hoje) / 86400000);
}

function fmtData(dataStr) {
  if (!dataStr) return "—";
  return new Date(dataStr + "T00:00:00").toLocaleDateString("pt-BR");
}

// ─── COMPONENTES BASE ─────────────────────────────────────────────────────────
function Av({ nome = "?", cor = "#1a3a6b", size = 32 }) {
  const ini = nome.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: cor, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: size * 0.34, fontWeight: 700, flexShrink: 0 }}>
      {ini}
    </div>
  );
}

function Badge({ s }) {
  const map = { Urgente: ["#a32d2d", "#fcebeb"], Vencendo: ["#854f0b", "#faeeda"], Ativo: ["#3b6d11", "#eaf3de"], Encerrado: ["#555", "#f0f0f0"], Pendente: ["#185fa5", "#e6f1fb"], admin: ["#3c3489", "#eeedfe"], advogado: ["#3b6d11", "#eaf3de"], estagiario: ["#555", "#f0f0f0"], leitura: ["#555", "#f0f0f0"] };
  const [c, bg] = map[s] || ["#555", "#f0f0f0"];
  return <span style={{ display: "inline-flex", padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, color: c, background: bg }}>{s}</span>;
}

function Prazo({ d }) {
  if (d === null) return <span style={{ color: "#aaa" }}>—</span>;
  if (d <= 0) return <span style={{ color: "#e24b4a", fontWeight: 700 }}>Vencido</span>;
  if (d <= 3) return <span style={{ color: "#e24b4a", fontWeight: 700 }}>⚠ {d}d</span>;
  if (d <= 7) return <span style={{ color: "#ba7517", fontWeight: 600 }}>{d}d</span>;
  return <span style={{ color: "var(--text-secondary)" }}>{d}d</span>;
}

function Btn({ children, primary, danger, sm, onClick, disabled, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: sm ? "5px 11px" : "8px 15px", borderRadius: 7, border: `0.5px solid ${primary ? "#1a3a6b" : danger ? "#f09595" : "var(--border-strong)"}`, background: disabled ? "var(--surface-1)" : primary ? "#1a3a6b" : danger ? "#fcebeb" : "var(--surface-2)", color: disabled ? "var(--text-muted)" : primary ? "#fff" : danger ? "#a32d2d" : "var(--text-primary)", fontSize: sm ? 12 : 13, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit", fontWeight: 500, opacity: disabled ? 0.6 : 1, ...style }}>
      {children}
    </button>
  );
}

function Input({ label, value, onChange, type = "text", placeholder = "", full = false, required = false }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, gridColumn: full ? "1/-1" : "" }}>
      {label && <label style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>{label}{required && <span style={{ color: "#e24b4a" }}> *</span>}</label>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} required={required}
        style={{ padding: "8px 10px", border: "0.5px solid var(--border-strong)", borderRadius: 7, background: "var(--surface-1)", color: "var(--text-primary)", fontSize: 13, fontFamily: "inherit", width: "100%" }} />
    </div>
  );
}

function Select({ label, value, onChange, options, full = false }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, gridColumn: full ? "1/-1" : "" }}>
      {label && <label style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>{label}</label>}
      <select value={value} onChange={onChange} style={{ padding: "8px 10px", border: "0.5px solid var(--border-strong)", borderRadius: 7, background: "var(--surface-1)", color: "var(--text-primary)", fontSize: 13, fontFamily: "inherit", width: "100%" }}>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
      <div style={{ background: "var(--surface-2)", borderRadius: 12, border: "0.5px solid var(--border)", width: 500, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.25)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "0.5px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 600, fontSize: 15 }}>
          {title}
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--text-muted)", padding: "2px 6px" }}>✕</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
        {footer && <div style={{ padding: "12px 20px", borderTop: "0.5px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end" }}>{footer}</div>}
      </div>
    </div>
  );
}

function Spinner() {
  return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}><div style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTop: "3px solid #1a3a6b", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /></div>;
}

function Erro({ msg, onRetry }) {
  return (
    <div style={{ textAlign: "center", padding: 32 }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
      <div style={{ color: "#e24b4a", marginBottom: 12, fontSize: 13 }}>{msg}</div>
      {onRetry && <Btn onClick={onRetry}>Tentar novamente</Btn>}
    </div>
  );
}

// ─── TELA DE LOGIN ────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [modo, setModo] = useState("login"); // login | cadastro | recuperar
  const [msg, setMsg] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true); setErro("");
    try {
      await AuthService.login(email, senha);
      onLogin();
    } catch (err) {
      setErro("E-mail ou senha incorretos.");
    } finally { setLoading(false); }
  }

  async function handleCadastro(e) {
    e.preventDefault();
    setLoading(true); setErro("");
    try {
      const { error } = await supabase.auth.signUp({ email, password: senha, options: { data: { nome: email.split("@")[0] } } });
      if (error) throw error;
      setMsg("Conta criada! Verifique seu e-mail para confirmar (ou entre direto se o admin desativou a confirmação).");
      setModo("login");
    } catch (err) {
      setErro(err.message || "Erro ao criar conta.");
    } finally { setLoading(false); }
  }

  async function handleRecuperar(e) {
    e.preventDefault();
    setLoading(true); setErro("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setMsg("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
      setModo("login");
    } catch (err) {
      setErro("Erro ao enviar e-mail de recuperação.");
    } finally { setLoading(false); }
  }

  const fn = modo === "login" ? handleLogin : modo === "cadastro" ? handleCadastro : handleRecuperar;
  const titulo = modo === "login" ? "Entrar" : modo === "cadastro" ? "Criar conta" : "Recuperar senha";

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-0)" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: 380, background: "var(--surface-2)", border: "0.5px solid var(--border)", borderRadius: 16, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,.12)" }}>
        <div style={{ background: "linear-gradient(135deg,#1a3a6b,#2d5fa6)", padding: "28px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>⚖️</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>JurisTrack</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)", marginTop: 4 }}>Gestão de Processos Judiciais</div>
        </div>
        <div style={{ padding: 24 }}>
          {msg && <div style={{ background: "#eaf3de", border: "0.5px solid #c0dd97", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#3b6d11", marginBottom: 16 }}>{msg}</div>}
          {erro && <div style={{ background: "#fcebeb", border: "0.5px solid #f09595", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#a32d2d", marginBottom: 16 }}>{erro}</div>}
          <form onSubmit={fn} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input label="E-mail" value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="seu@email.com" required />
            {modo !== "recuperar" && <Input label="Senha" value={senha} onChange={e => setSenha(e.target.value)} type="password" placeholder="••••••••" required />}
            <Btn primary disabled={loading} onClick={fn} style={{ justifyContent: "center", padding: "10px" }}>
              {loading ? "Aguarde..." : titulo}
            </Btn>
          </form>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
            {modo === "login" && <>
              <button onClick={() => { setModo("cadastro"); setErro(""); }} style={{ background: "none", border: "none", color: "#1a3a6b", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Não tem conta? Criar conta</button>
              <button onClick={() => { setModo("recuperar"); setErro(""); }} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Esqueci minha senha</button>
            </>}
            {modo !== "login" && <button onClick={() => { setModo("login"); setErro(""); }} style={{ background: "none", border: "none", color: "#1a3a6b", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>← Voltar ao login</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ processos, onNav, onAbrir }) {
  const urg = processos.filter(p => { const d = diasRestantes(p.proximo_prazo); return d !== null && d <= 3; });
  const v7 = processos.filter(p => { const d = diasRestantes(p.proximo_prazo); return d !== null && d > 3 && d <= 7; });
  const enc = processos.filter(p => p.status === "Encerrado");
  const areas = processos.reduce((a, p) => { a[p.area] = (a[p.area] || 0) + 1; return a; }, {});
  const maxA = Math.max(...Object.values(areas), 1);
  const cores = ["#1a3a6b", "#2d5fa6", "#185fa5", "#378add", "#85b7eb"];
  const card = { background: "var(--surface-2)", border: "0.5px solid var(--border)", borderRadius: 12, padding: 16 };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
        {[
          { l: "Total de processos", v: processos.length, sub: `${processos.length - enc.length} ativos`, c: "inherit" },
          { l: "Vencendo em 7 dias", v: v7.length, sub: "Atenção", c: v7.length ? "#ba7517" : "inherit" },
          { l: "Urgente (≤ 3 dias)", v: urg.length, sub: "Ação imediata", c: urg.length ? "#e24b4a" : "inherit" },
          { l: "Encerrados", v: enc.length, sub: "Concluídos", c: "#3b6d11" },
        ].map(k => (
          <div key={k.l} style={card}>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>{k.l}</div>
            <div style={{ fontSize: 30, fontWeight: 700, color: k.c, lineHeight: 1 }}>{k.v}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Alertas de prazo</span>
            <span style={{ fontSize: 12, color: "#1a3a6b", cursor: "pointer" }} onClick={() => onNav("alertas")}>ver todos →</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {processos.filter(p => { const d = diasRestantes(p.proximo_prazo); return d !== null && d <= 7; })
              .sort((a, b) => diasRestantes(a.proximo_prazo) - diasRestantes(b.proximo_prazo)).slice(0, 4)
              .map(p => {
                const d = diasRestantes(p.proximo_prazo);
                const u = d <= 3;
                return (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, border: `0.5px solid ${u ? "#f09595" : "#fac775"}`, background: u ? "#fcebeb" : "#faeeda" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: u ? "#e24b4a" : "#ba7517", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.num}</div>
                      <div style={{ fontSize: 11, color: "#666" }}>{p.tipo_ato} · {d}d</div>
                    </div>
                    <Btn sm onClick={() => onAbrir(p.id)}>Ver</Btn>
                  </div>
                );
              })}
            {processos.filter(p => { const d = diasRestantes(p.proximo_prazo); return d !== null && d <= 7; }).length === 0 && (
              <div style={{ textAlign: "center", padding: 20, color: "var(--text-muted)", fontSize: 13 }}>✅ Nenhum prazo urgente</div>
            )}
          </div>
        </div>

        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Distribuição por área</div>
          {Object.entries(areas).map(([area, qtd], i) => (
            <div key={area} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
              <div style={{ width: 90, fontSize: 11, color: "var(--text-secondary)", textAlign: "right", flexShrink: 0 }}>{area}</div>
              <div style={{ flex: 1, height: 18, background: "var(--surface-1)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.round(qtd / maxA * 100)}%`, background: cores[i] || "#1a3a6b", borderRadius: 4, display: "flex", alignItems: "center", paddingLeft: 7, fontSize: 11, color: "#fff", fontWeight: 700 }}>{qtd}</div>
              </div>
            </div>
          ))}
          {Object.keys(areas).length === 0 && <div style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: 20 }}>Nenhum processo ainda</div>}
        </div>
      </div>

      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Processos recentes</span>
          <span style={{ fontSize: 12, color: "#1a3a6b", cursor: "pointer" }} onClick={() => onNav("processos")}>ver todos →</span>
        </div>
        {processos.length === 0 ? (
          <div style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
            Nenhum processo cadastrado ainda.
            <br /><br />
            <Btn primary onClick={() => onNav("novo")}>＋ Cadastrar primeiro processo</Btn>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>{["Nº do processo", "Parte autora", "Área", "Prazo", "Status", ""].map(h => <th key={h} style={{ textAlign: "left", fontSize: 10, color: "var(--text-muted)", padding: "7px 10px", borderBottom: "0.5px solid var(--border)", textTransform: "uppercase", letterSpacing: ".04em", whiteSpace: "nowrap" }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {processos.slice(0, 5).map(p => (
                  <tr key={p.id} style={{ cursor: "pointer" }} onClick={() => onAbrir(p.id)}>
                    <td style={{ padding: "9px 10px", borderBottom: "0.5px solid var(--border)", fontFamily: "monospace", fontSize: 11 }}>{p.num.slice(0, 24)}…</td>
                    <td style={{ padding: "9px 10px", borderBottom: "0.5px solid var(--border)" }}>{p.parte_autora}</td>
                    <td style={{ padding: "9px 10px", borderBottom: "0.5px solid var(--border)", fontSize: 12 }}>{p.area}</td>
                    <td style={{ padding: "9px 10px", borderBottom: "0.5px solid var(--border)" }}><Prazo d={diasRestantes(p.proximo_prazo)} /></td>
                    <td style={{ padding: "9px 10px", borderBottom: "0.5px solid var(--border)" }}><Badge s={p.status} /></td>
                    <td style={{ padding: "9px 10px", borderBottom: "0.5px solid var(--border)" }}><Btn sm>Abrir</Btn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── LISTA PROCESSOS ──────────────────────────────────────────────────────────
function ListaProcessos({ processos, onAbrir, onNovo, onExcluir, perfil }) {
  const [q, setQ] = useState("");
  const [fSt, setFSt] = useState("Todos");
  const [fAr, setFAr] = useState("Todas");
  const areas = ["Todas", ...new Set(processos.map(p => p.area))];
  const sts = ["Todos", "Ativo", "Urgente", "Vencendo", "Pendente", "Encerrado"];
  const fil = processos.filter(p => {
    const m = !q || [p.num, p.parte_autora, p.parte_re || "", p.area].some(s => s.toLowerCase().includes(q.toLowerCase()));
    return m && (fSt === "Todos" || p.status === fSt) && (fAr === "Todas" || p.area === fAr);
  });
  const podeEditar = perfil?.role === "admin" || perfil?.role === "advogado";

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 200, background: "var(--surface-1)", border: "0.5px solid var(--border)", borderRadius: 7, padding: "7px 12px" }}>
          <span style={{ fontSize: 15, color: "var(--text-muted)" }}>🔍</span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nº, parte, área…" style={{ border: "none", background: "transparent", fontSize: 13, outline: "none", width: "100%", color: "var(--text-primary)", fontFamily: "inherit" }} />
        </div>
        <select value={fSt} onChange={e => setFSt(e.target.value)} style={{ padding: "7px 10px", border: "0.5px solid var(--border-strong)", borderRadius: 7, background: "var(--surface-1)", color: "var(--text-primary)", fontSize: 12, fontFamily: "inherit" }}>
          {sts.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={fAr} onChange={e => setFAr(e.target.value)} style={{ padding: "7px 10px", border: "0.5px solid var(--border-strong)", borderRadius: 7, background: "var(--surface-1)", color: "var(--text-primary)", fontSize: 12, fontFamily: "inherit" }}>
          {areas.map(a => <option key={a}>{a}</option>)}
        </select>
        {podeEditar && <Btn primary onClick={onNovo}>＋ Novo processo</Btn>}
      </div>

      <div style={{ background: "var(--surface-2)", border: "0.5px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>{["Nº do processo", "Partes", "Área", "Vara / Tribunal", "Próximo prazo", "Status", "Ações"].map(h => <th key={h} style={{ textAlign: "left", fontSize: 10, color: "var(--text-muted)", padding: "8px 12px", borderBottom: "0.5px solid var(--border)", textTransform: "uppercase", letterSpacing: ".04em", whiteSpace: "nowrap" }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {fil.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>Nenhum processo encontrado</td></tr>}
              {fil.map(p => (
                <tr key={p.id}>
                  <td style={{ padding: "10px 12px", borderBottom: "0.5px solid var(--border)", fontFamily: "monospace", fontSize: 11 }}>{p.num}</td>
                  <td style={{ padding: "10px 12px", borderBottom: "0.5px solid var(--border)" }}>
                    <div style={{ fontWeight: 600 }}>{p.parte_autora}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>vs. {p.parte_re}</div>
                  </td>
                  <td style={{ padding: "10px 12px", borderBottom: "0.5px solid var(--border)", fontSize: 12 }}>{p.area}</td>
                  <td style={{ padding: "10px 12px", borderBottom: "0.5px solid var(--border)", fontSize: 11, color: "var(--text-secondary)" }}>{p.vara}</td>
                  <td style={{ padding: "10px 12px", borderBottom: "0.5px solid var(--border)" }}>
                    <Prazo d={diasRestantes(p.proximo_prazo)} />
                    {p.tipo_ato && <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{p.tipo_ato}</div>}
                  </td>
                  <td style={{ padding: "10px 12px", borderBottom: "0.5px solid var(--border)" }}><Badge s={p.status} /></td>
                  <td style={{ padding: "10px 12px", borderBottom: "0.5px solid var(--border)" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Btn sm onClick={() => onAbrir(p.id)}>Detalhes</Btn>
                      {podeEditar && <Btn sm danger onClick={() => onExcluir(p.id)}>🗑</Btn>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>{fil.length} processo(s)</div>
    </div>
  );
}

// ─── DETALHE PROCESSO ─────────────────────────────────────────────────────────
function DetalheProcesso({ processoId, onVoltar, perfil }) {
  const [p, setP] = useState(null);
  const [movs, setMovs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [novoMov, setNovoMov] = useState("");
  const [salvando, setSalvando] = useState(false);
  const podeEditar = perfil?.role === "admin" || perfil?.role === "advogado";

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      try {
        const data = await ProcessoService.buscarPorId(processoId);
        setP(data);
        const ms = await MovimentacaoService.listar(processoId);
        setMovs(ms);
      } finally { setLoading(false); }
    }
    carregar();
  }, [processoId]);

  async function adicionarMov() {
    if (!novoMov.trim()) return;
    setSalvando(true);
    try {
      const m = await MovimentacaoService.criar({ processo_id: processoId, evento: novoMov, usuario_id: perfil?.id });
      setMovs(ms => [m, ...ms]);
      setNovoMov("");
    } finally { setSalvando(false); }
  }

  if (loading) return <Spinner />;
  if (!p) return <Erro msg="Processo não encontrado." onRetry={onVoltar} />;

  const d = diasRestantes(p.proximo_prazo);
  const campos = [["Parte autora", p.parte_autora], ["Parte ré", p.parte_re], ["Advogado", p.advogado?.nome || "—"], ["Distribuição", fmtData(p.distribuicao)], ["Próximo prazo", fmtData(p.proximo_prazo)], ["Tipo de ato", p.tipo_ato || "—"], ["Valor da causa", p.valor || "—"], ["Fase", p.fase], ["E-mail alertas", p.email_alerta || "—"]];

  return (
    <div>
      <Btn sm onClick={onVoltar} style={{ marginBottom: 14 }}>← Voltar</Btn>
      <div style={{ borderRadius: 12, overflow: "hidden", border: "0.5px solid var(--border)", marginBottom: 14 }}>
        <div style={{ background: "linear-gradient(135deg,#1a3a6b,#2d5fa6)", padding: "20px 24px", color: "#fff" }}>
          <div style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{p.num}</div>
          <div style={{ fontSize: 13, opacity: .85 }}>{p.area} · {p.vara}</div>
          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Badge s={p.status} />
            {d !== null && d <= 7 && <span style={{ background: "rgba(255,255,255,.2)", color: "#fff", fontSize: 11, padding: "3px 10px", borderRadius: 20 }}>Prazo: {d}d — {p.tipo_ato}</span>}
          </div>
        </div>
        <div style={{ background: "var(--surface-2)", padding: "18px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 18 }}>
            {campos.map(([l, v]) => (
              <div key={l} style={{ background: "var(--surface-1)", borderRadius: 8, padding: "9px 12px" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>{l}</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{v}</div>
              </div>
            ))}
          </div>
          {p.pedido && <>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Objeto e pedidos</div>
            <div style={{ background: "var(--surface-1)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "var(--text-secondary)", marginBottom: 18 }}>{p.pedido}</div>
          </>}

          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Histórico de movimentações</div>
          {podeEditar && (
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input value={novoMov} onChange={e => setNovoMov(e.target.value)} placeholder="Registrar nova movimentação…" onKeyDown={e => e.key === "Enter" && adicionarMov()}
                style={{ flex: 1, padding: "8px 10px", border: "0.5px solid var(--border-strong)", borderRadius: 7, background: "var(--surface-1)", color: "var(--text-primary)", fontSize: 13, fontFamily: "inherit" }} />
              <Btn primary disabled={salvando || !novoMov.trim()} onClick={adicionarMov}>Registrar</Btn>
            </div>
          )}
          {movs.length === 0 && <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Nenhuma movimentação registrada.</div>}
          {movs.map((m, i) => (
            <div key={m.id} style={{ display: "flex", gap: 10, paddingBottom: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: i === 0 ? "#1a3a6b" : "#3b6d11", flexShrink: 0, marginTop: 2 }} />
                {i < movs.length - 1 && <div style={{ width: 1, flex: 1, background: "var(--border)", marginTop: 3 }} />}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{m.evento}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{fmtData(m.data)} {m.usuario?.nome ? `· ${m.usuario.nome}` : ""}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── NOVO / EDITAR PROCESSO ───────────────────────────────────────────────────
function FormProcesso({ onSalvar, onCancelar, perfil }) {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [erro, setErro] = useState("");
  const [f, setF] = useState({ num: "", area: "Trabalhista", fase: "Conhecimento", parte_autora: "", parte_re: "", vara: "", distribuicao: "", proximo_prazo: "", tipo_ato: "", valor: "", email_alerta: perfil?.email || "", pedido: "" });
  const s = (k, v) => setF(x => ({ ...x, [k]: v }));

  async function salvar() {
    if (!f.num || !f.parte_autora) { setErro("Informe o nº do processo e a parte autora."); return; }
    setLoading(true); setErro("");
    try {
      await ProcessoService.criar({ ...f, advogado_id: perfil?.id, status: "Ativo", distribuicao: f.distribuicao || null, proximo_prazo: f.proximo_prazo || null });
      setOk(true);
      setTimeout(() => { setOk(false); onSalvar(); }, 1500);
    } catch (err) {
      setErro(err.message || "Erro ao salvar processo.");
    } finally { setLoading(false); }
  }

  if (ok) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 280, gap: 14 }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#eaf3de", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, color: "#3b6d11" }}>✓</div>
      <div style={{ fontSize: 17, fontWeight: 600 }}>Processo cadastrado com sucesso!</div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", borderBottom: "0.5px solid var(--border)", marginBottom: 18 }}>
        {["Digitação manual", "Enviar PDF (em breve)", "Importar Excel (em breve)"].map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: "9px 16px", fontSize: 13, cursor: i > 0 ? "not-allowed" : "pointer", background: "none", border: "none", borderBottom: tab === i ? "2px solid #1a3a6b" : "2px solid transparent", color: tab === i ? "#1a3a6b" : "var(--text-secondary)", fontFamily: "inherit", fontWeight: tab === i ? 600 : 400, opacity: i > 0 ? 0.5 : 1 }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ background: "var(--surface-2)", border: "0.5px solid var(--border)", borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 18 }}>Dados do processo</div>
        {erro && <div style={{ background: "#fcebeb", border: "0.5px solid #f09595", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#a32d2d", marginBottom: 14 }}>{erro}</div>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Input label="Número do processo (CNJ)" value={f.num} onChange={e => s("num", e.target.value)} placeholder="0000000-00.0000.0.00.0000" required full />
          <Select label="Área jurídica" value={f.area} onChange={e => s("area", e.target.value)} options={["Trabalhista", "Cível", "Tributário", "Criminal", "Previdenciário", "Família", "Empresarial"]} />
          <Select label="Fase processual" value={f.fase} onChange={e => s("fase", e.target.value)} options={["Conhecimento", "Instrução", "Sentença", "Recurso", "Execução"]} />
          <Input label="Parte autora" value={f.parte_autora} onChange={e => s("parte_autora", e.target.value)} placeholder="Nome completo ou razão social" required />
          <Input label="Parte ré" value={f.parte_re} onChange={e => s("parte_re", e.target.value)} placeholder="Nome completo ou razão social" />
          <Input label="Vara / Tribunal" value={f.vara} onChange={e => s("vara", e.target.value)} placeholder="Ex: 5ª Vara do Trabalho de Natal/RN" full />
          <Input label="Data de distribuição" value={f.distribuicao} onChange={e => s("distribuicao", e.target.value)} type="date" />
          <Input label="Próximo prazo processual" value={f.proximo_prazo} onChange={e => s("proximo_prazo", e.target.value)} type="date" />
          <Input label="Tipo de ato" value={f.tipo_ato} onChange={e => s("tipo_ato", e.target.value)} placeholder="Ex: Audiência, Contestação…" />
          <Input label="Valor da causa" value={f.valor} onChange={e => s("valor", e.target.value)} placeholder="R$ 0,00" />
          <Input label="E-mail para alertas" value={f.email_alerta} onChange={e => s("email_alerta", e.target.value)} type="email" placeholder="advogado@escritorio.com.br" full />
          <div style={{ display: "flex", flexDirection: "column", gap: 5, gridColumn: "1/-1" }}>
            <label style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>Objeto e pedidos</label>
            <textarea value={f.pedido} onChange={e => s("pedido", e.target.value)} placeholder="Descreva resumidamente o objeto e os pedidos…" style={{ padding: "8px 10px", border: "0.5px solid var(--border-strong)", borderRadius: 7, background: "var(--surface-1)", color: "var(--text-primary)", fontSize: 13, fontFamily: "inherit", minHeight: 80, resize: "vertical", width: "100%" }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 18 }}>
          <Btn onClick={onCancelar}>Cancelar</Btn>
          <Btn primary disabled={loading} onClick={salvar}>{loading ? "Salvando…" : "✓ Cadastrar processo"}</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── ALERTAS ─────────────────────────────────────────────────────────────────
function Alertas({ processos }) {
  const com = processos.filter(p => p.proximo_prazo).sort((a, b) => new Date(a.proximo_prazo) - new Date(b.proximo_prazo));
  const urg = com.filter(p => diasRestantes(p.proximo_prazo) <= 3).length;
  const at = com.filter(p => { const d = diasRestantes(p.proximo_prazo); return d > 3 && d <= 7; }).length;
  const ok = com.filter(p => diasRestantes(p.proximo_prazo) > 7).length;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
        <div style={{ background: "var(--surface-2)", border: "0.5px solid var(--border)", borderRadius: 12, padding: 16, display: "flex", alignItems: "center", gap: 20, justifyContent: "center" }}>
          {[[urg, "Urgentes (≤3d)", "#e24b4a"], [at, "Atenção (≤7d)", "#ba7517"], [ok, "No prazo", "#3b6d11"]].map(([v, l, c]) => (
            <div key={l} style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: c }}>{v}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "var(--surface-2)", border: "0.5px solid var(--border)", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Alertas automáticos por e-mail</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.7 }}>Os e-mails de alerta são enviados automaticamente pelo sistema <strong>7 dias</strong> e <strong>3 dias</strong> antes do prazo, para o e-mail cadastrado em cada processo. Configure a Edge Function no Supabase para ativar.</div>
        </div>
      </div>
      <div style={{ background: "var(--surface-2)", border: "0.5px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr>{["Processo", "Evento", "Data do prazo", "Prazo restante", "E-mail alerta", "Status"].map(h => <th key={h} style={{ textAlign: "left", fontSize: 10, color: "var(--text-muted)", padding: "8px 12px", borderBottom: "0.5px solid var(--border)", textTransform: "uppercase", letterSpacing: ".04em", whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
          <tbody>
            {com.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>Nenhum processo com prazo cadastrado</td></tr>}
            {com.map(p => {
              const d = diasRestantes(p.proximo_prazo);
              return (
                <tr key={p.id}>
                  <td style={{ padding: "10px 12px", borderBottom: "0.5px solid var(--border)", fontFamily: "monospace", fontSize: 11 }}>{p.num.slice(0, 22)}…</td>
                  <td style={{ padding: "10px 12px", borderBottom: "0.5px solid var(--border)", fontSize: 12 }}>{p.tipo_ato || "—"}</td>
                  <td style={{ padding: "10px 12px", borderBottom: "0.5px solid var(--border)", fontSize: 12 }}>{fmtData(p.proximo_prazo)}</td>
                  <td style={{ padding: "10px 12px", borderBottom: "0.5px solid var(--border)" }}><Prazo d={d} /></td>
                  <td style={{ padding: "10px 12px", borderBottom: "0.5px solid var(--border)", fontSize: 11, color: "var(--text-muted)" }}>{p.email_alerta || "—"}</td>
                  <td style={{ padding: "10px 12px", borderBottom: "0.5px solid var(--border)" }}><Badge s={p.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── PERFIL ───────────────────────────────────────────────────────────────────
function Perfil({ perfil, onAtualizar }) {
  const [f, setF] = useState({ nome: perfil?.nome || "", email: perfil?.email || "", telefone: perfil?.telefone || "", oab: perfil?.oab || "", escritorio: perfil?.escritorio || "", especialidade: perfil?.especialidade || "Trabalhista", endereco: perfil?.endereco || "" });
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [erro, setErro] = useState("");
  const s = (k, v) => setF(x => ({ ...x, [k]: v }));

  async function salvar() {
    setLoading(true); setErro("");
    try {
      await AuthService.atualizarPerfil(perfil.id, f);
      setOk(true); setTimeout(() => setOk(false), 2000);
      onAtualizar({ ...perfil, ...f });
    } catch (err) {
      setErro("Erro ao salvar perfil.");
    } finally { setLoading(false); }
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div style={{ background: "var(--surface-2)", border: "0.5px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ height: 80, background: "linear-gradient(135deg,#1a3a6b,#2d5fa6)" }} />
        <div style={{ padding: "0 22px 22px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 14, marginBottom: 16 }}>
            <Av nome={f.nome} size={64} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{f.nome}</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{f.oab ? `OAB ${f.oab} · ` : ""}<Badge s={perfil?.role} /></div>
            </div>
          </div>
          <div style={{ height: 0.5, background: "var(--border)", margin: "0 0 16px" }} />
          {erro && <div style={{ background: "#fcebeb", border: "0.5px solid #f09595", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#a32d2d", marginBottom: 14 }}>{erro}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Input label="Nome completo" value={f.nome} onChange={e => s("nome", e.target.value)} />
            <Input label="E-mail" value={f.email} onChange={e => s("email", e.target.value)} type="email" />
            <Input label="Telefone / WhatsApp" value={f.telefone} onChange={e => s("telefone", e.target.value)} />
            <Input label="Número OAB" value={f.oab} onChange={e => s("oab", e.target.value)} />
            <Input label="Escritório / Empresa" value={f.escritorio} onChange={e => s("escritorio", e.target.value)} />
            <Select label="Especialidade" value={f.especialidade} onChange={e => s("especialidade", e.target.value)} options={["Trabalhista", "Cível", "Tributário", "Criminal", "Previdenciário", "Família"]} />
            <Input label="Endereço do escritório" value={f.endereco} onChange={e => s("endereco", e.target.value)} full />
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 18 }}>
            <Btn primary disabled={loading} onClick={salvar}>{ok ? "✓ Salvo!" : loading ? "Salvando…" : "💾 Salvar perfil"}</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────
function Admin({ processos }) {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [nu, setNu] = useState({ nome: "", email: "", senha: "", perfil: "advogado" });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const sn = (k, v) => setNu(x => ({ ...x, [k]: v }));

  useEffect(() => {
    AdminService.listarUsuarios().then(setUsuarios).finally(() => setLoading(false));
  }, []);

  async function alterarRole(id, role) {
    await AdminService.atualizarRole(id, role);
    setUsuarios(us => us.map(u => u.id === id ? { ...u, role } : u));
  }

  async function toggleAtivo(id, ativo) {
    await AdminService.ativarDesativar(id, !ativo);
    setUsuarios(us => us.map(u => u.id === id ? { ...u, ativo: !ativo } : u));
  }

  async function criar() {
    if (!nu.nome || !nu.email || !nu.senha) { setErro("Preencha todos os campos."); return; }
    setSalvando(true); setErro("");
    try {
      await AdminService.criarUsuario({ nome: nu.nome, email: nu.email, senha: nu.senha, perfil: nu.perfil });
      const us = await AdminService.listarUsuarios();
      setUsuarios(us);
      setModal(false);
      setNu({ nome: "", email: "", senha: "", perfil: "advogado" });
    } catch (err) {
      setErro(err.message || "Erro ao criar usuário.");
    } finally { setSalvando(false); }
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 18 }}>
        {[["Usuários ativos", usuarios.filter(u => u.ativo).length, "inherit"], ["Processos no sistema", processos.length, "#1a3a6b"], ["Admins", usuarios.filter(u => u.role === "admin").length, "#7c3aed"]].map(([l, v, c]) => (
          <div key={l} style={{ background: "var(--surface-2)", border: "0.5px solid var(--border)", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>{l}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: c }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--surface-2)", border: "0.5px solid var(--border)", borderRadius: 12, marginBottom: 14, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "0.5px solid var(--border)" }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Gestão de usuários</span>
          <Btn primary sm onClick={() => setModal(true)}>＋ Criar usuário</Btn>
        </div>
        {loading ? <Spinner /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr>{["Usuário", "E-mail", "Perfil", "Status", "Ações"].map(h => <th key={h} style={{ textAlign: "left", fontSize: 10, color: "var(--text-muted)", padding: "8px 12px", borderBottom: "0.5px solid var(--border)", textTransform: "uppercase", letterSpacing: ".04em", whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id}>
                    <td style={{ padding: "10px 12px", borderBottom: "0.5px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Av nome={u.nome} size={28} />
                        <span style={{ fontWeight: 500 }}>{u.nome}</span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 12px", borderBottom: "0.5px solid var(--border)", fontSize: 12, color: "var(--text-secondary)" }}>{u.email}</td>
                    <td style={{ padding: "10px 12px", borderBottom: "0.5px solid var(--border)" }}>
                      <select value={u.role} onChange={e => alterarRole(u.id, e.target.value)} style={{ padding: "4px 8px", border: "0.5px solid var(--border-strong)", borderRadius: 6, background: "var(--surface-1)", color: "var(--text-primary)", fontSize: 12, fontFamily: "inherit" }}>
                        {["admin", "advogado", "estagiario", "leitura"].map(r => <option key={r}>{r}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "10px 12px", borderBottom: "0.5px solid var(--border)" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 20, fontSize: 11, background: u.ativo ? "#eaf3de" : "var(--surface-1)", color: u.ativo ? "#3b6d11" : "var(--text-muted)", border: `0.5px solid ${u.ativo ? "#c0dd97" : "var(--border)"}` }}>
                        {u.ativo ? "● Ativo" : "○ Inativo"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", borderBottom: "0.5px solid var(--border)" }}>
                      <Btn sm danger={u.ativo} onClick={() => toggleAtivo(u.id, u.ativo)}>{u.ativo ? "Desativar" : "Ativar"}</Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Criar novo usuário"
        footer={<><Btn onClick={() => setModal(false)}>Cancelar</Btn><Btn primary disabled={salvando} onClick={criar}>{salvando ? "Criando…" : "✓ Criar usuário"}</Btn></>}>
        {erro && <div style={{ background: "#fcebeb", border: "0.5px solid #f09595", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#a32d2d", marginBottom: 14 }}>{erro}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input label="Nome completo" value={nu.nome} onChange={e => sn("nome", e.target.value)} placeholder="Nome do usuário" />
          <Input label="E-mail" value={nu.email} onChange={e => sn("email", e.target.value)} type="email" placeholder="email@escritorio.com.br" />
          <Input label="Senha inicial" value={nu.senha} onChange={e => sn("senha", e.target.value)} type="password" placeholder="Mínimo 6 caracteres" />
          <Select label="Perfil de acesso" value={nu.perfil} onChange={e => sn("perfil", e.target.value)} options={["admin", "advogado", "estagiario", "leitura"]} />
        </div>
      </Modal>
    </div>
  );
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function App() {
  const [sessao, setSessao] = useState(undefined); // undefined = carregando
  const [perfil, setPerfil] = useState(null);
  const [tela, setTela] = useState("dashboard");
  const [processoAtivo, setProcessoAtivo] = useState(null);
  const [processos, setProcessos] = useState([]);
  const [loadingPs, setLoadingPs] = useState(false);
  const [erroPs, setErroPs] = useState("");
  const [modalAlertas, setModalAlertas] = useState(false);

  // Autenticação
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSessao(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSessao(s));
    return () => subscription.unsubscribe();
  }, []);

  // Carregar perfil
  useEffect(() => {
    if (!sessao) { setPerfil(null); return; }
    AuthService.getPerfil().then(setPerfil).catch(() => setPerfil(null));
  }, [sessao]);

  // Carregar processos
  const carregarProcessos = useCallback(async () => {
    if (!sessao) return;
    setLoadingPs(true); setErroPs("");
    try {
      const data = await ProcessoService.listar();
      setProcessos(data || []);
    } catch (err) {
      setErroPs("Erro ao carregar processos.");
    } finally { setLoadingPs(false); }
  }, [sessao]);

  useEffect(() => { carregarProcessos(); }, [carregarProcessos]);

  async function excluirProcesso(id) {
    if (!confirm("Excluir este processo? Essa ação não pode ser desfeita.")) return;
    await ProcessoService.excluir(id);
    setProcessos(ps => ps.filter(p => p.id !== id));
  }

  const urgCount = processos.filter(p => { const d = diasRestantes(p.proximo_prazo); return d !== null && d <= 3; }).length;

  const NAV = [
    { id: "dashboard", ic: "📊", lb: "Dashboard", sec: "Principal" },
    { id: "processos", ic: "📁", lb: "Processos", badge: processos.filter(p => p.status !== "Encerrado").length },
    { id: "alertas", ic: "🔔", lb: "Alertas", badge: urgCount || null },
    { id: "novo", ic: "＋", lb: "Novo processo", sec: "Cadastro", hide: perfil?.role === "estagiario" || perfil?.role === "leitura" },
    { id: "perfil", ic: "👤", lb: "Meu perfil", sec: "Sistema" },
    { id: "admin", ic: "🛡", lb: "Administração", hide: perfil?.role !== "admin" },
  ];

  const TITULOS = { dashboard: "Dashboard", processos: "Processos", alertas: "Alertas de prazo", novo: "Novo processo", perfil: "Meu perfil", admin: "Administração", detalhe: "Detalhe do processo" };

  // Carregando sessão
  if (sessao === undefined) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-0)" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Spinner />
    </div>
  );

  // Não autenticado
  if (!sessao) return <Login onLogin={() => supabase.auth.getSession().then(({ data: { session } }) => setSessao(session))} />;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "var(--font-sans)", background: "var(--surface-0)", color: "var(--text-primary)", fontSize: 14 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* SIDEBAR */}
      <div style={{ width: 224, minWidth: 224, background: "var(--surface-2)", borderRight: "0.5px solid var(--border)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "18px 14px", borderBottom: "0.5px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "#1a3a6b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚖️</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>JurisTrack</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Gestão Jurídica</div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: "10px 8px", display: "flex", flexDirection: "column", gap: 1, overflowY: "auto" }}>
          {NAV.filter(n => !n.hide).map((item) => (
            <div key={item.id}>
              {item.sec && <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", letterSpacing: ".06em", textTransform: "uppercase", padding: "10px 8px 4px" }}>{item.sec}</div>}
              <div onClick={() => setTela(item.id)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 7, cursor: "pointer", background: tela === item.id ? "#1a3a6b" : "transparent", color: tela === item.id ? "#fff" : "var(--text-secondary)", fontSize: 13, fontWeight: tela === item.id ? 600 : 400 }}>
                <span style={{ fontSize: 15 }}>{item.ic}</span>
                {item.lb}
                {item.badge > 0 && <span style={{ marginLeft: "auto", background: "#e24b4a", color: "#fff", fontSize: 10, padding: "1px 6px", borderRadius: 10, fontWeight: 700 }}>{item.badge}</span>}
              </div>
            </div>
          ))}
        </nav>
        <div style={{ padding: "10px 8px", borderTop: "0.5px solid var(--border)" }}>
          <div onClick={() => setTela("perfil")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 7, cursor: "pointer" }}>
            <Av nome={perfil?.nome || "?"} size={30} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{perfil?.nome || sessao.user.email}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{perfil?.role || "usuário"}</div>
            </div>
          </div>
          <div onClick={() => AuthService.logout()} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 7, cursor: "pointer", color: "#e24b4a", fontSize: 12, marginTop: 2 }}>
            <span>🚪</span> Sair
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ height: 52, borderBottom: "0.5px solid var(--border)", display: "flex", alignItems: "center", padding: "0 20px", gap: 10, background: "var(--surface-2)", flexShrink: 0 }}>
          <div style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>{TITULOS[tela] || tela}</div>
          <button onClick={() => setModalAlertas(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 7, border: "0.5px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--text-primary)", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            🔔 {urgCount > 0 && <span style={{ background: "#e24b4a", color: "#fff", borderRadius: 10, fontSize: 10, padding: "1px 5px", fontWeight: 700 }}>{urgCount}</span>}
          </button>
          {(perfil?.role === "admin" || perfil?.role === "advogado") &&
            <Btn primary sm onClick={() => setTela("novo")}>＋ Novo processo</Btn>}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {erroPs && <Erro msg={erroPs} onRetry={carregarProcessos} />}
          {loadingPs && tela === "dashboard" && <Spinner />}
          {!loadingPs && tela === "dashboard" && <Dashboard processos={processos} onNav={setTela} onAbrir={id => { setProcessoAtivo(id); setTela("detalhe"); }} />}
          {tela === "processos" && <ListaProcessos processos={processos} onAbrir={id => { setProcessoAtivo(id); setTela("detalhe"); }} onNovo={() => setTela("novo")} onExcluir={excluirProcesso} perfil={perfil} />}
          {tela === "detalhe" && processoAtivo && <DetalheProcesso processoId={processoAtivo} onVoltar={() => setTela("processos")} perfil={perfil} />}
          {tela === "novo" && <FormProcesso onSalvar={() => { carregarProcessos(); setTela("processos"); }} onCancelar={() => setTela("processos")} perfil={perfil} />}
          {tela === "alertas" && <Alertas processos={processos} />}
          {tela === "perfil" && perfil && <Perfil perfil={perfil} onAtualizar={setPerfil} />}
          {tela === "admin" && perfil?.role === "admin" && <Admin processos={processos} />}
        </div>
      </div>

      {/* MODAL ALERTAS */}
      <Modal open={modalAlertas} onClose={() => setModalAlertas(false)} title="🔔 Alertas de prazo"
        footer={<><Btn onClick={() => setModalAlertas(false)}>Fechar</Btn><Btn primary onClick={() => { setModalAlertas(false); setTela("alertas"); }}>Ver todos</Btn></>}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {processos.filter(p => { const d = diasRestantes(p.proximo_prazo); return d !== null && d <= 7; })
            .sort((a, b) => diasRestantes(a.proximo_prazo) - diasRestantes(b.proximo_prazo))
            .map(p => {
              const d = diasRestantes(p.proximo_prazo);
              return (
                <div key={p.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 8, border: `0.5px solid ${d <= 3 ? "#f09595" : "#fac775"}`, background: d <= 3 ? "#fcebeb" : "#faeeda" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: d <= 3 ? "#e24b4a" : "#ba7517", marginTop: 4, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 700 }}>{p.num}</div>
                    <div style={{ fontSize: 12, color: "#555" }}>{p.tipo_ato} · {d} dia{d !== 1 ? "s" : ""} — {fmtData(p.proximo_prazo)}</div>
                  </div>
                </div>
              );
            })}
          {processos.filter(p => { const d = diasRestantes(p.proximo_prazo); return d !== null && d <= 7; }).length === 0 &&
            <div style={{ textAlign: "center", padding: 20, color: "var(--text-muted)" }}>✅ Nenhum prazo urgente no momento</div>}
        </div>
      </Modal>
    </div>
  );
}
