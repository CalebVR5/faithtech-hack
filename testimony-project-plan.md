# Testimony sharing: brainstorm and one-day project plan

Planning draft • Revision 4 • October 24, 2026

## 1. Direction and confirmed boundaries

**Product promise:** Help someone tell their baptism story in their own words, prepare something they feel comfortable sharing, and choose who receives it.

The user has confirmed a one-day hackathon, three builders, React and shadcn as a suitable frontend, and an adult-focused experience with an under-18 guardian gate demonstrated. All three output directions are developed below so the team can make its implementation choice on the day. No output direction is approved or selected by this plan.

The essential mechanism is a shared story workflow with interchangeable output formats. Capture, source correction, translation, privacy choices, and consent should work the same way whether the result is a card, a captioned video, or a narrated reel. Narration can use the person's recording or an explicitly chosen standard synthetic voice.

**Current scope — revision 4:** Human language review is deferred to a later pilot-readiness step at the user's request. No bilingual reviewer, review simulation, or language-review export gate is required for the hackathon. Managed-API translations can be previewed and exported with fictional data, labeled as machine translations that have not been independently reviewed. Source correction, final asset approval, guardian permissions, and automated/technical quality checks remain in scope. This supersedes earlier revision notes referring to mandatory reviewed translations.

**Revision 2 decisions confirmed by the user:** Develop text-only, face-blurred video, and text-to-speech options. Provide a guided privacy choice with direct controls. Synthetic narration reads the approved story in its original language; English or another reviewed language may be used for captions. Make sharing media with a pastor or friends explicit through existing apps in the first version. Private review links are later scope. These extend the proposal without committing the one-day build to every renderer.

**Additional confirmed scope:** Target English, French, Latin American Spanish, and Brazilian Portuguese through existing managed language APIs. Make WhatsApp and Instagram prominent destinations, using direct user-initiated sharing where supported and basic save-and-post instructions elsewhere. Do not build a custom translation or speech model. API integration reduces custom maintenance but does not guarantee correct transcription, translation, pronunciation, or culturally appropriate wording.

**Personal voice preference:** Encourage a recording of the person's own voice, supported by an on-screen script of their approved words, before text-to-speech when this fits their privacy choices and ability. If they have chosen to conceal their voice or cannot record, offer synthetic narration directly without repeated persuasion. The story remains theirs in either case.

**Build and operating priorities confirmed:** Prioritize script-assisted personal recording and synthetic narration; prototype face blur only if time allows. A future real service would have a US-based operator serving the **United States, Peru, Brazil, Mexico, and Canada** as its initial target markets. The operator's legal entity, US state, and pilot rollout order remain unresolved. Naming target markets does not authorize a real-data launch in all five. The hackathon still uses fictional data and no production Baptize connection.

**Revision 3 market decisions:** Brazilian Portuguese and Latin American Spanish are confirmed. Canada makes Canadian French an appropriate proposed starting point for French speech evaluation; US English is the proposed English starting point. Those English/French voice choices remain implementation recommendations, not confirmed user preferences. Every language stays selectable in every market, without requiring country or location collection.

**What success means:** The person can say, “That sounds like me; I understand what will be shared; I chose this.” A small, faithful story shared with a friend is a successful outcome. Keeping it private is also a valid decision.

The provided project directory currently contains only an empty `Readme.md`. There is no existing implementation or stack configuration to preserve. The hackathon requirements in this plan come from the material pasted into the conversation. Attempts to retrieve the linked GitHub files failed; the linked sample stories and additional current-system details have not been inspected. Do not assume invented examples below are the official fixtures.

### Constraints adopted from the user's brief

- Test data only. Use fabricated stories and fabricated identities; do not collect real testimony or church records during the hackathon.
- No connection to baptize.org or its systems. A separate, clearly marked mock inbox represents the save/submission step.
- Nothing becomes public without the storyteller's permission. A minor's story cannot be shared without guardian permission.
- AI may assist transcription and translation, but may not invent experiences, Scripture, church information, or spiritual conclusions.
- Build on existing components and media tools. Credit dependencies, templates, source material, fonts, and any other reused work.
- Existing messaging platforms provide the relationship and sharing channels. App-originated messaging is outside the one-day scope; adding it later requires opt-in and working opt-out behavior.

## 2. Brainstorm: where the product can make a real difference

| Idea | Why it helps | One-day treatment |
|---|---|---|
| Three gentle questions | Removes the pressure to write a polished testimony | Core: optional prompts plus “tell it your way” |
| Voice first, text always available | Supports people who find typing difficult or feel more natural speaking | Core capture options; real microphone support depends on the technical spike |
| “Use these words” selection | Lets the author choose an excerpt instead of receiving an AI rewrite | Core review interaction |
| Story card | A tangible, readable output with little production effort | Fully specified output option A |
| Captioned original video | Retains expression, voice, and the baptism storyteller's presence | Fully specified output option B |
| Recorded voice over simple visuals | Keeps vocal personality without requiring the person to be on camera | Fully specified output option C |
| Synthetic narration over simple visuals | Lets someone create a spoken video without disclosing their face or recorded voice | Option C variant; original-language speech and optionally machine-translated captions |
| Read my approved story aloud | Preserves a person's own voice while reducing the pressure to improvise | Simple script reader with record, retry, and playback; recommended when compatible with privacy |
| Face-blurred footage | Lets the person retain footage while obscuring faces in the exported video | Option B variant; constrained scope and complete export review |
| Original plus translation | Extends reach without erasing the source language | English, French, Spanish, Portuguese through managed APIs and fictional test fixtures; human language review later |
| Share with one person first | Supports conversation and encouragement | Optional share-screen suggestion; no contact collection |
| “Keep identifying details out” path | Makes privacy choices understandable before recording | Core text-only path; never call it guaranteed anonymity |
| Ask a pastor or friend for feedback | Builds relationships and catches confusing or identifying details | Explicit share action now; private review links later |
| Baptize permission receipt | Makes what the person agreed to visible and reviewable | Core mock submission record |
| Church QR kit | Removes account setup and lets churches distribute a reusable link | Generic project QR only; no real church identifiers |
| Rejoice together | Encourages responses from real friends | Use replies in WhatsApp, text, or the platform they choose |

Do not add a public feed, followers, popularity ranking, streaks, “best testimony” scores, or engagement optimization. Those features create a different product and weaken the relationship-first principle. The app should help the person finish a task and return to their community.

An optional invitation belongs outside the quoted testimony. For example, a separate, editable message could say, “I'd be happy to talk about my baptism.” Never put that line into the person's story automatically or attach an unverified church invitation.

## 3. Shared user journey

### Entry: an invitation without pressure

The person opens a generic HTTPS link or QR code. The first screen explains the job in plain language: “Tell your story. Choose what to share.” For the hackathon, show a visible “Prototype — use a made-up story” notice.

Offer language selection using language names, not national flags. Distinguish the interface language from the language spoken in the story and the language requested for the output. A multilingual person may use different choices for each.

Ask “Are you 18 or older?” before accepting story content. Include “I'm not sure,” which follows the guardian-needed path. Do not collect a full date of birth for this prototype.

For under-18 or uncertain users, show a dedicated guardian-needed screen and disable recording, export, and submission until the simulated approval path is completed. Keep the simulation available only in an explicitly marked test scenario. It is not a production identity or guardianship verification method.

### Privacy choice before capture

Use an understandable choice such as “What would you like to keep out of your shared story?” Offer face, recorded voice, name, and surroundings/location, with “I'm not sure” and “Choose myself.” Do not ask the person to identify their country or explain their threat situation. Recommend formats based on those answers, with direct controls always available. These are preferences about the output, not a security assessment.

