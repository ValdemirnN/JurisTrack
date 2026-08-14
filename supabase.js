import { createClient } from '@supabase/supabase-js'

// ── Cliente Supabase ───────────────────────────────────────────────────────────
// Configure as variáveis no arquivo .env.local da raiz do projeto:
//   VITE_SUPABASE_URL=https://xxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY=eyJ...
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// ── AUTH ──────────────────────────────────────────────────────────────────────
export const AuthService = {
  async login(email, senha) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) throw error
    return data
  },

  async logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  },

  async getPerfil() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    if (error) throw error
    return data
  },

  async atualizarPerfil(id, campos) {
    const { data, error } = await supabase
      .from('profiles')
      .update(campos)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  onAuthChange(callback) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session)
    })
  },
}

// ── PROCESSOS ────────────────────────────────────────────────────────────────
export const ProcessoService = {
  async listar({ status, area } = {}) {
    let q = supabase
      .from('processos')
      .select('*, advogado:profiles(id, nome, email)')
      .order('proximo_prazo', { ascending: true, nullsFirst: false })

    if (status && status !== 'Todos') q = q.eq('status', status)
    if (area   && area   !== 'Todas') q = q.eq('area', area)

    const { data, error } = await q
    if (error) throw error
    return data
  },

  async buscar(query) {
    const { data, error } = await supabase
      .from('processos')
      .select('*, advogado:profiles(id, nome, email)')
      .or(
        `num.ilike.%${query}%,` +
        `parte_autora.ilike.%${query}%,` +
        `parte_re.ilike.%${query}%,` +
        `area.ilike.%${query}%`
      )
      .order('proximo_prazo', { ascending: true, nullsFirst: false })
    if (error) throw error
    return data
  },

  async buscarPorId(id) {
    const { data, error } = await supabase
      .from('processos')
      .select('*, advogado:profiles(id, nome, email), movimentacoes(*)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async criar(processo) {
    const { data, error } = await supabase
      .from('processos')
      .insert(processo)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async atualizar(id, campos) {
    const { data, error } = await supabase
      .from('processos')
      .update(campos)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async excluir(id) {
    const { error } = await supabase.from('processos').delete().eq('id', id)
    if (error) throw error
  },

  // Upload de PDF para o Storage
  async uploadPDF(processoId, file) {
    const path = `processos/${processoId}/${Date.now()}_${file.name}`
    const { data, error } = await supabase.storage
      .from('processos-docs')
      .upload(path, file, { cacheControl: '3600', upsert: false })
    if (error) throw error
    return data
  },
}

// ── MOVIMENTAÇÕES ─────────────────────────────────────────────────────────────
export const MovimentacaoService = {
  async listar(processoId) {
    const { data, error } = await supabase
      .from('movimentacoes')
      .select('*, usuario:profiles(nome)')
      .eq('processo_id', processoId)
      .order('data', { ascending: false })
    if (error) throw error
    return data
  },

  async criar(mov) {
    const { data, error } = await supabase
      .from('movimentacoes')
      .insert(mov)
      .select()
      .single()
    if (error) throw error
    return data
  },
}

// ── USUÁRIOS (Admin) ──────────────────────────────────────────────────────────
export const AdminService = {
  async listarUsuarios() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async criarUsuario({ nome, email, senha, perfil }) {
    // Cria o usuário via Supabase Admin API (requer service_role — use Edge Function em produção)
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: senha,
      user_metadata: { nome },
      email_confirm: true,
    })
    if (error) throw error

    // Atualiza o role no perfil
    await supabase
      .from('profiles')
      .update({ role: perfil, nome })
      .eq('id', data.user.id)

    return data.user
  },

  async atualizarRole(userId, role) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async ativarDesativar(userId, ativo) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ativo })
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  },
}

// ── ALERTAS LOG ───────────────────────────────────────────────────────────────
export const AlertaService = {
  async listar() {
    const { data, error } = await supabase
      .from('alertas_log')
      .select('*, processo:processos(num, tipo_ato)')
      .order('enviado_em', { ascending: false })
      .limit(50)
    if (error) throw error
    return data
  },
}
