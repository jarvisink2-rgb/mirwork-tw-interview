# Changelog

Every build was reviewed as three personas, plus mobile (375 px), Lighthouse (mobile, simulated 4G) and accessibility checks. Each entry lists what a persona complained about and what changed.

- **Persona A**: 國立大學大四, first interview, very nervous
- **Persona B**: 私大畢業, unemployed for 8 months, low confidence, afraid of the 空窗期 question
- **Persona C**: career changer who wants to move into tech

---

## v0.6: Owner feedback — no unverifiable claims, much less text (2026-10-19)

**Feedback from the project owner**
- Remove anything that isn't real data: "MirWork 已完成數萬場模擬面試", "社群成員錄取於 Meta・Google・Roblox・Amazon・Netflix".
- "Simplify the GUI. It looks too wordy and filled up."

**Changed**
- Removed the social-proof strip, the example metrics in the hero card, and the made-up four-session trend on the progress page. Every number left in the app is either the user's own result or cited on `/research`.
- Home: one headline, one sentence, two buttons, three one-line steps and one 待業中 banner. The stats wall and the 5-problem cards now live only on `/research`.
- Setup: only 狀況, 公司類型 and 職缺 are shown, as simple chips. Difficulty, focus topics, language, mode, length, company name and résumé sit under a collapsed **更多設定**. The start bar says just "公司・職缺・約 N 分鐘 [開始]".
- Report: the total score and radar share one card. Each red flag is title, quote and fix, with "為什麼扣分" collapsed. Model answers are collapsed. "下一步" is three rows. The bottom CTA block is gone.
- Ready screen, progress, resources, question bank and footer: subtitles and explanations cut to one line or removed. The question bank shows 12 questions first, with "顯示全部".
- Interview: Mir's avatar only shows "listening" while you're actually recording. Focus moves to the mic button or text box on every new question, for keyboard and screen-reader users.

**Lighthouse (mobile)**: Performance 91–96 on every page, Accessibility 100, Best Practices 100, SEO 100.

## v0.5: Shipped (2026-10-19)

- GitHub: `jarvisink2-rgb/mirwork-tw-interview`. Vercel: `mirwork-tw-interview.vercel.app`. Every push to `main` redeploys automatically.
- Mir now prefers natural zh-TW voices (Google 國語（臺灣）, Meijia, Flo, Sandy…) over macOS character voices like Grandma, Grandpa and Rocko, which were being picked first.

## v0.4: Persona round 3, English mode and résumé upload (2026-10-19)

**Found**
- A/C: In English mode, a 24-word answer triggered "Could you tell me a bit more?". The length thresholds were in Chinese characters.
- C: An English résumé (PDF) only produced skill keywords (Python, Java, Excel). "Internship", "President", "Volunteer" and "Project" were ignored, so the tailored question was shallow.
- A: A 14-second answer got the advice "try an even shorter version". This contradicted the length warning.
- All: STAR chips (情境／任務／行動／結果) appeared on salary and closing questions, where STAR doesn't apply.
- B: 自傳健檢 counted "一個、四個" as concrete numbers.

**Changed**
- Follow-up thresholds are now language-aware: English words ≈ 0.45 × Chinese characters.
- Résumé lexicon has English aliases (intern, president, captain, volunteer, project, research, competition…), mapped to Chinese question templates.
- Short and long answers get specific length advice ("補一個具體例子…抓在 60–120 秒"). The "shorter version" tip only appears when length is fine.
- STAR chips only show on behavioral, role and résumé questions.
- Trivial quantifiers (一個、兩位、一次) are excluded from "concrete numbers" everywhere.

## v0.3: Performance and accessibility (2026-10-19)

**Lighthouse before** (mobile, compressed static server): report 76, setup 87, interview 87. Accessibility 92–96.

