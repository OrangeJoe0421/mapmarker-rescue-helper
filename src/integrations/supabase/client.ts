// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ljsmrxbbkbleugkpehcl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxqc21yeGJia2JsZXVna3BlaGNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczNDY4ODIsImV4cCI6MjA2MjkyMjg4Mn0.SLlOe2fNAsBX5DEXzc1RjF7gaGCdXa_YMqPWRfsA4_E";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);