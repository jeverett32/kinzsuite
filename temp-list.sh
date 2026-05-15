#!/bin/bash
ACCESS_TOKEN=$(grep SUPABASE_ACCESS_TOKEN .env.local | cut -d'=' -f2)
export SUPABASE_ACCESS_TOKEN=$ACCESS_TOKEN
npx supabase migration list
