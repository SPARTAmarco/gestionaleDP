
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yqzzjxolpqqnghndnhfr.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxenpqeG9scHFxbmdobmRuaGZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMTgzNjksImV4cCI6MjA3ODg5NDM2OX0.-RevYIvzmMaTfRmcF26i3lP03VdWTYyZwZcGv8tLpVA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
