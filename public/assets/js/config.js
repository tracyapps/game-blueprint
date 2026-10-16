/*
  SETTINGS — the only file you need to edit to go live.

  Paste these from Supabase → Project Settings → API:
    supabaseUrl      "Project URL"
    supabaseAnonKey  the "anon" / "publishable" key (safe to be public;
                     the database rules in supabase/schema.sql protect the data)

  While either is blank, the site runs in PREVIEW MODE: no email, and
  answers are kept only in this browser. Good for clicking around.
*/
export const CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: '',

  siteName: 'Game Blueprint',
  // Shown on the sign-in page so people know who's reading their answers.
  ownerName: 'Tapps',
};

export const DEMO = !CONFIG.supabaseUrl || !CONFIG.supabaseAnonKey;
