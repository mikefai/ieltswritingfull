/* Semantic HTML views for the course, rendered from authored course data. */
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.CourseView = api;
}(typeof window !== "undefined" ? window : this, function () {
  "use strict";

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function flatten(course) {
    var all = [];
    (course.units || []).forEach(function (unit) {
      (unit.lessons || []).forEach(function (lesson) {
        all.push({ unit: unit, lesson: lesson });
      });
    });
    return all;
  }

  function percent(done, total) { return total ? Math.round(done / total * 100) : 0; }

  function progressBar(done, total, label) {
    var value = percent(done, total);
    return '<div class="course-meter" role="progressbar" aria-label="' + esc(label) + '"' +
      ' aria-valuemin="0" aria-valuemax="' + total + '" aria-valuenow="' + done + '">' +
      '<span style="width:' + value + '%"></span></div>';
  }

  function preferences(state) {
    var focus = [["all", "Everything"], ["task1", "Task 1"], ["task2", "Task 2"], ["language", "Language"]];
    var levels = [["guided", "Guided"], ["core", "Core"], ["stretch", "Stretch"]];
    return '<div class="learner-controls">' +
      '<label class="field"><span>Focus</span><select data-pref="focus" aria-label="Choose a course focus">' +
      focus.map(function (option) { return '<option value="' + option[0] + '"' +
        (state.focus === option[0] ? " selected" : "") + ">" + option[1] + "</option>"; }).join("") +
      '</select></label><fieldset class="level-field"><legend>Practice difficulty</legend><div class="level-options">' +
      levels.map(function (option) { return '<button type="button" class="level-choice' +
        (state.difficulty === option[0] ? " is-selected" : "") + '" data-level="' + option[0] + '"' +
        ' aria-pressed="' + (state.difficulty === option[0]) + '">' + option[1] + "</button>"; }).join("") +
      '</div></fieldset></div>';
  }

  function routeCards(state) {
    var routes = [
      ["new", "New to IELTS writing", "Learn the format and build the foundations."],
      ["building", "Building my skills", "Strengthen Task 1, Task 2 or academic language."],
      ["timed", "Ready to practise under time", "Bring your skills together under exam conditions."]
    ];
    return routes.map(function (route) {
      var selected = state.route === route[0];
      return '<button type="button" class="route-card' + (selected ? " is-selected" : "") +
        '" data-route="' + route[0] + '" aria-pressed="' + selected + '">' +
        '<span class="route-mark" aria-hidden="true">' + (selected ? "✓" : "") + '</span>' +
        '<span><strong>' + route[1] + '</strong><small>' + route[2] + '</small></span></button>';
    }).join("");
  }

  function lessonStatus(lesson, state) {
    if (state.completed.indexOf(lesson.id) >= 0) return '<span class="lesson-mark is-done" aria-label="Completed">✓</span>';
    if (state.lastLesson === lesson.id) return '<span class="lesson-mark is-current" aria-label="In progress">•</span>';
    return '<span class="lesson-mark" aria-hidden="true"></span>';
  }

  function outline(course, state, options) {
    options = options || {};
    var selectedId = options.selectedId || "";
    var preferredUnit = options.openUnitId || (selectedId && findLesson(course, selectedId) || {}).unit;
    preferredUnit = typeof preferredUnit === "string" ? preferredUnit : preferredUnit && preferredUnit.id;
    if (!preferredUnit) preferredUnit = course.units[0] && course.units[0].id;
    return '<div class="course-outline">' + (course.units || []).map(function (unit) {
      var done = (unit.lessons || []).filter(function (lesson) {
        return state.completed.indexOf(lesson.id) >= 0;
      }).length;
      return '<details class="outline-unit"' + (unit.id === preferredUnit ? ' open' : '') + '>' +
        '<summary class="outline-summary"><span class="unit-accent unit-accent--' + esc(unit.accent) + '"></span>' +
        '<span class="outline-unit-title">' + esc(unit.title) + '</span>' +
        '<span class="outline-unit-count">' + done + ' / ' + unit.lessons.length + '</span></summary>' +
        '<ol class="outline-lessons">' + unit.lessons.map(function (lesson, index) {
          var active = selectedId === lesson.id;
          var complete = state.completed.indexOf(lesson.id) >= 0;
          return '<li><button type="button" class="outline-lesson' + (active ? " is-active" : "") +
            (complete ? " is-complete" : "") + '" data-course-lesson="' + esc(lesson.id) + '"' +
            (active ? ' aria-current="step"' : "") + '>' + lessonStatus(lesson, state) +
            '<span class="outline-number">' + (index + 1) + '</span><span>' + esc(lesson.title) + '</span></button></li>';
        }).join("") + '</ol></details>';
    }).join("") + '</div>';
  }

  function findLesson(course, id) {
    var found = null;
    (course.units || []).some(function (unit) {
      return (unit.lessons || []).some(function (lesson) {
        if (lesson.id === id) { found = { unit: unit, lesson: lesson }; return true; }
        return false;
      });
    });
    return found;
  }

  function nextLesson(course, id) {
    var all = flatten(course);
    var index = all.findIndex(function (item) { return item.lesson.id === id; });
    return index >= 0 && index + 1 < all.length ? all[index + 1].lesson : null;
  }

  function practiceItem(id, exercises) {
    return (exercises || []).filter(function (exercise) { return exercise.id === id; })[0] || null;
  }

  function practiceLinks(lesson, exercises, label) {
    var links = (lesson.practiceIds || []).map(function (id) {
      var item = practiceItem(id, exercises);
      if (!item) return "";
      return '<button type="button" class="practice-link" data-practice-exercise="' + esc(item.id) + '">' +
        '<span class="practice-link-meta">Task ' + esc(item.task === "3" ? "2 · stretch" : item.task) +
        ' · ' + esc(item.kind) + '</span><strong>' + esc(item.title) + '</strong><span aria-hidden="true">→</span></button>';
    }).filter(Boolean).join("");
    if (!links) return "";
    return '<section class="related-practice"><p class="eyebrow">' + esc(label || "Put it into practice") +
      '</p><div class="practice-link-list">' + links + '</div></section>';
  }

  function visualGuide(visual) {
    if (!visual || !Array.isArray(visual.items) || !visual.items.length) return "";
    var layout = ["grid", "split", "steps"].indexOf(visual.layout) >= 0 ? visual.layout : "grid";
    return '<section class="lesson-visual-guide panel"><p class="eyebrow">At a glance</p><h2>' +
      esc(visual.title) + '</h2><div class="visual-guide-items visual-guide-items--' + layout + '">' +
      visual.items.map(function (item, index) {
        return '<div class="visual-guide-item' + (layout === "steps" ? " is-step" : "") + '">' +
          (layout === "steps" ? '<span class="visual-step" aria-hidden="true">' + (index + 1) + '</span>' : "") +
          '<div><strong>' + esc(item.label) + '</strong><p>' + esc(item.detail) + '</p></div></div>';
      }).join("") + '</div></section>';
  }

  function lessonFigures(lesson, exercises) {
    if (!lesson.visualExerciseIds || !lesson.visualExerciseIds.length || typeof window === "undefined" || !window.ChartSVG) return "";
    var builders = window.ChartSVG;
    var figures = [];
    lesson.visualExerciseIds.forEach(function (id) {
      var exercise = practiceItem(id, exercises);
      if (!exercise) return;
      var source = exercise.figures || (exercise.figure ? [exercise.figure] : []);
      var figure = source[0];
      if (!figure || typeof builders[figure.kind] !== "function") return;
      figures.push('<figure class="lesson-figure panel"><figcaption><span class="eyebrow">From the practice library</span>' +
        '<strong>' + esc(exercise.title) + '</strong></figcaption>' +
        '<div class="lesson-figure-body"><div class="lesson-figure-scroll">' + builders[figure.kind](figure) +
        '</div></div></figure>');
    });
    if (!figures.length) return "";
    return '<section class="lesson-figure-section"><p class="eyebrow">Study the visual</p><div class="lesson-figure-list">' +
      figures.join("") + '</div></section>';
  }

  function dashboard(course, progress, exercises) {
    var state = progress.get();
    var summary = progress.summary(course);
    var suggested = progress.recommendedLesson(course);
    var last = state.lastLesson && findLesson(course, state.lastLesson);
    var finished = summary.total > 0 && summary.completed === summary.total;
    var continueItem = finished ? null : last && state.completed.indexOf(last.lesson.id) < 0 ? last.lesson : suggested;
    var practice = (exercises || []).filter(function (exercise) {
      return state.practiceHistory.every(function (item) { return item.id !== exercise.id; });
    })[0] || (exercises || [])[0];

    var nextCard = continueItem ? '<section class="next-card panel">' +
      '<div class="next-card-icon" aria-hidden="true">↗</div><div><p class="eyebrow">' +
      (state.lastLesson ? "Continue learning" : "Suggested next lesson") + '</p><h2>' + esc(continueItem.title) +
      '</h2><p>' + esc(continueItem.objective) + '</p><span class="lesson-meta">' + esc(continueItem.area) +
      ' · ' + continueItem.minutes + ' min</span></div><button type="button" class="button button-primary" data-course-lesson="' +
      esc(continueItem.id) + '">Open lesson <span aria-hidden="true">→</span></button></section>' :
      '<section class="next-card panel"><p class="eyebrow">Course complete</p><h2>Revisit any lesson or practise a full paper.</h2></section>';

    var practiceCard = practice ? '<section class="upcoming-card panel"><div class="mini-icon" aria-hidden="true">▥</div>' +
      '<div><p class="eyebrow">Writing practice</p><h3>' + esc(practice.title) + '</h3><p>Task ' +
      esc(practice.task === "3" ? "2 · stretch" : practice.task) + ' · ' + esc(practice.kind) +
      '</p></div><button type="button" class="text-arrow" data-practice-exercise="' + esc(practice.id) + '"' +
      ' aria-label="Open practice: ' + esc(practice.title) + '">→</button></section>' : "";

    var openUnitId = state.route === "timed" ? "exam"
      : state.route === "building" && state.focus === "task2" ? "task2"
      : state.route === "building" && state.focus === "language" ? "language"
      : state.route === "building" && state.focus === "all" ? "task1"
      : state.route === "building" ? "task1" : "start";

    return '<div class="course-dashboard">' +
      '<div class="dashboard-main"><header class="dashboard-hero"><p class="eyebrow">A self-paced course for every starting point</p>' +
      '<h1>Build your IELTS writing, one skill at a time.</h1><p class="hero-copy">Learn how to read a task, shape a clear response, and practise with a plan you can return to.</p>' +
      '<div class="completion-line"><strong>' + summary.completed + ' of ' + summary.total + ' lessons complete</strong>' +
      '<span>' + percent(summary.completed, summary.total) + '%</span></div>' + progressBar(summary.completed, summary.total, "Course lessons complete") +
      '<p class="privacy-note">Your course progress and writing drafts stay in this browser. Self-review is practice, not an IELTS band score.</p></header>' +
      '<section class="route-panel panel"><div class="panel-heading"><div><p class="eyebrow">Start where you are</p><h2>What best describes you today?</h2></div>' +
      '<span class="quiet-tag">You can change this later</span></div><div class="route-options">' + routeCards(state) + '</div>' +
      preferences(state) + '</section>' + nextCard + practiceCard + '</div>' +
      '<aside class="curriculum-panel panel"><div class="panel-heading"><div><p class="eyebrow">Your learning path</p><h2>Course curriculum</h2></div>' +
      '<span class="outline-total">' + summary.total + ' lessons</span></div>' + outline(course, state, { openUnitId: openUnitId }) +
      '<p class="outline-footnote">All lessons are open. Choose a route to guide your next step.</p></aside></div>';
  }

  function checkpointHTML(lesson, answer) {
    var chosen = Number.isInteger(answer) && answer >= 0 && answer < lesson.check.options.length ? answer : null;
    var optionCorrect = chosen !== null && lesson.check.options[chosen] && lesson.check.options[chosen].correct;
    var options = lesson.check.options.map(function (option, index) {
      var cls = "check-option";
      if (chosen !== null && option.correct) cls += " is-correct";
      if (chosen === index && !option.correct) cls += " is-wrong";
      return '<button type="button" class="' + cls + '" data-checkpoint-answer="' + index + '"' +
        ' aria-pressed="' + (chosen === index) + '"><span class="option-mark" aria-hidden="true">' +
        String.fromCharCode(65 + index) + '</span><span>' + esc(option.text) + '</span></button>';
    }).join("");
    var feedback = chosen === null ? "" : '<p class="checkpoint-feedback ' +
      (optionCorrect ? "is-correct" : "is-wrong") + '" role="status"><strong>' +
      (optionCorrect ? "Correct." : "Try again.") + '</strong> ' + esc(lesson.check.options[chosen].feedback) + '</p>';
    return '<section class="checkpoint panel" aria-labelledby="checkpointHeading"><p class="eyebrow">Quick check</p>' +
      '<h2 id="checkpointHeading">' + esc(lesson.check.question) + '</h2><div class="checkpoint-options">' + options +
      '</div>' + feedback + '</section>';
  }

  function lesson(course, progress, exercises, id) {
    var found = findLesson(course, id) || { unit: course.units[0], lesson: course.units[0].lessons[0] };
    var item = found.lesson;
    var state = progress.get();
    var all = flatten(course);
    var at = all.findIndex(function (entry) { return entry.lesson.id === item.id; });
    var prev = at > 0 ? all[at - 1].lesson : null;
    var next = at >= 0 && at + 1 < all.length ? all[at + 1].lesson : null;
    var answer = progress.checkpointFor(item.id);
    var complete = state.completed.indexOf(item.id) >= 0;
    var difficulty = state.difficulty;
    function sectionHTML(section) {
      return '<section class="teaching-section"><h2>' + esc(section.heading) + '</h2><p>' +
        esc(section.body) + '</p></section>';
    }
    var firstSection = item.sections.length ? sectionHTML(item.sections[0]) : "";
    var remainingSections = item.sections.slice(1).map(sectionHTML).join("");
    var content = firstSection + visualGuide(item.visual) + lessonFigures(item, exercises) + remainingSections;
    var selectedTask = item.challenge[difficulty] || item.challenge.core;
    var practice = practiceLinks(item, exercises, "Related writing practice");
    var completion = complete ? '<button type="button" class="button button-complete" disabled><span aria-hidden="true">✓</span> Lesson complete</button>' :
      '<button type="button" class="button button-primary" data-complete-lesson="' + esc(item.id) + '">Mark lesson complete <span aria-hidden="true">→</span></button>';

    var courseSummary = progress.summary(course);
    return '<div class="lesson-layout">' +
      '<aside class="lesson-outline panel"><details class="lesson-outline-disclosure"><summary><span>Course outline</span><span>' +
      courseSummary.completed + ' / ' + courseSummary.total + ' complete</span></summary><div class="lesson-outline-content">' +
      '<div class="lesson-progress-copy">' + courseSummary.completed + ' of ' + courseSummary.total + ' complete</div>' +
      progressBar(courseSummary.completed, courseSummary.total, "Course lessons complete") +
      outline(course, state, { selectedId: item.id }) + '</div></details></aside>' +
      '<article class="lesson-article"><div class="lesson-breadcrumb"><span>' + esc(found.unit.title) + '</span><span aria-hidden="true">/</span><span>' + esc(item.area) + '</span></div>' +
      '<header class="lesson-header"><p class="eyebrow">Lesson ' + (at + 1) + ' of ' + all.length + ' · ' + item.minutes + ' min</p>' +
      '<h1>' + esc(item.title) + '</h1><p class="objective"><strong>By the end, you can:</strong> ' + esc(item.objective) + '</p></header>' +
      '<div class="teaching-content">' + content + '</div>' +
      '<section class="worked-example panel"><div><p class="eyebrow">Worked example</p><h2>' + esc(item.example.label) + '</h2>' +
      '<p>' + esc(item.example.content) + '</p></div><span class="example-mark" aria-hidden="true">“</span></section>' +
      checkpointHTML(item, answer) +
      '<section class="challenge-panel panel"><div class="panel-heading"><div><p class="eyebrow">Apply what you learned</p><h2>Your practice task</h2></div></div>' +
      '<p class="selected-challenge" data-selected-challenge>' + esc(selectedTask) + '</p>' +
      '<div class="challenge-levels" role="group" aria-label="Choose practice difficulty">' +
      [["guided","Guided"],["core","Core"],["stretch","Stretch"]].map(function (option) {
        return '<button type="button" class="level-choice' + (difficulty === option[0] ? " is-selected" : "") +
          '" data-level="' + option[0] + '" aria-pressed="' + (difficulty === option[0]) + '">' + option[1] + '</button>';
      }).join("") + '</div></section>' + practice +
      '<footer class="lesson-actions">' + (prev ? '<button type="button" class="button button-quiet" data-course-lesson="' + esc(prev.id) + '">← Previous lesson</button>' : '<span></span>') +
      '<div class="lesson-completion">' + completion + (next ? '<button type="button" class="button button-quiet" data-course-lesson="' + esc(next.id) + '">Next lesson →</button>' :
      '<button type="button" class="button button-quiet" data-view="progress">View progress →</button>') + '</div></footer></article>' +
      '<aside class="lesson-rail panel"><p class="eyebrow">Lesson guide</p><h2>Work through the skill</h2><ol class="lesson-steps">' +
      '<li class="is-current"><span>1</span><span>Read the explanation</span></li><li' + (answer !== undefined ? ' class="is-done"' : '') + '><span>2</span><span>Try the quick check</span></li><li' + (complete ? ' class="is-done"' : '') + '><span>3</span><span>Apply it to a task</span></li></ol>' +
      '<div class="rail-note"><strong>Learning tip</strong><p>Make one clear improvement at a time. You can change the challenge level whenever you need.</p></div>' +
      '<p class="local-note">Progress saves in this browser only.</p></aside></div>';
  }

  function progressPage(course, progress, exercises) {
    var state = progress.get();
    var summary = progress.summary(course);
    var next = progress.recommendedLesson(course);
    var finished = summary.total > 0 && summary.completed === summary.total;
    var history = state.practiceHistory;
    var historyHTML = history.length ? history.map(function (item) {
      return '<li><button type="button" class="history-item" data-practice-exercise="' + esc(item.id) + '">' +
        '<span class="history-icon" aria-hidden="true">▤</span><span><strong>' + esc(item.title) + '</strong>' +
        '<small>Task ' + esc(item.task === "3" ? "2 · stretch" : item.task) + ' · ' + esc(item.kind) + '</small></span>' +
        '<span aria-hidden="true">→</span></button></li>';
    }).join("") : '<li class="history-empty">Your recent writing exercises will appear here when you open one.</li>';
    var routeNames = { new: "New to IELTS writing", building: "Building my skills", timed: "Ready to practise under time" };
    var unitRows = summary.units.map(function (unit) {
      return '<div class="progress-unit"><span class="unit-accent unit-accent--' + esc(unit.accent) + '"></span>' +
        '<div class="progress-unit-main"><strong>' + esc(unit.title) + '</strong><small>' + esc(unit.summary) + '</small>' +
        progressBar(unit.completed, unit.total, unit.title + ' lessons complete') + '</div><span class="progress-count">' +
        unit.completed + ' / ' + unit.total + '</span></div>';
    }).join("");
    var continueButton = next && !finished ? '<button type="button" class="button button-primary button-wide" data-course-lesson="' + esc(next.id) + '">Continue course <span aria-hidden="true">→</span></button>' :
      '<button type="button" class="button button-primary button-wide" data-view="learn">Explore lessons <span aria-hidden="true">→</span></button>';
    var lastPractice = history.map(function (item) { return practiceItem(item.id, exercises); }).filter(Boolean);

    return '<div class="progress-page"><section class="progress-main"><header class="progress-hero"><p class="eyebrow">Your learning record</p>' +
      '<h1>Your writing course progress</h1><p>See what you have completed and choose a useful next step.</p>' +
      '<div class="completion-line"><strong>' + summary.completed + ' of ' + summary.total + ' lessons complete</strong><span>' +
      percent(summary.completed, summary.total) + '%</span></div>' + progressBar(summary.completed, summary.total, "Course lessons complete") + '</header>' +
      '<section class="progress-breakdown"><div class="section-heading"><p class="eyebrow">Course map</p><h2>Progress by unit</h2></div>' + unitRows + '</section>' +
      '<section class="progress-boundary panel"><strong>A useful guide, not a band score</strong><p>This page records lessons and practice you open. It does not grade essays or predict an IELTS result.</p></section></section>' +
      '<aside class="progress-side"><section class="history-panel panel"><p class="eyebrow">Recent writing practice</p><h2>Practice history</h2><ul class="history-list">' + historyHTML + '</ul>' +
      (lastPractice.length ? '' : '<button type="button" class="button button-quiet" data-view="practice">Browse practice →</button>') + '</section>' +
      '<section class="settings-panel panel"><p class="eyebrow">Your course setup</p><h2>' + esc(routeNames[state.route] || routeNames.new) + '</h2>' +
      '<p>Adjust your route, focus or difficulty whenever your needs change.</p>' + routeCards(state) + preferences(state) + continueButton + '</section></aside></div>';
  }

  return { dashboard: dashboard, lesson: lesson, progress: progressPage, findLesson: findLesson, flatten: flatten };
}));
