import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uarbbfecoxiwtbbidxfr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhcmJiZmVjb3hpd3RiYmlkeGZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMDc5NzUsImV4cCI6MjA4NzY4Mzk3NX0.VvQ04xLqYwF-UJPAHzTmvnnNy--bKGrm_DgHk2PXeX0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});

export default supabase;
