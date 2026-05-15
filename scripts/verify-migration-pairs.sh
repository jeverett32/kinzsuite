#!/usr/bin/env bash
set -euo pipefail

MIG_DIR="supabase/migrations"
ROLLBACK_DIR="supabase/rollbacks"
# Files that don't follow *_up/*_down pairing (forward-only migrations).
ALLOWLIST=(
"0001_init.sql" "0002_storage.sql" "0003_two_user_limit.sql" "0004_per_user_tasks.sql"
"0005_profile_accent_avatar.sql" "0006_wheel_quests_and_task_rls.sql" "0007_wheel_quests_no_insert_delete.sql"
"0008_date_wheel_shared_pick.sql" "0009_chat_last_read.sql" "0010_push_subscriptions.sql"
"0011_pet_gender.sql" "0012_message_reactions.sql" "20260515033757_local_timezone.sql"
"20260515202548_0017a_chat_last_read_pk_and_not_null.sql"
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
  echo "Forward migrations must not use *_up.sql (rename to drop _up): $file"
    missing=1
    continue
  fi

  if [[ "$file" =~ _down\.sql$ ]]; then
    echo "Down migrations belong in $ROLLBACK_DIR: $file"
    missing=1
    continue
  fi

  down="${ROLLBACK_DIR}/${file%.sql}_down.sql"
  if [ ! -f "$down" ]; then
    echo "Missing rollback script for $file -> $(basename "$down")"
    missing=1
  fi
done

for path in "$ROLLBACK_DIR"/*.sql; do
  file=$(basename "$path")
  if [[ ! "$file" =~ _down\.sql$ ]]; then
    echo "Rollback files must end with _down.sql: $file"
    missing=1
    continue
  fi
  up_name="${file/_down.sql/.sql}"
  if [ ! -f "$MIG_DIR/$up_name" ]; then
    echo "Missing forward migration for rollback $file -> $up_name"
    missing=1
  fi
done

if [ "$missing" -ne 0 ]; then
  echo "Migration pair verification failed."
  exit 1
fi

echo "All migration pairs OK."
