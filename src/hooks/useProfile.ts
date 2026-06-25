'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface Profile {
  id: string
  consultor_id: string | null
  role: 'supervisora' | 'consultor'
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile(data)
      } else {
        setProfile({ id: user.id, consultor_id: null, role: 'supervisora' })
      }
      setLoading(false)
    }
    loadProfile()
  }, [])

  return { profile, loading, isSupervisora: profile?.role === 'supervisora' }
}