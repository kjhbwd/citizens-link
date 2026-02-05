import { createClient } from '@supabase/supabase-js'

// .env.local에 저장한 비밀 열쇠들을 가져옵니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 이 'supabase' 객체가 앞으로 모든 데이터 통신을 담당합니다.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)