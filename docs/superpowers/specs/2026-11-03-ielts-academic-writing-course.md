# IELTS Academic Writing Course — Product Specification

**Status:** Implemented; Task 1 figure fidelity refined
**Audience:** Learners preparing for IELTS Academic Writing, from first-time writers to candidates ready for timed practice
**Product shape:** Self-paced, English-first course in the existing static webpage

## Product outcome

Turn the current timed-writing practice page into a coherent course that teaches the decisions behind strong IELTS Academic Writing, gives learners repeated practice, and helps them choose a useful next step. Preserve the existing exercise bank, answer drafts, timer, model answers, language bank, and self-review. Refine the chart renderers so Task 1 figures read like restrained exam-paper visuals.

The experience should feel like a carefully edited learning workbook: clear hierarchy, calm visual rhythm, meaningful examples, and no unnecessary dashboard decoration. A learner should be able to start with little IELTS knowledge, study the skills in order, skip ahead when ready, and return to a specific Task 1, Task 2, language, or exam-preparation skill.

## Product promise and boundaries

- Teach the format, four assessment criteria, and the main writing decisions for both tasks.
- Build from guided recognition and short practice toward independent writing and timed work.
- Give three self-selected entry routes (new to IELTS, building skills, ready to practise under time), plus adjustable Guided/Core/Stretch practice. These routes are recommendations, not placement tests or band estimates.
- Save course completion, route, challenge level, checkpoint responses, and practice history in this browser only. Keep the existing draft-storage keys and behavior intact.
- Explain assessment with learner-facing self-review based on the four IELTS criteria. Do not claim to grade essays, predict bands, or replace teacher feedback.
- Keep the page useful on desktop, tablet, and narrow mobile screens, with keyboard-accessible navigation and controls.

## Learner journey

1. **Learn dashboard:** explain the course, let the learner choose an entry route and focus, show a suggested next lesson, resume action, course map, and a small link into practice.
2. **Lesson:** show the unit and lesson context, one clear objective, a concise explanation, worked example, a single retrieval check with feedback, one task at the selected challenge level, related practice when available, and an explicit completion action. The outline stays available on desktop and becomes a compact disclosure/list on small screens.
3. **Practice:** preserve the existing 15 exercise paper and writing workflow. Add course context and direct links from lessons. Keep the learner’s draft, self-review, quiz answer, and timer isolated per exercise as today.
4. **Progress:** summarize lessons completed by unit, recently opened exercises, saved learner route/focus/difficulty, and a clear next step. Describe work completed; never imply a calculated IELTS band.

## Course map (24 lessons)

| Unit | Lessons | Learning outcome |
| --- | ---: | --- |
| Start here | 3 | Understand the Academic Writing paper, the four criteria, and choose a personal starting route. |
| Task 1: Describe visuals | 6 | Read charts and tables, select main features, write an overview, group comparisons, report figures accurately, and approach maps/processes/combined visuals. |
| Task 2: Build an essay | 8 | Decode every prompt part, form a defensible position, plan and structure paragraphs, develop support, and respond to common essay question types. |
| Language workshop | 5 | Paraphrase accurately, choose precise vocabulary, use cohesion naturally, control sentence range, and edit for accuracy. |
| Exam practice | 2 | Allocate the 60 minutes sensibly and complete a full two-task practice with criterion-based review. |

Every lesson must contain a genuine explanation rather than a placeholder, a worked example or concrete demonstration, exactly one answerable knowledge check with explanatory feedback, and Guided/Core/Stretch practice. Where a lesson maps to existing questions, link the relevant exercise IDs. The default Core challenge should be useful without prior onboarding. Learners may open lessons in any order.

## Difficulty and inclusion

- Route choice changes the suggested starting point and lesson guidance, not access to lessons.
- Guided practice breaks a skill into explicit prompts; Core asks the learner to apply it independently; Stretch adds a constraint, ambiguity, or synthesis step.
- Keep language direct and define IELTS-specific terms when first used. Avoid assuming English proficiency or prior test familiarity.
- Offer focus choices for Task 1, Task 2, language, or the whole course.
- Avoid timed pressure in foundational lessons. Time limits belong to the exam-practice unit and the existing optional practice timer.
- Make learner controls reversible and state their local-storage behavior plainly.

