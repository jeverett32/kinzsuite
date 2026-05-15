# Audit: Partner assumptions and hardcoded partner identifiers

This audit lists occurrences of the literal string `partner`, hardcoded UUIDs, and references to `auth.users` that may imply a 2-user assumption. Each entry is `file:line` with a one-line note on what likely needs to change.

- src/lib/quests.ts:20 — Task text mentions "partner"; make task descriptions generic or use group/member wording.
- src/app/manifest.ts:7 — App description contains "partner"; update marketing copy to use "group" or "members".
- src/components/ui/PartnerToggle.tsx:6 — Component named PartnerToggle and props; replace with MemberPillStrip and support N members.
- src/components/ui/PartnerToggle.tsx:12 — prop "partnerName" etc; rename to memberName / selectedMember.
- src/app/(app)/pets/page.tsx:17 — select partner via profiles.find(p => p.id !== userId); replace with selected member or active_group members lookup.
- src/app/layout.tsx:37 — description contains "partner"; update copy.
- src/components/views/ChatView.tsx:79 — deriving partner with find(p => p.id !== userId); assumes single other member — change to selected member or group chat semantics.
- src/components/views/ChatView.tsx:80 — default partner name; use member/cohort naming.
- src/components/views/ChatView.tsx:276 — using partner avatar; switch to member data for messages.
- src/components/views/ChatView.tsx:289 — display partner name uppercased; replace with member name logic.
- src/components/views/ChatView.tsx:340 — partnerName passed to child; update prop names.
- src/components/views/ChatView.tsx:543 — partnerName prop typed; update types to support multiple members.
- src/components/views/ChatView.tsx:548 — partnerName type declaration;
- src/components/views/ChatView.tsx:622 — placeholder "Message ${partnerName}…"; change to "Message" or include member identity where appropriate.
- src/components/views/PetsView.tsx:18 — prop partner: Profile | null; replace with selectedMember or viewedMember.
- src/components/views/PetsView.tsx:31 — useState for side 'me'|'partner'; replace with selectedMemberId state and support arbitrary member list.
- src/components/views/PetsView.tsx:59 — partnerName default; adjust.
- src/components/views/PetsView.tsx:104 — partnerName passed to child; update.
- src/components/views/TodayView.tsx:50 — side state 'me'|'partner' — needs generalization.
- src/components/views/TodayView.tsx:126 — partner = profiles.find((p) => p.id !== userId) — assumes exactly one other profile; use selected member concept.
- src/components/views/TodayView.tsx:128 — partnerName default; update.
- src/components/views/TodayView.tsx:130-131 — viewedUserId/viewedProfile logic depends on partner being unique; change to selectedMemberId/viewedProfile.
- src/components/views/TodayView.tsx:155 — comment referencing partner's tasks; update behavior and wording.
- src/components/views/TodayView.tsx:201 — partnerName used in child props; update accordingly.
- src/components/views/TodayView.tsx:204 — partnerTone prop usage.
- src/components/views/TodayView.tsx:338 — text "you can't check off {partnerName}'s tasks — only they can" — update messaging for multiple members.

Notes:
- No hardcoded UUIDs were found in the src/ tree by a UUID regex search.
- The majority of hits are UI/UX and rely on a single "partner" derived by "profiles.find(p => p.id !== userId)" pattern. Those should be refactored to use an active group and a selected member within that group.

