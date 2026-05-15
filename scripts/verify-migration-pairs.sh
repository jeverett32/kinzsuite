#!/usr/bin/env bash
set -euo pipefail

MIG_DIR="supabase/migrations"
# allowlist (files that don't follow _up/_down convention)
ALLOWLIST=(
"0001_init.sql" "0002_storage.sql" "0003_two_user_limit.sql" "0004_per_user_tasks.sql"
"0005_profile_accent_avatar.sql" "0006_wheel_quests_and_task_rls.sql" "0007_wheel_quests_no_insert_delete.sql"
"0008_date_wheel_shared_pick.sql" "0009_chat_last_read.sql" "0010_push_subscriptions.sql"
"0011_pet_gender.sql" "0012_message_reactions.sql" "20260515033757_local_timezone.sql"
)

missing=0

is_allowed() {
  local f="$1"
  for a in "${ALLOWLIST[@]}"; do
    if [ "$f" = "$a" ]; then return 0; fi
  done
  return 1
}

shopt -s nullglob
for path in "$MIG_DIR"/*.sql; do
  file=$(basename "$path")
  if is_allowed "$file"; then
    continue
  fi

  if [[ "$file" =~ _up\.sql$ ]]; then
    down="${file/_up.sql/_down.sql}"
    if [ ! -f "$MIG_DIR/$down" ]; then
      echo "Missing down migration for $file -> $down"
      missing=1
    fi
  elif [[ "$file" =~ _down\.sql$ ]]; then
    up="${file/_down.sql/_up.sql}"
    if [ ! -f "$MIG_DIR/$up" ]; then
      echo "Missing up migration for $file -> $up"
      missing=1
    fi
  else
    # File doesn't follow pair naming; require it to be allowlisted
    echo "Unpaired migration filename (not following *_up/_down): $file"
    missing=1
  fi

done

if [ "$missing" -ne 0 ]; then
  echo "Migration pair verification failed."
  exit 1
fi

echo "All migration pairs OK."