## Visual and interaction direction

- Keep the existing sage paper, warm off-white cards, slate ink, teal, brick, gold, and Bricolage Grotesque/Source Serif 4 type system.
- Introduce a stable app header with Learn, Practice, and Progress navigation; each section has one visible primary action and an informative page title.
- Dashboard: two-column editorial layout at wide widths, with the learner’s next step and route prompt as the primary column and the full curriculum as the secondary column; collapse into a one-column reading order on mobile.
- Lesson: course outline, readable central lesson column, and checklist/next-step rail on wide screens. At tablet/mobile, prioritize the lesson body and move navigation into an accessible disclosure.
- Practice: preserve the two-column question and writing workspace, with responsive stacking already supported.
- Progress: course completion and unit breakdown first, with practice history and settings secondary.
- Keep generous line length and spacing, visible active/focus states, semantic headings and landmarks, descriptive chart text, and minimum comfortable touch targets.
- Treat the generated design concepts in `docs/superpowers/design/` as layout references, not literal copy or final truth. The built interface must match real content and actual lesson counts.

  - `course-dashboard.png`
  - `course-lesson.png`
  - `course-practice.png`
  - `course-progress.png`

## Task 1 figure treatment

- Keep all practice datasets original and label them as illustrative outside the plot itself.
- Use a white figure field, black and grey chart marks, clear axis labels and tick marks, and boxed series keys where needed. Avoid decorative colour palettes, rounded plot cards, and routine value labels on every bar.
- Present maps as paired, legible site plans with a simple monochrome key and north indicator. Present processes as ordered line-art stages connected by directional arrows, not numbered content cards.
- Let charts scroll horizontally on narrow screens when that preserves readable labels.

## Data and persistence

- Store authored curriculum in `data/course.json`, separate from practice questions.
- Use a small pure progress module with a versioned course key. Model lesson completion, the most recently opened lesson, route, focus, difficulty, and selected retrieval answers.
- Read malformed or unavailable storage safely and keep course lessons usable without persistence. Never send writing or course activity over the network.
- Derive completion and unit totals from course data instead of hard-coding dashboard counts.
- Preserve `ielts-writing:v1:` per-exercise storage; do not migrate or clear it.

## Acceptance criteria

1. A learner can open Learn, choose or change an entry route/focus/challenge, select a lesson, complete it, and see saved progress reflected on the dashboard and Progress view.
2. All 24 lessons have meaningful teaching content, one worked example, exactly one retrieval check with a right answer and feedback, level-adjusted practice, estimated time, and relevant links to practice where applicable.
3. The three app sections share consistent navigation. Practice still offers all existing 15 exercises, chart types, draft autosave, timers, self-review, model answers, language resources, and marking guidance.
4. The user can browse any lesson without restrictions; a learner’s route does not hide or lock course content.
5. The mobile reading order is useful and the dashboard, lesson, progress, course outline, and practice workspace fit narrow screens without horizontal page overflow.
6. Course controls use semantic buttons/links, selected-state semantics, visible keyboard focus, and accessible names. Progress labels make no band-score claims.
7. All progress stays local and the interface accurately explains the limits of self-assessment.

## Reference material

- IELTS Academic Writing format and task timing/weighting: [IELTS Academic format — Writing](https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-writing).
- Official Task 1 chart and process examples: [IELTS Academic Writing sample tasks (PDF)](https://ielts.org/cdn/Sample-tests/ielts-academic-writing-sample-tasks-2023.pdf).
- IELTS official preparation guidance and criterion terminology: [IELTS Writing test resources](https://ielts.org/take-a-test/preparation-resources/writing-test-resources).
- Market benchmark for breadth and progress features: [British Council IELTS Ready](https://ieltsnews.britishcouncil.org/ielts-prep). This is context, not a promise to match its feedback, services, or official status.
