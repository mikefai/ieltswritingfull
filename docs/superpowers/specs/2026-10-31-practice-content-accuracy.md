# Practice Content Accuracy Spec

## Goal

Make the Task 1 night-time-noise exercise consistently describe the chart’s 2025 values and 40 dB reference line.

## Evidence

`data/exercises.json` sets the reference value to 40 dB and Cardiff’s final value to 41 dB. The current correct quiz option, quiz explanation, analysis note, and model answer say Cardiff is below the reference line. Those statements contradict the plotted data and teach the wrong comparison.

## Requirements

- Keep all chart values and the 40 dB reference unchanged.
- Update the correct quiz option, its explanation, the analysis notes, and the model answer so they say all four cities finish above 40 dB and Cardiff is closest to the line at 41 dB.
- Keep exactly one correct quiz option and preserve the existing illustrative-data disclosure.
- Add a focused regression check that fails when the chart and accompanying teaching copy disagree about Cardiff’s position.

## Out of scope

- Rewriting other exercises or changing the question bank structure.
- Adding external evidence or changing claims about the World Health Organization.
