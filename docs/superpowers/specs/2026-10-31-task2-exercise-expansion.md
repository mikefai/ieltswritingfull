# Task 2 Exercise Expansion Spec

## Goal

Add two original Task 2 exercises that practise prompt demands not represented in the current bank: weighing advantages against disadvantages, and explaining causes with solutions.

Official IELTS guidance describes varied Task 2 prompt demands and advises learners to answer the wording they are given rather than memorize a response template. See [IELTS Writing Task 2: How to understand IELTS question prompts](https://ielts.org/news-and-insights/ielts-writing-task-2-how-to-understand-ielts-question-prompts) (consulted 2026-10-31).

## New exercises

- `t2-remote-work`, kind `Advantages outweigh disadvantages`: “Some employers allow staff to work remotely for part of the week. Do the advantages of this arrangement outweigh the disadvantages?”
- `t2-food-waste`, kind `Causes and solutions`: “Many households throw away edible food. What are the main causes of this problem, and what measures could households and governments take to reduce it?”

Both belong to the existing Task 2 group (`task: "2"`, `type: "2"`), use 40 minutes and a 250-word minimum, and use the existing question-bank fields for quiz, plan, phrases, and model answer.

Together with the Task 1 visual expansion spec, these additions bring the bank from 11 to 15 exercises: the regular Task 1 and Task 2 groups each grow from three to five, while the five-exercise harder set stays unchanged.

## Requirements

- Add a distinct plan and one-correct-answer quiz for each prompt; quiz explanations must teach how to cover the exact prompt demands.
- Provide original model answers of at least 250 words that cover every part of each prompt and state a clear position where the prompt asks for one.
- Keep examples illustrative and avoid unsupported statistics or claims that require outside research.
- Preserve the existing three exercise groups and leave the harder set unchanged.
- Add a focused regression check for exercise IDs, prompt text, task settings, one correct quiz option, and model-answer word minimums.
