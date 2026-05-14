"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, X, Upload } from "lucide-react";
import { PolaroidCard } from "@/components/ui/PolaroidCard";
import { PartnerToggle } from "@/components/ui/PartnerToggle";
import { ChunkyButton } from "@/components/ui/ChunkyButton";
import { PetPortrait } from "@/components/ui/PetPortrait";
import { createClient } from "@/lib/supabase/client";
import { PALETTE, PET_TYPES, shade } from "@/lib/utils";
import type { Pet, Profile } from "@/lib/supabase/types";

type Props = {
  initialPets: Pet[];
  userId: string;
  me: Profile | null;
  partner: Profile | null;
};

export function PetsView({ initialPets, userId, me, partner }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [pets, setPets] = useState<Pet[]>(initialPets);
  const [side, setSide] = useState<"me" | "partner">("me");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel("pets")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pets" },
        (payload) => {
          setPets((cur) => {
            if (payload.eventType === "INSERT") return [...cur, payload.new as Pet];
            if (payload.eventType === "DELETE")
              return cur.filter((p) => p.id !== (payload.old as Pet).id);
            return cur.map((p) =>
              p.id === (payload.new as Pet).id ? (payload.new as Pet) : p,
            );
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const myName = me?.display_name || "You";
  const partnerName = partner?.display_name || "Partner";

  const visiblePets =
    side === "me"
      ? pets.filter((p) => p.owner_id === userId)
      : pets.filter((p) => p.owner_id !== userId);

  return (
    <div className="flex flex-1 flex-col pb-6">
      <div className="px-4 pb-3 pt-2">
        <div
          className="font-hand text-[44px] leading-none text-white"
          style={{ textShadow: `0 3px 0 ${PALETTE.ink}, 0 0 12px rgba(0,0,0,0.15)` }}
        >
          Hey, {myName}!
        </div>
      </div>

      <div className="px-4 pb-3.5">
        <PartnerToggle
          value={side}
          onChange={setSide}
          meName={myName}
          partnerName={partnerName}
          meTone={me?.accent_color ?? "sky"}
          partnerTone={partner?.accent_color ?? "blush"}
        />
      </div>

      <div className="relative flex flex-1 items-center">
        <div
          className="kz-hscroll flex w-full items-center gap-4 overflow-x-auto px-4 pb-6 pt-1.5"
          style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
        >
          {visiblePets.length === 0 && (
            <div
              className="kz-sticker grid place-items-center rounded-3xl px-6 py-12 text-center"
              style={{ ["--ink" as any]: PALETTE.ink, minWidth: 260 }}
            >
              <div className="font-display text-lg" style={{ color: PALETTE.ink }}>
                NO PETS YET
              </div>
              <div className="mt-1 text-sm opacity-70" style={{ color: PALETTE.ink }}>
                Adopt your first friend →
              </div>
            </div>
          )}

          {visiblePets.map((p) => (
            <div key={p.id} style={{ scrollSnapAlign: "center" }}>
              <PolaroidCard
                pet={p}
                active={p.id === selectedId}
                onClick={() => setSelectedId(p.id)}
              />
            </div>
          ))}

          {side === "me" && (
            <button
              onClick={() => setShowNew(true)}
              className="kz-sticker flex flex-col items-center justify-center gap-3.5"
              style={{
                ["--ink" as any]: PALETTE.ink,
                width: 280,
                minHeight: 380,
                borderRadius: 32,
                background: `repeating-linear-gradient(135deg, #fff 0 14px, ${PALETTE.sky}1F 14px 28px)`,
                color: PALETTE.ink,
                flexShrink: 0,
              }}
            >
              <div
                className="grid place-items-center"
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 99,
                  background: `linear-gradient(180deg, ${PALETTE.sun}, ${shade(PALETTE.sun, -15)})`,
                  border: `2.5px solid ${PALETTE.ink}`,
                  boxShadow: `0 4px 0 ${PALETTE.ink}`,
                  color: PALETTE.ink,
                }}
              >
                <Plus size={40} strokeWidth={3} />
              </div>
              <div className="font-display text-lg tracking-wide" style={{ color: PALETTE.ink }}>
                ADOPT A FRIEND
              </div>
              <div className="text-[13px] font-semibold opacity-60" style={{ color: PALETTE.ink }}>
                tap to add a pet
              </div>
            </button>
          )}
        </div>
      </div>

      {showNew && (
        <NewPetModal
          userId={userId}
          onClose={() => setShowNew(false)}
        />
      )}
    </div>
  );
}

function NewPetModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const supabase = useMemo(() => createClient(), []);
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [species, setSpecies] = useState(PET_TYPES[0].type);
  const [artIndex, setArtIndex] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    let imageUrl: string | null = null;
    if (file) {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("pets")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) {
        setError(upErr.message);
        setSubmitting(false);
        return;
      }
      const { data } = supabase.storage.from("pets").getPublicUrl(path);
      imageUrl = data.publicUrl;
    }

    const { error: insErr } = await supabase.from("pets").insert({
      owner_id: userId,
      name: name.trim(),
      birthday: birthday || null,
      species: species || null,
      art_index: artIndex,
      image_url: imageUrl,
    });
    if (insErr) {
      setError(insErr.message);
      setSubmitting(false);
      return;
    }
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 px-4 pb-6 pt-12 sm:items-center"
      style={{ background: "rgba(19,41,75,0.4)" }}
    >
      <form
        onSubmit={onSubmit}
        className="kz-sticker relative w-full max-w-md rounded-[28px] p-5"
        style={{ ["--ink" as any]: PALETTE.ink }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full"
          style={{
            background: "#fff",
            border: `2px solid ${PALETTE.ink}`,
            boxShadow: `0 2px 0 ${PALETTE.ink}`,
            color: PALETTE.ink,
          }}
        >
          <X size={18} />
        </button>

        <div className="font-display text-[22px]" style={{ color: PALETTE.ink }}>
          ADOPT A FRIEND
        </div>
        <div className="font-hand text-lg" style={{ color: PALETTE.ink, opacity: 0.6 }}>
          give them a name and a face
        </div>

        <div className="mt-4 flex items-center gap-3">
          <PetPortrait
            art={artIndex}
            size={88}
            rounded={18}
            imageUrl={file ? URL.createObjectURL(file) : null}
          />
          <label
            className="kz-chunky font-display inline-flex flex-1 cursor-pointer items-center justify-center gap-2"
            style={{
              background: `linear-gradient(180deg, ${PALETTE.sky}, ${shade(PALETTE.sky, -15)})`,
              color: "#fff",
              fontSize: 13,
              padding: "10px 14px",
            }}
          >
            <Upload size={14} strokeWidth={2.4} />
            {file ? "Change photo" : "Upload photo (optional)"}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
          </label>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2">
          {PET_TYPES.map((pt, i) => (
            <button
              key={pt.type}
              type="button"
              onClick={() => {
                setArtIndex(i);
                setSpecies(pt.type);
              }}
              className="grid place-items-center"
              style={{
                aspectRatio: "1",
                borderRadius: 14,
                border: `2.5px solid ${PALETTE.ink}`,
                background: artIndex === i
                  ? `linear-gradient(180deg, ${pt.bColor}, ${pt.aColor})`
                  : "#fff",
                boxShadow: artIndex === i ? `0 3px 0 ${PALETTE.ink}` : `0 2px 0 ${PALETTE.ink}`,
                fontSize: 26,
                cursor: "pointer",
              }}
              aria-label={pt.type}
            >
              {pt.face}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-col gap-2">
          <Field label="Name">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Marshmellow"
              className="font-body w-full bg-transparent outline-none"
              style={{ color: PALETTE.ink }}
            />
          </Field>
          <Field label="Birthday">
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="font-body w-full bg-transparent outline-none"
              style={{ color: PALETTE.ink }}
            />
          </Field>
          <Field label="Species">
            <input
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              placeholder="Cloud Pup"
              className="font-body w-full bg-transparent outline-none"
              style={{ color: PALETTE.ink }}
            />
          </Field>
        </div>

        {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}

        <div className="mt-4">
          <ChunkyButton type="submit" color="grass" full disabled={submitting}>
            {submitting ? "Adopting…" : "Adopt"}
          </ChunkyButton>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div
        className="font-display mb-1 text-[11px] tracking-wider"
        style={{ color: PALETTE.ink, opacity: 0.6 }}
      >
        {label.toUpperCase()}
      </div>
      <div
        className="rounded-full bg-white px-3.5 py-2"
        style={{
          border: `2.5px solid ${PALETTE.ink}`,
          boxShadow: `0 3px 0 ${PALETTE.ink}`,
        }}
      >
        {children}
      </div>
    </label>
  );
}