**Changed**
- `/report/demo` is now a statically generated page: the demo report is analysed at build time, so its LCP no longer waits for JavaScript.
- Removed the global `text-wrap: pretty` on paragraphs. It doubled Style & Layout time on long pages under CPU throttling.
- Split `resumeQuestions` out of the mock provider, so `/setup` no longer ships the question bank and analyser (159 → 127 kB first-load JS). `/report` went from 164 to 135 kB.
- `/interview` now renders a server-side shell of the ready screen, so the first paint has real content. The artificial 350 ms "thinking" delay before planning is gone.
- Skeletons reserve ≥ 1 viewport of height, so client-loaded pages don't shift the footer (CLS 0.46 → 0).
- A11y: card titles are `h2` (heading order), the logo link no longer has a mismatched `aria-label`, the hidden file input has a label, and the demo-banner link uses the darker brand blue (contrast).

**Lighthouse after**: every page Performance 89–94, Accessibility 96–100, Best Practices 100, SEO 100.

## v0.2: Persona round 2 (2026-10-19)

**Found**
- A/C: The intro follow-up said "你剛剛提到報名人數變多…", quoting the *model answer*, not what the user said. The motivation follow-up asked about "the App you mentioned". Users would feel the AI isn't listening.
- B: After "都可以，依公司規定" to the salary question, Mir asked "舉一個具體的例子". This made no sense and added pressure.
- B: The report praised "「一個」這樣的具體數字".
- B: Saying "可能是我能力不太好吧" didn't lower 自信. The overall score (55) felt too generous for four red flags.
- A: The intro model answer was for 行銷企劃 even when applying as 製程工程師. The motivation example talked about an App for a semiconductor role.
- B: The red-flag section felt like a list of failures.
- A: Follow-up questions appeared without context, so after a pause you forgot what the original question was.
- All: The radar chart's "企業文化契合" label was clipped at 375 px. The trend chart text was ~6 px on phones.
- Honesty: The home page said "錄音只留在你的手機", but Chrome's speech recognition sends audio to Google.

**Changed**
- Every bank follow-up was rewritten to be generic ("剛剛提到的經驗中，你個人具體負責哪一部分？"). Context-aware follow-ups are generated from the user's own answer: missing result, missing number, money-only motivation ("除了福利和距離，還有什麼原因讓你想來這裡？").
- Trap questions (薪資、加班、空窗期…) are only followed up in 高壓 mode. 暖身 only nudges on very short story answers.
- Self-deprecation detection is broader. Each distinct red flag subtracts 2 points from the total (max 10). B now scores 45, and the strong personas score 68–70.
- Model answers are role-specific for 自我介紹 (8 roles) and company-type-specific for 為什麼想應徵 (7 types).
- A reassurance line now sits above the red flags: "紅旗不代表你不好…多半改一句話就能修好".
- Follow-ups show "延續：「原題目」". 暖身 mode can peek at a model answer before answering.
- The radar uses short labels with side padding. The trend chart measures its container, so text stays at true pixel size.
- Privacy copy now says: transcripts and reports stay in the browser; speech-to-text is provided by the browser (e.g. Google for Chrome).
- Plan items: 待業中 users see 青年職得好評計畫 / 支援青年就業計畫, and 轉職 users see 產業新尖兵.

## v0.1: First build (2026-10-19)

- All 7 pages + `/research`, in zh-TW with an English 外商 interview mode.
- Voice interview room with Web Speech API (zh-TW recognition and TTS), live waveform, timer, 追問, hints, optional webcam self-view, and a text fallback.
- Deterministic analyser: pace (字/分), fillers, STAR, numbers, role and culture keywords, 13 Taiwan-specific red flags, 5-dimension score, practice plan.
- 52-question bank (7 company types, 9 roles, traps, STAR, English, 群面) with HR intent, signals, model answers, follow-ups and sources.
- **Round-1 persona findings fixed before v0.2**: B's in-app-browser case (LINE/IG) explains why voice is off. Mic-denied, no-mic and network errors switch to typing and keep the transcript. A's "略過朗讀" button handles TTS that never fires `onend`. The TTS fallback no longer waits 28 s on devices without a Chinese voice.
