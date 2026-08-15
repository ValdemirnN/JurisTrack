import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient' // ajuste o caminho

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard') // ou a rota principal do seu app
      } else {
        navigate('/login')
      }
    })
  }, [])

  return <p>Verificando sua conta...</p>
}