If the person wants both their appearance and voice concealed, recommend typed text leading to a card or original-language synthetic narration over a neutral background. If only their face needs obscuring and they want to keep footage, offer face blur with a clear explanation that their voice and surroundings remain. If surroundings must be omitted, replace the footage with a neutral background. No privacy profile may silently add identifying information to captions or filenames.

For ordinary capture, name is optional and can be a chosen display name. No email, phone number, church, or precise location is needed to prepare an output. Request microphone/camera access only after the person taps the corresponding capture action.

### Capture: a few prompts, with permission to skip

Use three prompts adapted from the supplied starter questions:

1. “What would you like to share about your life before you were baptized?”
2. “What led you to choose baptism?”
3. “What was that moment like, and what would you like someone else to know?”

Each is optional. Include “I'd rather tell it my own way.” Do not imply that the person must disclose trauma, a dramatic transformation, or certainty they do not feel. A short answer is enough.

For text, allow one answer at a time or a single free-text story. For voice, one short recording is the simplest implementation; the prompts can remain on screen. For video, use the same approach with a camera preview and a file-upload alternative. Multiple clips, interview branching, and timeline editing are later enhancements.

Suggested prototype bounds are 90 seconds of audio/video and 1,500 characters of text. These are implementation choices to validate, not known user needs. Stop recording clearly at the limit; do not silently discard content. Show an actionable explanation for oversized uploads.

### Review the source before making an output

Text becomes the canonical story after author review. Audio/video produces a draft transcript. Let the person replay the recording and correct words. Unclear speech stays marked for correction; the system must not guess names, places, or Scripture.

Keep the original media/transcript separate from the corrected version until the session is deleted. The reviewed source is the basis for every output. If a user edits a transcript in a way that no longer matches the audio, a card can use the edited text, but media captions must still match what is audible; offer re-recording for substantive changes.

### Choose a format and approve the exact result

The format picker presents available paths without pretending unimplemented paths work. For the hackathon, feature flags can expose whichever renderers the team completes.

Show the actual exported composition, including display name, full text, captions, crop, face treatment, narration choice, language label, and any footer. Let the author change the selection, remove identifying details, or return to capture. Privacy effects must be present in the exported media, not just an overlay in the preview player.

Final approval applies to a specific asset version. Editing text, switching languages, changing a crop, adding a name, or regenerating media invalidates that approval. A processing result must never automatically become a submitted or published result.

### Finish: personal sharing and organizational permission

Provide three clear intentions: “Ask a pastor or friend for feedback,” “Share my finished story,” and “Keep a copy.” Then offer “Share through another app,” “Download,” and “Copy message/text” as applicable. The person chooses the receiving app and recipient themselves; the app does not need to collect their contacts. Opening a share sheet is not evidence of delivery or a published post.

For feedback, suggest an editable accompanying message: “I made a draft of my baptism story. Could you check that it sounds like me and help me spot anything I should keep private? Please ask me before sharing it further.” This message is separate from the testimony and never inserted into its quoted words. For celebration, offer a shorter editable message such as “I'd like to share this part of my story with you.”

Review is optional for an adult's original-language output. A pastor or friend gives feedback; they do not gain editorial ownership or permission to publish. Sharing a draft is still disclosure: the storyteller approves the exact draft for that recipient, and a minor still requires guardian permission. The author may make changes afterward, creating a new version for final approval. The app cannot technically prevent forwarding of a downloaded file.

In the first version, feedback returns through the chosen messaging app or an in-person conversation. The product makes no claim to track recipient identity, delivery, comments, or review completion. If a share target cannot accept the file and message together, keep both available separately and explain the download-and-attach fallback.

**Later: private review links.** Offer a scoped link to one asset version, expiry, revocation, optional comments, and author-controlled changes. A forwarded bearer link is accessible to anyone who has it; recipient-restricted access requires an additional authentication mechanism. Do not label a secret URL as guaranteed private. Keep raw sources out of the review package by default, prevent preview crawlers from exposing story content, protect reviewer access, and require fresh approval for changed assets. Private links, comments, notifications, and recipient verification are outside the one-day baseline.

### Destination-specific sharing: WhatsApp and Instagram

After choosing feedback or finished-story sharing, show **WhatsApp**, **Instagram**, and **Download / another app**. Keep “Copy accompanying message” nearby. The person chooses the recipient or audience inside the destination app and performs the final send/post action. No social account connection or app-originated bulk messaging is required.

