# Task 1 Visual Exercise Expansion Spec

## Goal

Add original process-diagram and map exercises so learners can practise Academic Task 1 visual formats beyond charts and tables.

Official IELTS preparation guidance lists graphs, charts, tables, process diagrams, maps, and plans among Academic Task 1 visual inputs. It also emphasizes selecting and reporting the main features. See [IELTS Writing test preparation resources](https://ielts.org/take-a-test/preparation-resources/writing-test-resources) and [IELTS Academic Writing test format](https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-writing) (consulted 2026-10-31).

## New exercises

- `t1-glass-process`: a six-stage, original process diagram showing used glass bottles being collected, sorted, washed, crushed, remade, and distributed.
- `t1-lakeside-map`: two original, north-up maps of a fictional lakeside park in 2000 and 2025, with consistent scale and a legend.

Both belong to the existing Task 1 group (`task: "1"`, `type: "1"`), use 20 minutes and a 150-word minimum, and follow the existing question-bank fields for quiz, analysis, phrases, and model answer. Model answers must be at least 150 words and report only what the diagram shows.

Together with the Task 2 expansion spec, these additions bring the bank from 11 to 15 exercises: the regular Task 1 and Task 2 groups each grow from three to five, while the five-exercise harder set stays unchanged.

## Visual interfaces

- Process figure: `kind: "process"`; `data.steps` is an ordered array of `{ title: string, detail: string }`. The renderer returns a responsive, semantic ordered sequence with visible connectors and an accessible label.
- Map figure: `kind: "map"`; `data.periods` contains exactly two `{ label: string, features: Feature[] }` entries. Each `Feature` has `{ name: string, kind: "water" | "green" | "building" | "road" | "path" | "open", x: number, y: number, width: number, height: number }`; coordinates are percentages in the inclusive range 0–100, widths and heights are positive, and `x + width` / `y + height` stay within 100. Render the same north-up 100-by-100 site for each period, show a north arrow in each panel, and keep the legend consistent.

## Global requirements

- Preserve existing chart and table rendering.
- Use the current vanilla browser stack with no new runtime dependencies.
- Keep the question bank as the source of exercise content.
- Mark both figures as original illustrative practice material.
- Keep all visible labels available to assistive technology; do not rely on color alone to identify map features.

## Acceptance criteria

- The app renders the six process stages in order and the two maps with matching orientation and scale.
- Both new exercises appear under Task 1, have one correct quiz option, useful analysis notes, tailored phrases, and a model answer of at least 150 words.
- The process and map remain legible on a narrow viewport and have meaningful accessible names.
