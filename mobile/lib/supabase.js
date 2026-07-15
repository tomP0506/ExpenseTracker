import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js/dist/index.cjs';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SUPABASE_URL = 'https://ytjbivcxqjeehvfkdzuq.supabase.co'
export const SUPABASE_ANON_KEY = 'sb_publishable_xiFbDyyDb35fa0Mh6ctRSA_DWqgbyuT'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});