**WhatsApp:** Offer a native file share action with “Choose WhatsApp, then choose your pastor, friend, or group.” The web app cannot force WhatsApp to be an available share target. If the device cannot share the file, show a short fallback: save the media; open the desired WhatsApp conversation; attach the saved image/video; paste the optional message; review and send. Include “Can't find the file?” guidance appropriate to Photos/Gallery versus Files/Downloads. A click-to-chat URL is useful for text and known recipients, but is not a binary-media upload mechanism. Do not put sensitive story text into URLs or collect a pastor's phone number merely to enable sharing. [WhatsApp click-to-chat documentation](https://faq.whatsapp.com/5913398998672934).

**Instagram:** Offer “Prepare Instagram post” for a card and “Prepare Instagram reel” for video. Show the final approved media, a save button, copyable post text, and an optional native share action when supported. Always offer basic instructions: save the asset to the phone's media library; open Instagram's create flow; select a post or reel and the saved asset; paste the accompanying text; check the preview, cover, and audience; then publish when ready. Exact labels and file-saving steps must be verified on the team's current iPhone and Android apps before shipping instructions. A browser download is not necessarily automatically placed in Photos/Gallery.

Use a portrait PNG for a post and a vertical MP4 with captions for a reel. Keep captions away from interface overlays and test the actual in-app preview; don't rely on a universal fixed safe area. Do not append a real church, location, hashtags, or campaign call-to-action without the author's choice. A public account, username, tags, followers, and audience context can identify someone even when the media is blurred or synthetically narrated; the privacy guide should surface that at destination selection without claiming to audit account settings.

Direct publishing APIs are outside this prototype. Meta's documented Instagram API publishing paths target professional accounts and add permissions/account constraints, which do not fit a broad personal-account flow. Native share handoff and guided uploads remain the baseline. A share sheet's completion is not proof of publication, and the product should not report “Posted to Instagram.” [Meta's official Instagram API collection](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api).

Offer Baptize submission as a separate, unchecked choice after the personal output is ready. Clearly label it “Send to demo inbox” in the prototype. “Only for me” must never send the story to that inbox.

End with the completed artifact and an optional relational prompt: “Who would you like to share this moment with?” Do not ask for contacts or require another app interaction to finish.

## 4. Three complete output options

These paths share all prior steps. The implementation choice should reflect actual device/media results, not just how attractive a mockup looks. Estimates below are rough builder-hours for the renderer after the shared workflow exists; they exclude integration and QA and are not additive promises.

### Option A — story card and accompanying text

**Experience:** Speak or type, review the words, select a short passage, and receive a downloadable image plus the full approved text to copy.

**Output:** One portrait card, proposed at 1080 × 1350 pixels, with a short excerpt, optional display name, and an understated optional baptism label. This is a proposed design size, not a guarantee about every social platform. Start with one template. Add a 1080 × 1920 variant only after the first is solid.

**Selection policy:** The user selects a contiguous passage. AI may suggest a passage using source offsets, but must not rewrite it or join distant phrases into a new claim. Show surrounding context and label a shortened passage as an excerpt. If it does not fit, ask for a shorter selection or use the accompanying full text; do not shrink the font indefinitely or silently cut words.

**Technical path:** Reviewed text → selected source span → preview component → deterministic image renderer → PNG. The renderer should use the same content and layout rules as the preview. Choose a browser canvas/SVG pipeline with verified font rendering; keep an HTML preview and copy-text fallback if export fails. Test accented and non-Latin text before promising those languages.

**Privacy benefit:** No face or voice is required in the export. Story details can still identify someone. Optional photos are a later addition because they introduce metadata, bystander, cropping, and consent issues.

**Main risks:** An excerpt can change meaning even without changing words; long text can become unreadable; translation may overflow the card; image-only outputs need accompanying accessible text.

**Smallest complete version:** One card, original language, no photo, author-selected excerpt, downloadable PNG and copied text.

**Estimate:** Approximately 3–5 builder-hours for one template and export path.

### Option B — captioned original video

**Experience:** Record or upload one short video, correct the transcript and caption timing, choose whether to retain the whole clip or one continuous excerpt, and approve the resulting video.

**Output:** One MP4 using the person's footage, with readable burned-in captions and optional face blur. Keep original audio unless the person explicitly selects synthetic narration, which reads only their approved original-language text. Proposed initial output is a 720 × 1280 canvas with source footage fitted inside it. Preserve the frame with padding before offering automatic cropping; cropping can hide meaningful context or leave an unintended person visible.

**Editing policy:** No fabricated B-roll, synthetic baptism footage, voice cloning, emotional scoring, or automatic rearrangement. Use a continuous clip. No background music in the first implementation; that avoids licensing and editorial-tone decisions.

**Technical path:** Browser capture/upload → bounded private temporary file → media probe → audio transcription with segment times → corrected caption segments → FFmpeg render → preview → approved download. The render job uses fixed templates and validated parameters, never arbitrary model-generated commands.

**Captions:** Keep speech in the source language, whether it is the original recording or explicitly selected synthetic narration. Offer original-language captions or API-translated English/other-language captions. Label translated prototype outputs as machine-translated and not independently reviewed; human language review is later scope. Caption timing must follow the audio actually used in the export. Simultaneous bilingual captions are a later layout option because two languages can crowd a small screen.

**Face-blur variant:** After source review, obscure the relevant faces throughout the entire clip, including opening/closing frames, profile views, movement, and other people. Review the encoded output, poster image, and thumbnails. Provide a conservative fallback to neutral visuals when coverage cannot be established. A single missed frame can expose a face; automatic detection is assistance rather than proof that all faces have been covered. See the implementation scope below.

**Main risks:** Mobile recording codecs and orientation, upload size, weak connections, render latency, caption timing, faces and bystanders, and FFmpeg/font availability in the chosen host. No face blurring or voice disguise should be sold as sufficient protection.

**Smallest complete version:** One supplied fixture video, one caption style, original audio, corrected captions, one fixed layout, real MP4 export. Live recording can be added independently. A pre-rendered sample is a useful fallback only if visibly labeled; it does not count as a working renderer.

**Estimate:** Approximately 5–8 builder-hours after a successful encoding/hosting spike; wider uncertainty if no builder knows media processing.

### Option C — recorded or synthetic narration over simple visuals

**Experience:** Type or record a short story, review its words, and choose “My recorded voice,” “A synthetic voice,” or “No voice.” Receive a vertical video with a simple background and timed text. No camera performance is required. People who cannot or do not want to speak can start with typing and use synthetic narration without recording themselves.

**Recommended personal-voice route:** For people who are comfortable including their voice, lead with “Record in your own voice” and supporting copy such as “Your voice can make this feel more personal. You can read your story below and try again.” Show the approved original-language text in short readable blocks with adjustable text size, a simple record/stop control, retry, and playback. Add pause/resume only if it works reliably in the chosen capture pipeline; a short retake is the first-version fallback. Avoid a scrolling teleprompter engine, forced countdown, or automated speech coaching in the one-day scope.

The script is their approved text, not an AI rewrite, and contains no recording instructions that could accidentally be spoken as testimony. They can read it or speak naturally; if their new take differs materially, transcribe and review that take so captions and approval match the actual recording. Never force their spoken words to match a previous script in the exported captions. Keep “Use a synthetic voice” and “No voice” visible without an extra justification step. Respect a privacy choice to hide voice by recommending the appropriate alternative immediately.

**Output:** One MP4 using a static designed background or a few restrained text panels. Synthetic speech uses a standard voice, never a clone of the storyteller or another identifiable person. It reads the approved text in its original language. Captions may be original-language or an API translation, labeled accordingly. Label synthetic versions “Synthetic narration • words approved by the storyteller,” translated for the audience as needed. This label refers to the source text, not independent verification of translated captions. Do not reveal the person's reason for choosing it. Voice choice is explicit; no silent replacement.

**Editing policy:** For recorded speech, use one continuous recording or user-approved continuous excerpt and preserve pauses unless the person chooses a trim. For synthetic speech, read only the approved original-language text or approved excerpt. Allow a small set of suitable voices and a readable pace; avoid emotional-performance controls. Do not translate speech into a different language under the current scope. No AI-written dramatic hook, fabricated imagery, stock faces implying the storyteller's identity, or emotional soundtrack.

**Technical path:** Audio capture/upload → transcription with segment times, or typed text → reviewed source → original recording or text-to-speech audio file → caption timing matched to that audio → optional API caption translation → static image/background → FFmpeg audio/video composition → preview → approved download. Share caption-building, rendering, and job-status logic with option B. If synthetic narration is applied to original footage, remove all original audio and review any difference between visible speech and the new track; recommend neutral visuals when this would be misleading or identifying.

**Privacy distinction:** Recorded narration can identify the speaker. Synthetic narration over neutral visuals avoids exposing the person's recorded voice and face in the export, but names and distinctive story details still matter. Typed input also avoids collecting sensitive raw media in the first place. Cloud speech generation sends the approved text to a provider and must be explained separately from how the final video looks.

**Main risks:** Caption timing, legibility, repetitive visuals, rendering support, and accidentally marketing “no face” as anonymity. Avoid building an elaborate animation engine.

**Smallest complete version:** One short approved story, one chosen narration mode, one static background, timed original-language captions, one MP4 output. English or other caption translations use the same managed API and machine-translation labeling as the card/video paths, without a human language-review gate in the prototype.

**Estimate:** Approximately 4–6 builder-hours for the recorded-audio branch after the render environment works. Allow roughly 2–4 additional builder-hours for a single text-to-speech provider, file handling, timing, and playback review; the actual effort depends on provider capabilities. This is optional scope within the same one-day budget, not additional available time.

### Game-time decision table

| Factor | A: Card | B: Original video, optional blur | C: Recorded/synthetic narration |
|---|---|---|---|
| Preserves visual presence | No | Yes, with optional face obscuring | No |
| Preserves vocal expression | Only if recorded as source | Yes if using original audio | Yes for recorded speech; synthetic speech is a different performance |
| Lowest bandwidth path | Strongest | Weakest | Middle |
| Camera required | No | Yes, unless uploading a fixture | No |
| Render environment needed | Image pipeline | Video pipeline | Video pipeline |
| Sensitive-setting suitability | Better with careful text review | Blur reduces facial exposure; other clues remain | Synthetic speech with neutral visuals avoids recorded face/voice exposure |
| Likely implementation uncertainty | Lowest | Highest | Middle |
| Choose when | Export quality, accessibility, and completion matter most | Video handling works early and a builder can own it | The team wants spoken output without camera work, optionally without recording a voice |

All three are planned; building all three fully is not the one-day baseline. Keep the shared story schema and output contract so adding another format does not require reworking consent or capture.

### Identity-protection choices across formats

Separate **what is shown**, **what is heard**, and **what is written**. A format alone does not settle privacy. Present a short guide first, then direct controls in the preview; do not make someone complete a security questionnaire.

| User preference | Suggested output | What the preview must make clear |
|---|---|---|
| “I only want to share words” | Text or story card, no photo, optional omitted name | Story details and the sharing account may still identify them |
| “Keep my face out, but keep my video” | Face-blurred video | Voice, body, clothing, surroundings, and bystanders remain unless separately removed |
| “Keep my face and surroundings out” | Neutral visuals with recorded or synthetic narration | Recorded speech still reveals their voice |
| “Keep my real voice out” | Standard synthetic narration of approved original-language text | Original audio is removed; visuals and text need separate review |
| “Keep my face and real voice out” | Typed story → synthetic narration + neutral visuals, or text-only card | No camera/microphone needed; text may still go to a cloud provider if narration is chosen |
| “I'm not sure” | Start with text, no attribution, neutral visuals, and optional feedback from someone trusted | They can change settings without recording or explaining personal risks |

Controls should say “Show my name,” “Use my original footage,” “Blur faces,” and “Voice: my recording / synthetic / none.” If a combination conflicts with a stated preference, explain the conflict before applying it. For example: “Keeping your recording means your voice will be included.” Switching to a more revealing choice must not happen automatically when a renderer fails.

For face blur, conservative preset coverage is preferable to a weak cosmetic blur slider. The prototype should support a narrow, declared case, such as one short stationary clip with an adjustable covered region and whole-clip review. Automated detection may propose face regions, but fast movement, profiles, occlusion, reflections, multiple faces, and scene changes make dependable coverage a larger project. If reliable coverage cannot be established, offer neutral visuals or an opaque cover rather than claim the clip is protected. This is a face-obscuring feature, not an anonymity guarantee.

Before export, present a compact “What will be included” summary: name shown/omitted; footage original/blurred/neutral; voice recorded/synthetic/none; spoken language; caption language; recipient/audience intention. Approve the actual encoded output. A first-frame preview alone is not enough for a blurred video.

**Collection privacy and output privacy are different.** Blurring on the server means the server receives an unblurred original. Text-to-speech from an uploaded recording still required collecting that recording. Offer typing and neutral visuals from the start for people who do not want raw face/voice media collected. Do not market face blur as local processing unless the implementation actually performs and verifies it locally.

## 5. Fidelity and language policy

### What automation may do

- Transcribe, while treating its result as a draft.
- Suggest a source passage, with exact offsets or timestamps.
- Arrange approved words into a template and create caption timing.
- Translate a reviewed source into an explicitly selected target language.
- Read approved original-language text in an explicitly chosen standard synthetic voice, labeled as synthetic narration.
- Propose face-covering regions for human review, without treating detection as proof of anonymity.
- Flag possible identifying details or unclear phrases for the author to assess.

### What automation may not do

- Invent a conversion event, feeling, miracle, relationship, church, or claim about God.
- Increase drama, certainty, emotional intensity, or apparent spiritual maturity.
- Change the speaker's theology or vocabulary to fit an organizational message.
- Insert Scripture or resolve an uncertain reference from memory.
- Choose “best stories” using an emotional-impact or virality score.
- Treat user media or transcript text as instructions to change application behavior, consent, or tools.

The first version should not offer open-ended “make my story better.” Offer concrete actions: choose a shorter excerpt, correct the transcript, change a layout, or request a translation. If wording assistance is added later, make each change visible, reversible, and separately accepted.

### Language support and deferred human review

Maintain separate fields for interface language, source language, spoken-output language, and caption language. The confirmed target set is **English, French, Latin American Spanish, and Brazilian Portuguese**. Narration stays in the original language; captions can be another of these four. Offer language names English, Français, Español (Latinoamérica), and Português (Brasil), with no flags. Allow the person to correct detected source language rather than assuming the interface language is the story language.

| Target market | Language coverage to prioritize in testing | Product implication |
|---|---|---|
| United States | English and Latin American Spanish | Test either language independently of device language; all four remain available |
| Peru | Latin American Spanish | Include a Peruvian Spanish speech fixture and review vocabulary without rewriting the speaker's phrasing |
| Brazil | Brazilian Portuguese | Verify Brazilian Portuguese transcription, narration, captions, and interface copy |
| Mexico | Latin American Spanish | Include a Mexican Spanish speech fixture; don't assume one accent test covers Peru too |
| Canada | English and French | Evaluate Canadian French narration/transcription and review local phrasing; exact voice selection remains open |

This table guides testing, not assumptions about an individual. Latin American Spanish is a broad product language choice, not a promise that one provider voice or recognition model represents every regional accent. Keep display language, transcription locale, voice locale, and translation code mapped separately in a small configuration file. Verify the selected API's actual codes and capabilities before implementation; do not send a UI locale to every service unchanged. Let users preview a stock voice before approving it, and preserve regional language in their own recordings and transcripts.

Use managed APIs for transcription, translation, and synthetic narration. Keep interface strings in four small, versioned locale files, initially translated with an existing service, rather than translating every button on every page load. Human review of those strings, particularly consent and privacy explanations, belongs to later pilot preparation. Do not silently route a language to English if a provider request fails.

Four-language availability is the implementation target, while independent linguistic validation is later scope. Test at least one fabricated source story and synthetic-voice sample per language plus translated-caption fixtures in all four targets. Check that requests succeed, outputs are nonempty, characters render, captions fit, and timing matches the selected audio. These checks do not establish semantic accuracy or equal quality for every accent or all twelve cross-language directions. Prototype translations can be exported after normal asset approval, with a visible “Machine translated — not independently reviewed” label. No reviewer recruitment or simulated approval flow is required now.

Keep the original beside the translation. Label the translated output as a translation. Preserve meaning, uncertainty, personal idiom, and religious terminology; do not translate through English unnecessarily when evaluating a direct language pair is possible.

A storyteller who cannot read the target language cannot meaningfully verify its accuracy. For the fictional-data prototype, final approval means they choose to export that labeled machine-translated version; it must not be represented as linguistic verification. Before a real-data pilot, revisit who reviews translations, consent copy, and synthetic pronunciation, and whether any language-specific publication gates are needed. That policy and reviewer workflow are deliberately deferred.

A back-translation or second model can surface discrepancies, but is not proof of correctness. AI confidence alone cannot unlock approval. If translation fails, retain the source and explain that the original-language output is still available.

For Scripture, leave the field out of the initial required flow. If someone includes a verse, preserve their words and requested citation for review. Do not invent missing references or silently “correct” a quotation. Verified quotation and translation licensing are later product decisions.

## 6. Consent, minors, privacy, and exploitation

### Separate permissions

| Permission | Meaning | Default |
|---|---|---|
| Cloud processing | A named service may receive media/text for transcription or translation | Explain and obtain agreement before upload; local text path remains available |
| Personal output approval | This exact version is ready for the person to export/share | Off until preview approval |
| Church review | A specifically identified church may receive the approved asset | Off; omit prototype routing unless implemented |
| Baptize review | Baptize may receive a specified approved asset for consideration | Off; mock inbox only |
| Public featuring | Baptize may publicly feature this approved version under a clearly stated scope | Separate, off; no real publication in prototype |
| Guardian approval | The appropriate guardian approved the minor's specified asset and audience | Required for minors; simulated in prototype |

A short user-facing flow can reveal organizational permissions only if the person chooses to submit. Granular data does not require an intimidating wall of checkboxes.

“With my church” needs a named recipient and a stated audience; it cannot be a vague checkbox that grants permission to a global movement. Until routing exists, the person can share the downloaded asset directly with their church through an existing channel. Never pretend the prototype has delivered it.

For future featuring, distinguish approval to review from approval to publish. The person can approve publication of the exact current asset at submission, or request a later approval step. Any substantive editorial change or new translation requires renewed author permission; for minors it also requires renewed guardian permission.

### Guardian gate

The one-day goal is to prove that blocked states stay blocked, not to claim guardianship verification. Include pending, approved-in-simulation, and declined states. A child's own checkbox is not evidence of guardian identity. Check the gate in server export/submission handlers as well as the UI. Demonstrate that changing the asset invalidates the simulated guardian approval.

For an eventual real product, the guardian process needs a separate verification and safeguarding design appropriate to the operating regions, including a way to obtain permission before collecting a child's sensitive story. That work is a pilot prerequisite, not solved by this prototype.

### Privacy by minimizing collection

Default to no public story page, searchable directory, account, exact location, full name, contact list, or analytics recording story contents. A generic entry QR should contain no personal information or embedded testimony identifier.

For the sensitive-details path, avoid cloud upload entirely in the first version: typed text and local card generation only, once that implementation is verified. Clearly say what the app does and does not send. A website visit may still create host/network records, a shared device may retain history or downloads, and recipients may copy the output. Do not promise anonymity or that closing the page erases evidence.

Review text for names, workplaces, villages, dates, family relationships, former affiliations, and distinctive events. Flagging is an aid, not a comprehensive safety detector. In visual media, consider background signs, other faces, clothing, landmarks, and audible names. People in footage besides the storyteller need appropriate permission or exclusion.

Use memory for unsaved drafts by default. An explicit “save on this device” feature is later scope, with clear shared-device implications. If cloud media is used, store it privately, use expiring access, minimize logs, and delete raw data after completion or a short timeout. Proposed prototype target: raw uploads expire within one hour and test inbox data resets at the end of the event. Only promise those periods if cleanup is implemented and tested; provider retention and backups require separate review.

Withdrawal can remove data under the product's control and stop future featuring. It cannot recall downloaded files, screenshots, or reposts. Explain that at the share decision, in one sentence rather than a long disclaimer.

### Preventable misuse

- Forged stories: label demo fixtures; future submissions are unverified first-person accounts, not independently authenticated events.
- Coerced sharing: no prechecked publication boxes, public list of nonparticipants, or church pressure metric.
- Editing for a campaign: preserve source and asset versions; reviewers request changes rather than silently overwrite them.
- Sensitive-data exposure: protect inbox and media endpoints; do not rely on a hidden URL as access control.
- Upload abuse: validate actual media types, duration, size, and ownership; restrict processing resources and reject remote fetch URLs.
- Model misuse: pass content as data, validate output schemas, and keep model output away from authorization, shell execution, and publishing decisions.
- Metrics distortion: no baptism total is derived from stories, exports, or simulated submissions. Do not rank personal faith by sharing activity.

### Website privacy notice, collection acknowledgments, and legal review

**Goal:** Make the website's actual practices clear, minimize collection, and obtain appropriate permissions at the right time. A privacy policy, checkbox, or disclaimer cannot eliminate liability or substitute for proper handling of data. This is a product/legal workstream to complete with qualified counsel before real-data operation, not a finished legal policy or compliance certification.

The future operator is US-based and the target markets are the United States, Peru, Brazil, Mexico, and Canada. Scope the pre-launch legal review to these five countries, including applicable state/provincial requirements, rather than treating “international” as one jurisdiction. Determine applicability from the operator, audiences, user ages, data uses, and vendors. Language choice alone does not identify a user's location or applicable law. Do not collect precise location merely to populate a policy.

Treat religious testimony as sensitive in the product design. For each of the five target markets, legal review should determine applicable treatment of religious information, recording/likeness permissions, children's data, cross-border processing, privacy notices, and deletion/withdrawal requests. Do not assume a generic checkbox resolves these questions. No country-by-country compliance assessment has been completed by this plan.

**Privacy notice contents:** operator identity and contact; categories collected; purposes; applicable legal bases; processors and other recipients; storage/processing regions and international transfers; retention and deletion; user access/correction/deletion/withdrawal options; children's handling; website cookies and telemetry; security practices described accurately; limits after sharing to another platform; effective date and update process. Evaluate applicable US state notice obligations as well as those of target countries. [California Attorney General business privacy resources](https://oag.ca.gov/privacy/business-privacy).

**Inventory everything the website handles.** Include typed stories, recordings, transcripts, generated audio, translations, edited assets, face-location/mask data, optional names, age-gate responses, consent records, sessions/cookies, hosting/CDN IP and request logs, errors, and any future reviewer details. “We don't ask for an email” does not mean “we collect no personal data.” Record the host's and each processor's logging/retention behavior, not just application database fields.

| Moment | Notice or choice | Implementation requirement |
|---|---|---|
| First visit | Short privacy summary plus accessible full notice in all four languages | Explain essential session/hosting data; avoid advertising trackers, third-party embeds, and session replay in the prototype |
| Before microphone/camera | Explain what is recorded and whether it stays on device or is uploaded | Browser permission is separate from processing/publication permission; never upload merely because access was granted |
| Before cloud transcription/translation/narration | Identify the service, data sent, purpose, relevant retention, and available alternatives | Require the applicable affirmative choice before transmission; preserve text-only local option where actually implemented |
| Before server-side blur | Explain that the unblurred original must be uploaded for this operation | Do not imply the server receives only blurred media |
| Before private feedback | Explain exactly which version/file will leave the app and that the recipient may copy it | Separate draft-sharing approval from public featuring; apply guardian gate |
| Before WhatsApp/Instagram handoff | Explain destination sharing is governed by that platform and chosen audience | Send only the approved export; no hidden originals or personal information in links/filenames |
| Before Baptize review or featuring | Separate opt-ins for named recipient and permitted uses | No prechecked permission or blanket editorial/publication license |
| Delete/withdraw | Explain what can be deleted, how to request it, and what external copies cannot be recalled | Implement deletion/withdrawal and expose failures; keep only justified records for stated periods |

A privacy notice informs; acknowledgment that it was shown is not the same as valid consent for every processing purpose. Do not use “By continuing you agree to everything” or combine processing, marketing, publication, and guardian approval. Counsel should determine legal bases and where explicit consent is required; record the specific affirmative decisions the product relies on. Essential processing disclosures and optional tracking choices should not be disguised as one mandatory consent checkbox. If optional analytics are added later, assess and implement the relevant consent/opt-out controls before loading them.

**Consent evidence:** retain policy/notice version, language, purpose, asset/source version as applicable, decision, time, and guardian record where appropriate. Avoid retaining raw recordings solely to prove consent or collecting extra identifiers without a justified need. Define retention separately for consent evidence, raw media, derivatives, logs, and backups. Do not promise immediate universal deletion or “never used for training” until verified against every involved service and configuration.

**Children:** The hackathon's under-18 guardian rule is a product requirement; it is not a complete statement of legal age thresholds. US COPPA addresses covered services collecting personal information from children under 13, including certain general-audience services with actual knowledge. Applicable requirements can include notice and verifiable parental consent before collection, not merely before publication. The FTC notes a 2025 rule amendment; use the current rule and counsel's assessment for any real launch. International rules need separate assessment. The simulation must never be presented as sufficient guardian verification. [FTC COPPA guidance](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions).

**Supporting documents and operations:** prepare appropriate terms of use and a narrowly scoped optional media permission, review vendor contracts/data-processing terms, assign an owner for privacy requests and incidents, and assess whether a formal privacy impact assessment is required or appropriate. A pastor's review is not a transfer of the storyteller's rights. Obtain or exclude material involving other identifiable people as appropriate. Do not claim affiliation with Baptize or authority to grant it rights beyond the user's specific permission.

**One-day deliverable:** a visible prototype/test-data notice; a truthful short privacy page based on the actual test deployment; localized pre-upload explanations; separate consent states; minimal telemetry; and a documented collection/retention inventory. Clearly mark unresolved operator/vendor/legal details as unresolved rather than publishing fabricated contact information. Even a fictional-data website can collect real visitor IP/session data. A production legal policy and real-data launch remain a later workstream.

**Before real-data launch:** identify the operator and pilot sequence within the five confirmed markets, verify data flows and vendor settings, obtain jurisdiction-appropriate legal review, finalize and review all four language versions, test consent/deletion/access controls, and appoint a person responsible for privacy requests. Launch scope should match the review completed. Country-specific policy sections or notices, if needed, should describe actual differences; translating a US policy alone is not a country-specific assessment.

## 7. Mid-level technical overview

### Proposed stack

Use React + TypeScript + shadcn components, with Next.js as the proposed application framework so the UI and small API handlers live in one repository. React's official guide lists Next.js as a framework option, and Next route handlers support application HTTP endpoints. This is a recommendation, not a settled team preference. A Vite frontend plus a small Node server is a reasonable alternative if the team knows it better. [React documentation](https://react.dev/learn/creating-a-react-app), [Next.js route handlers](https://nextjs.org/docs/app/getting-started/route-handlers), [shadcn documentation](https://ui.shadcn.com/docs).

Use native browser recording where supported and file upload/text as fallbacks. Detect the supported MIME type rather than assuming all devices record the same format. [MediaRecorder documentation](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder).

For video options, use FFmpeg on a Node/container host or a separately running render worker; a local worker is acceptable for prototype development. FFmpeg provides conversion and media filtering capabilities. Verify the installed build's codec and subtitle/font support early. Do not assume a short-lived hosting function can process arbitrary video. [FFmpeg documentation](https://ffmpeg.org/ffmpeg.html), [filter documentation](https://ffmpeg.org/ffmpeg-filters.html).

**Proposed managed language stack:** Google Cloud Speech-to-Text, Cloud Translation, and Cloud Text-to-Speech provide a plausible single-vendor route for the four requested languages. Their language/voice documentation includes English, French, Spanish, and Portuguese; model, voice, region, and feature support still need checking for the exact configuration. This is a recommendation based on documented coverage, not a claim that Google is the most accurate provider or that a provider has been benchmarked. [Speech-to-Text languages](https://docs.cloud.google.com/speech-to-text/docs/speech-to-text-supported-languages), [Translation languages](https://docs.cloud.google.com/translate/docs/languages), [Text-to-Speech voices](https://docs.cloud.google.com/text-to-speech/docs/list-voices-and-types).

Keep three small server functions—transcribe, translate, synthesize—rather than a provider marketplace or custom models. Select one usable model/voice configuration per language and retain the provider response, language/locale, source-version reference, and review status with each derived asset. API credentials remain server-side. Brazilian Portuguese and Latin American Spanish are confirmed; evaluate transcription on both Peruvian and Mexican Spanish fixtures. Verify exact service locale mappings, proposed Canadian French/US English voice choices, timestamps, retention, file limits, quotas, and cost in the initial spike. If a service fails, explain the problem and preserve the source; do not replace the user's approved text with a guessed result.

For synthetic speech, obtain an actual audio file from the selected API and generate timings against that audio using supported timing metadata or an alignment step. Sentence-by-sentence synthesis is an alternative to evaluate if timing support is absent, but may sound less natural. Do not use browser read-aloud as if it automatically produced an exportable soundtrack: the browser SpeechSynthesis interface exposes speech playback, voices, and controls, not a standard audio-file export. [SpeechSynthesis documentation](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis).

For face blur, MediaPipe's web face detector is a candidate for proposing face locations, not an identity-recognition system or a complete anonymization service. It returns detections from images/video; coverage over time, handling missed detections, and exporting masked frames remain application work. A detector finding no face does not prove a frame is safe. [MediaPipe face detection](https://developers.google.com/edge/mediapipe/solutions/vision/face_detector/web_js).

Apply reviewed masks during actual rendering, with the FFmpeg media pipeline or a tested equivalent. Re-encode only the intended video/audio streams, strip source metadata and embedded originals, regenerate poster images from the processed output, and remove the original audio entirely when synthetic narration is selected. Review the final playable file for visual leakage and stray source audio, not just the editor preview. Metadata removal does not remove identifying details visible or audible in the story. [FFmpeg filters](https://ffmpeg.org/ffmpeg-filters.html).

Use the browser's native share mechanism when available, with `navigator.canShare` checks and a user-triggered action. Always retain download and copy-text alternatives because support varies. Do not promise direct posting to a specific social destination. [Web Share API documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API).

### Data flow

```text
QR/link → React capture and review flow
              │
              ├─ typed source → local review/card path
              │
              └─ permitted media upload → temporary private storage
                                           ↓
                                     transcription adapter
                                           ↓
                                  reviewed source + segments
                                           ↓
                              optional API translation + draft label
                                           ↓
                       privacy choices + optional original-language TTS
                                           ↓
                       A: image renderer / B or C: media renderer
                                           ↓
                            exact preview + author/guardian gate
                                           ↓
                      feedback or finished story → WhatsApp / Instagram
                           native share or guided save-and-post
                                           │
                          separately permitted mock submission
                                           ↓
                                   protected demo inbox
```

The source and consent logic should not know the details of a card template or an FFmpeg filter. Renderers receive an approved input specification and return an asset record. This is enough separation for one day; microservices and an elaborate plugin system are unnecessary.

### Minimal data model

| Record | Important fields |
|---|---|
| Story | ID, demo fixture flag, session owner, age-gate state, interface/source/caption languages, face/voice/name/surroundings preferences, optional display name, current version |
| Source | Media type, private file reference, source-language/locale choice, transcription provider/model/locale, original transcript, reviewed transcript, original segment timestamps, expiry |
| Translation | Source-version reference, source/target languages, provider/model/language-code mapping, translated segments, machine-generated flag; independent-review status defaults to not reviewed, with reviewer reference reserved for later |
| Asset | Story version, output kind, selected source spans, layout version, face-treatment/mask version, narration mode/voice/language, audio reference, caption version, rendered file reference/hash, status |
| Consent | Exact asset/version, purpose, recipient/audience, author decision, guardian state if required, time, consent-copy version, revoked time |
| Submission | Approved asset reference, review/publication scopes, pending/withdrawn state, mock flag |
| Render job | Owner, input version, output kind, pending/running/failed/complete state, error, expiry |

Track a scripted recording's source-text version and the final take's reviewed transcript. Do not assume the recording matches the script word for word. Later private review links add separate ReviewRequest and Feedback records; the one-day app does not need those tables.

Avoid full media blobs in browser local storage. Avoid raw stories or signed file URLs in logs. Keep approved text and source evidence connected, but send the mock inbox only the asset covered by permission, not all raw recordings automatically.

### Proposed endpoint responsibilities

- `POST /api/media`: validates a session-owned, bounded upload and returns a private reference.
- `POST /api/transcribe`: processes only an authorized upload; returns draft segments.
- `POST /api/translate`: translates only the reviewed source version; returns unapproved text.
- `POST /api/synthesize`: reads approved original-language text using an allowed stock voice; returns a private audio reference for rendering, never a publication decision.
- `POST /api/render`: creates a preview asset for a specific story/version/format.
- `GET /api/jobs/:id`: reports progress only to the owning session.
- `POST /api/approve`: records approval for the exact asset and applicable guardian state.
- `POST /api/export`: checks ownership, version, age/guardian, and approval before returning the export.
- `POST /api/mock-submissions`: separately checks review/feature consent; uses an idempotency key to avoid duplicate submissions on retry.
- `DELETE /api/stories/:id`: removes controlled assets and queued work; invalidates relevant access.

Only implement endpoints needed for the selected path. The local text/card branch can stay client-side with a shared policy function. Browser controls cannot prevent someone photographing their screen; the application's responsibility is to enforce its own export and submission actions.

### State and authorization

Keep processing state separate from permissions. For example, a render can be complete while export is blocked awaiting author approval. A prototype translation can be ready and exportable while its independent-review status remains “not reviewed.” A story can be approved for personal export while Baptize submission remains prohibited.

Key invariants: no export without exact-version author approval for the intended purpose, including private feedback; no minor export without corresponding guardian approval; machine-translated prototype outputs carry their unreviewed status without a human language-review gate; no inbox submission without recipient-specific consent; no cross-session access; no AI response can grant any permission. Changes to face masks, footage, narration, or captions invalidate asset approval. A failed privacy transformation cannot fall back to exporting the unprotected original.

Use a shared server-side authorization function for output and submission. UI-disabled buttons alone are insufficient. Return clear reasons such as “This version needs review” or “Guardian approval is still needed.”

### Prototype hosting and storage

For a hosted test-data prototype, use one HTTPS application and, if needed, one render process. A process-local mock inbox is acceptable when its reset behavior is explicit. If using multiple instances or ephemeral hosting, use a small shared store instead of assuming memory persists. No production Baptize database is involved.

Use secure session identifiers and protect the operator inbox even when data is fictional. The static screenshot of an inbox is a valid design artifact but must be labeled as such; a working submission path needs an actual mock persistence implementation.

Keep secret API keys on the server. Limit transcription/synthesis calls and render retries; reuse transcripts across formats and reuse synthetic audio only when text, voice, language, and approval-relevant settings match. Cost is approximately audio minutes × transcription rate, plus translation and text-to-speech usage, plus render compute and temporary storage. Set a team spending cap before enabling paid calls; no pricing is assumed here.

## 8. One-day execution plan for three builders

Assume approximately eight working hours, or 24 gross builder-hours, with some of that reserved for integration, troubleshooting, and device testing. Confirm the actual event schedule before treating these as deadlines.

### Responsibilities

| Builder | Primary ownership | Shared contract |
|---|---|---|
| 1 — experience | React/shadcn flow, privacy guide, script-assisted recording, review, four-language strings, destination instructions | Emits reviewed story versions; never grants server permissions |
| 2 — source and permission | Managed speech/translation adapters, schema, guardian/consent states, collection notices, mock inbox | Owns canonical data and authorization checks |
| 3 — output and runtime | Narrated-output renderer, export, WhatsApp/Instagram fallback, temporary files, deployment; blur only if time permits | Accepts a versioned render specification and returns an asset |

These are work assignments for the human team, not a request to run automated subagents now.

### Sequence and decision gates

| Time | Work | Exit condition |
|---|---|---|
| 0:00–0:30 | Agree schemas, fixture-only/collection notices, permissions, four-language API configuration, and boundaries | Shared contracts written; fabricated sources available |
| 0:30–1:15 | In parallel: UI/script reader; source/consent state and managed APIs; audio/video rendering feasibility | Know whether target phones record/play files, provider returns usable speech, and host creates an MP4 |
| 1:15–1:30 | Confirm the primary output implementation, prioritizing scripted recording and synthetic narration | One render template selected; face blur remains stretch scope |
| 1:30–3:30 | Build the chosen end-to-end path with fixture data | Capture/source review → actual output preview → approval → download |
| 3:30–5:00 | Integrate original-language synthetic speech, transcription correction, four-language caption support, guardian gate, mock inbox | Permission enforcement works; derived audio/captions match approved source |
| 5:00–6:00 | Complete WhatsApp/Instagram instructions, API fixture checks across four languages, and collection notices | Actual export can be handed off without real outsider messages or public posts |
| 6:00–7:15 | Test devices, failure recovery, content fidelity, language rendering, and access boundaries | Critical failures fixed; unsupported behavior clearly disabled |
| 7:15–8:00 | Freeze scope, clean test data, document setup, limitations, sources, and next steps | Reproducible prototype and honest handoff |

### Scope cuts in order

If time slips, remove face-blur prototyping, extra templates, animation, secondary format, and automatic excerpt suggestion before reducing the confirmed core. Private review links are already later scope. Four-language API support, scripted recording, and synthetic narration increase integration work: use one visual template and one usable stock voice per language, and avoid a montage editor. Keep uploaded fictional fixtures as a clearly marked fallback for unavailable live capture. If a media renderer is still failing, disclose the limitation and deliberately choose a card fallback rather than presenting an unfinished video generator as complete.

Do not cut source review, adult/guardian enforcement, explicit export approval, separate submission permission, collection explanations, or test-data restrictions. Do not silently reduce the requested four languages. If the actual working window is shorter than eight hours, surface the tradeoff to the team and identify which capabilities remain fixture-only or unfinished; the plan is a timebox, not a guarantee that 24 gross builder-hours will deliver every feature.

### Definition of a complete slice

One fabricated story can enter the chosen path, be corrected, produce a real file, receive exact-version approval, and be exported. Submission to the mock inbox happens only when separately permitted. A minor and a stale approval are blocked. Failure messages allow retry or a safe fallback without inventing success.

## 9. Verification and quality targets

These are proposed acceptance criteria, not results already measured.

| Test | Expected behavior |
|---|---|
| Ordinary short story | Output uses approved source words and optional attribution only |
| Rambling story | Author can select a passage without automated changes to meaning |
| “I don't know what happens next” | Uncertainty remains; no model-generated certainty |
| No dramatic before/after | Flow accepts the story without demanding a stronger transformation |
| Misheard word or unclear speech | Correction is available; no fabricated replacement |
| Missing or uncertain Scripture reference | No invented citation or quotation |
| Source edit after approval | Export/submission waits for new approval |
| Minor or uncertain age | Guardian path blocks unsupported actions, including direct endpoint attempts |
| Author agrees to export only | No mock inbox record is created |
| Author agrees to review only | Reviewer has no publication permission |
| Target language unknown to author | Fictional-data translation can be exported after asset approval with a machine-translated/not-reviewed label; no claim of author-verified translation accuracy |
| Long translated text or RTL sample | No clipping; text direction correct if supported, otherwise not advertised |
| Microphone denied or unsupported codec | File input or typing works; draft isn't replaced with an error |
| Weak network, provider timeout, render failure | Preserve available draft, explain failure, permit retry/fallback |
| Share unavailable or canceled | Download/copy remains available; no “published” claim |
| Repeated submission click | One intended mock submission |
| Another session requests media | Access denied |
| Delete or expiry | App-controlled assets/jobs are removed or made inaccessible as specified |
| Scripted take differs from the script | Final transcript and captions follow the reviewed take; no forced script substitution |
| User chooses to hide voice | Synthetic/no-voice route is immediately available; no repeated prompt to record |
| Synthetic narration | Reads approved original-language words; label present; no original audio remains |
| Translated captions on synthetic narration | Machine-translation label present and captions timed to the synthetic track, not the old recording; human language review deferred |
| English/French/Spanish/Portuguese fixtures | Capture/transcription as supported, UI strings, narration voice, and caption outputs verified for the chosen locale mappings |
| Regional language fixtures | Separate Peruvian and Mexican Spanish cases; Brazilian Portuguese; proposed Canadian French and US English samples. No inferred country or automatic changes to personal wording |
| Face-blur stretch feature | Complete encoded clip, poster, and thumbnails checked; uncertain coverage prevents protected-export claim |
| WhatsApp/Instagram unavailable as share targets | Save, copy, and platform-specific instructions remain usable |
| Private feedback share | Recipient gets only approved draft; no Baptize or public-feature permission is added |
| Declined cloud processing | No associated provider upload/call occurs; local path remains where supported |
| Privacy notice versus network behavior | Actual host, API, storage, logs, and optional scripts match the published description |

Manual checks should cover an actual iPhone/Safari and Android/Chrome if the team has them, plus desktop fallback. Check keyboard access, readable labels, focus order, recording state announcements, 200% text zoom, strong contrast, and generous touch targets. Do not require audio to understand the interface or rely only on color to show status.

Use fabricated long, short, multilingual, privacy-sensitive, and under-18 scenarios. When the official samples become accessible, add them to this set and credit them. For media tests, use authorized staged recordings of fictional scripts that do not introduce real church or personal records; clearly distinguish actors from genuine testimony.

Suggested product-learning targets: people can complete the short original-language path in a few minutes, can explain what they approved, and recognize the result as their own words. Ask test participants what confused them instead of measuring only completion speed. With a small hackathon sample, these are observations, not validated population claims.

## 10. Decisions to resolve and questions for Baptize

### Team decisions

1. **Language variants:** English, French, Latin American Spanish, and Brazilian Portuguese are confirmed. US English and Canadian French are proposed initial speech configurations; exact provider voices and regional mappings remain to be validated. Test Peruvian and Mexican Spanish separately; never infer dialect from nationality or interface choice alone.
2. **Language review — deferred:** no reviewer selection or approval workflow is needed for the hackathon. Revisit translation, consent-copy, and pronunciation review when planning a real-data pilot. Prototype API outputs remain labeled as not independently reviewed but are exportable under the ordinary author/guardian rules.
3. **Baptize handoff:** review-only consent; exact-asset review and optional publication consent; or defer the inbox after personal export. Recommendation: separate review and publication scopes in the data model even if the initial UI only offers review.
4. **Privacy scope:** scripted recording and synthetic narration are the confirmed implementation priorities; face blur is stretch. Guided privacy choices and direct controls are confirmed. Which initial voice/locale defaults fit the intended users remains open.
5. **Operation:** A US-based operator targeting the United States, Peru, Brazil, Mexico, and Canada is confirmed. Resolve the legal entity, US state, pilot rollout order, privacy contact, vendors/regions, and retention before any real-data pilot. Complete appropriate legal review for each market before including it in the real-data rollout.
6. **Sharing:** WhatsApp and Instagram with native handoff where supported and basic instructions are confirmed; private review links are later scope. Test the instructions on the team's actual phones instead of assuming every browser/app combination behaves alike.

### Questions for the Baptize team

- Which sharing destinations do newly baptized people actually use, and in which regions?
- What makes a story appropriate to feature: permission, clarity, representativeness, safety, language review, or something else?
- Who may receive a story marked “with my church,” and how would that recipient be identified?
- Does Baptize need the exported asset, the approved text, or raw media? Why is each needed?
- What does permission to feature cover: website, social accounts, campaigns, translations, duration, attribution, and later edits?
- Who handles consent withdrawal and language review after the event?
- What guardian approval and safeguarding process already exists?
- Should the app invite a conversation, a baptism next step, or simply sharing? What verified destination is appropriate?
- Are there naming, logo, Scripture-translation, or accessibility requirements?
- Who would own a pilot and its ongoing moderation, infrastructure, retention, and support?

No team answer is needed to finish this planning draft. These questions determine implementation and pilot decisions; they should not be filled with fabricated organizational assumptions.

## 11. After the hackathon

A real pilot needs organizational ownership, evaluated provider handling of sensitive religious data, tested deletion and recovery, a genuine guardian process, language reviewers, abuse/reporting procedures, and accessible usability testing with the intended communities. Introduce real data only after the hackathon's prototype restriction has been lifted through an explicit follow-on agreement.

Pilot narrowly: adults, the four requested language variants only where their flows have been verified, one sharing output, and one clearly identified organizational recipient. The target markets are the United States, Peru, Brazil, Mexico, and Canada; select a manageable first rollout within that group rather than assuming simultaneous launch. If review coverage is incomplete, agree an explicit limited pilot scope rather than implying all language paths are equally validated. Track faithful-output acceptance and consent comprehension; do not equate story submissions with baptisms or “spiritual impact.”

Consider existing Baptize editorial tools before building a new content-management system. The future integration should be a small adapter to an agreed import or API contract once one actually exists. There is no assumed Baptize API today.

## 12. Sources and provenance

- User-provided principles, app direction, Track 2 brief, prompts, and ground rules are the primary project requirements. The later user reply confirmed the team/time/frontend/adult scope and requested all three paths remain developed for a later decision.
- The linked [current-system overview](https://github.com/FaithTechGlobalLabs/faithtech-socal-hackathon/blob/main/docs/baptize-today.md), [ground rules](https://github.com/FaithTechGlobalLabs/faithtech-socal-hackathon/blob/main/docs/ground-rules.md), [starter prompts](https://github.com/FaithTechGlobalLabs/faithtech-socal-hackathon/blob/main/tracks/2-testimony-sharing/test-data/testimony-prompts.md), and [sample stories](https://github.com/FaithTechGlobalLabs/faithtech-socal-hackathon/blob/main/tracks/2-testimony-sharing/test-data/sample-stories.md) were supplied by the user. Remote retrieval failed; this plan does not claim to have inspected the additional linked content.
- Technical documentation consulted: React, Next.js, shadcn, MDN MediaRecorder/Web Share API, and FFmpeg, linked alongside the relevant recommendations.
- Revision 2 additionally incorporates the user's confirmed privacy variants, existing-app sharing before later review links, original-language synthetic speech with optional translated captions, guided controls, four target languages, WhatsApp/Instagram support, personal-voice encouragement, and requested website privacy/legal workstream. Later replies confirmed the US/international operating direction and scripted-recording/TTS priority over face blur.
- Revision 3 records the user's confirmed Brazilian Portuguese and Latin American Spanish variants and target markets: United States, Peru, Brazil, Mexico, and Canada. US English and Canadian French speech defaults are recommendations awaiting validation; no regional accuracy or country-specific legal compliance is claimed.
- Revision 4 follows the user's instruction to defer human language review. It removes the prototype's bilingual-review export gate and reviewer simulation/recruitment work, while retaining machine-translation labeling, technical checks, source correction, ordinary consent/guardian rules, and later pilot-readiness review.
- Additional sources consulted: Google Cloud language and voice coverage; MediaPipe face detection; MDN SpeechSynthesis; WhatsApp documentation; Meta's official Instagram API collection; FTC, ICO, and California Attorney General privacy guidance. References support specific technical/legal context, not a claim of provider quality, universal platform support, or legal compliance. Direct access to the Meta developer publishing page was rate-limited; exact Instagram app instructions remain a device-verification task.
- Impeccable design guidance informed the planning approach to simple task flows, clear states, accessibility, and separating open product choices from confirmed requirements. No interface has been built or visually tested.
- Proposed copy, architecture, estimates, policy distinctions, and prioritization are planning recommendations. No platform integration, privacy property, provider quality, or performance benchmark has been verified through implementation.
