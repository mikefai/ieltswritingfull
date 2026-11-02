/* IELTS Academic Writing — self-paced course and writing practice. */
(function () {
  "use strict";

  var DATA = null;
  var COURSE = null;
  var EXAMS = null;
  var drafts = {};
  var timers = {};
  var draftSaver = null;
  var courseProgress = null;
  var mockExams = null;

  var state = { group: "1", pos: { "1": 0, "2": 0, "3": 0 }, res: null };
  var appView = { current: "learn", lessonId: null };

  var el = {};
  var GROUPS = ["1", "2", "3"];

  /* ------------------------------------------------------------
     Storage
     ------------------------------------------------------------ */

  var PREFIX = "ielts-writing:v1:";

  function storeRead(id) {
    try {
      var raw = localStorage.getItem(PREFIX + id);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function storeWrite(id, value) {
    try {
      localStorage.setItem(PREFIX + id, JSON.stringify(value));
      return true;
    } catch (e) { return false; }
  }

  function storeClear(id) {
    try { localStorage.removeItem(PREFIX + id); } catch (e) { /* ignore */ }
  }

  function draftFor(id) {
    if (!drafts[id]) {
      var saved = storeRead(id) || {};
      drafts[id] = {
        text: typeof saved.text === "string" ? saved.text : "",
        checks: Array.isArray(saved.checks) ? saved.checks : [],
        pick: typeof saved.pick === "number" ? saved.pick : null
      };
    }
    return drafts[id];
  }

  /* ------------------------------------------------------------
     Helpers
     ------------------------------------------------------------ */

  function listFor(group) {
    return DATA.exercises.filter(function (exercise) { return exercise.task === group; });
  }

  function current() {
    return listFor(state.group)[state.pos[state.group]];
  }

  function countWords(text) {
    var matches = text.match(/[\p{L}\p{N}][\p{L}\p{N}'\u2019-]*/gu);
    return matches ? matches.length : 0;
  }

  function esc(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ------------------------------------------------------------
     Question rendering
     ------------------------------------------------------------ */

  function ladderHTML(level) {
    var rungs = "";
    for (var i = 1; i <= 5; i++) {
      rungs += '<i class="' + (i <= level ? "on" : "") + '"></i>';
    }
    return '<div class="ladder" role="img" aria-label="Difficulty level ' + level + ' of 5">' +
      '<span class="rungs" aria-hidden="true">' + rungs + "</span>" +
      '<span class="ladder-label">Level ' + level + " of 5</span></div>";
  }

  /* Task 1 instructions carry the topic and the standard rubric in one sentence;
     Task 2 carries a stock lead-in. Both are split so the topic can be set as the
     headline and the rubric read as a footnote. */
  function promptParts(exercise) {
    if (exercise.type === "1") {
      var match = exercise.instruction.match(/^([\s\S]*?)\s+(Summarise the information[\s\S]*)$/);
      if (match) return { topic: match[1], rubric: match[2] };
      return { topic: exercise.instruction, rubric: "" };
    }
    return {
      topic: exercise.question,
      rubric: exercise.instruction.replace(/^Write about the following topic\.\s*/, "")
    };
  }

  function promptHTML(exercise, number) {
    var parts = promptParts(exercise);
    return '<section class="prompt prompt--task' + exercise.type + '" role="group"' +
      ' aria-label="Question ' + number + ', writing task ' + exercise.type + '">' +
      '<div class="prompt-grid">' +
      '<p class="prompt-no" aria-hidden="true">' + number + "</p>" +
      '<div class="prompt-body">' +
      '<p class="prompt-rail"><span class="prompt-badge" aria-hidden="true">' + number + "</span>" +
      '<span class="prompt-task">Writing Task ' + exercise.type +
      '</span><span class="prompt-kind">' + esc(exercise.kind) + "</span></p>" +
      '<p class="prompt-topic">' + parts.topic + "</p>" +
      (parts.rubric ? '<p class="prompt-rubric">' + parts.rubric + "</p>" : "") +
      "</div>" +
      "</div>" +
      '<p class="prompt-foot"><span>' + exercise.minutes + " minutes</span>" +
      "<span>Write at least " + exercise.words + " words</span></p>" +
      "</section>";
  }

  function chartMarkup(figure) {
    var builders = window.ChartSVG;
    if (figure.kind === "table") return builders.table(figure);
    if (figure.kind === "pie") return builders.pie(figure);
    if (figure.kind === "line") return builders.line(figure);
    if (figure.kind === "process") return builders.process(figure);
    if (figure.kind === "map") return builders.map(figure);
    return builders.bar(figure);
  }

  function figureHTML(exercise) {
    var figures = exercise.figures || (exercise.figure ? [exercise.figure] : []);
    if (!figures.length) return "";

    var parts = figures.map(function (figure) {
      return '<div class="figure-part"><div class="fig-scroll">' +
        chartMarkup(figure) + "</div></div>";
    }).join("");

    var note = figures.length > 1 ? exercise.figureCaption : (figures[0].caption || "");
    return '<figure class="figure">' + parts + "</figure>" +
      (note ? '<p class="figure-note">' + esc(note) + "</p>" : "");
  }

  function optionMarkup(exercise, index) {
    return '<button type="button" class="quiz-opt" data-opt="' + index + '">' +
      '<span class="quiz-mark" aria-hidden="true"><b>' + String.fromCharCode(65 + index) + "</b></span>" +
      '<span class="quiz-text">' + exercise.quiz.options[index].text + "</span>" +
      "</button>";
  }

  function quizHTML(exercise) {
    return '<div class="quiz" data-quiz>' +
      '<p class="quiz-kicker">Quick check</p>' +
      '<p class="quiz-q">' + exercise.quiz.q + "</p>" +
      exercise.quiz.options.map(function (_, index) {
        return optionMarkup(exercise, index);
      }).join("") +
      "</div>";
  }

  function feedbackText(exercise, pick) {
    var chosen = exercise.quiz.options[pick];
    var correct = exercise.quiz.options.filter(function (option) { return option.ok; })[0];
    if (chosen.ok) {
      return { ok: true, html: "<b>Correct.</b> " + chosen.why };
    }
    return {
      ok: false,
      html: "<b>Not quite.</b> " + chosen.why + " The strongest answer is <q>" +
        correct.text + "</q> " + correct.why
    };
  }

  /* Applies the stored answer without re-rendering, so focus stays on the option. */
  function paintQuiz() {
    var exercise = current();
    var wrap = el.brief.querySelector("[data-quiz]");
    if (!wrap) return;

    var pick = draftFor(exercise.id).pick;
    var buttons = wrap.querySelectorAll("[data-opt]");

    Array.prototype.forEach.call(buttons, function (button, index) {
      var option = exercise.quiz.options[index];
      button.classList.remove("is-correct", "is-wrong");
      button.removeAttribute("aria-pressed");
      if (pick === null) return;
      if (option.ok) {
        button.classList.add("is-correct");
        button.setAttribute("aria-pressed", "true");
      } else if (index === pick) {
        button.classList.add("is-wrong");
        button.setAttribute("aria-pressed", "true");
      }
    });

    var existing = wrap.querySelector(".quiz-feedback");
    if (pick === null) {
      if (existing) existing.remove();
      return;
    }

    var result = feedbackText(exercise, pick);
    var feedback = existing || document.createElement("div");
    feedback.className = "quiz-feedback " + (result.ok ? "is-right" : "is-wrong");
    feedback.setAttribute("aria-live", "polite");
    feedback.innerHTML = result.html;
    if (!existing) wrap.appendChild(feedback);
  }

  function briefHTML(exercise) {
    var number = listFor(state.group).indexOf(exercise) + 1;
    var head =
      '<h2 id="briefHeading">' + exercise.title + "</h2>" +
      '<p class="source-line">' + exercise.source + "</p>" +
      (exercise.level ? ladderHTML(exercise.level) : "") +
      (exercise.harder ? '<p class="stretch-note">Harder because ' + exercise.harder + "</p>" : "");

    var body = promptHTML(exercise, number);

    if (exercise.type === "1") {
      body += figureHTML(exercise) +
        '<p class="note">Data description only: do not explain causes, and do not give an opinion.</p>' +
        quizHTML(exercise) +
        '<details class="disclosure"><summary>What the data shows</summary><ul>' +
        exercise.analysis.map(function (point) { return "<li>" + point + "</li>"; }).join("") +
        "</ul></details>";
    } else {
      body += quizHTML(exercise) +
        '<details class="disclosure"><summary>Plan before you write</summary><ol class="plan-list">' +
        exercise.plan.map(function (step) {
          return "<li><div><strong>" + step.h + "</strong><span>" + step.d + "</span></div></li>";
        }).join("") +
        "</ol></details>";
    }

    return head + body;
  }

  /* ------------------------------------------------------------
     Navigation and writing area
     ------------------------------------------------------------ */

  function renderNav() {
    var list = listFor(state.group);
    el.strip.innerHTML = list.map(function (exercise, index) {
      var active = index === state.pos[state.group];
      var number = exercise.task === "3" ? "L" + (index + 1) : exercise.task + "." + (index + 1);
      var hasDraft = draftFor(exercise.id).text.trim().length > 0;
      return '<button type="button" class="ex-btn' + (active ? " is-active" : "") + '" data-pos="' + index + '"' +
        (active ? ' aria-current="true"' : "") + ">" +
        '<span class="ex-num">' + number + "</span>" +
        "<span>" + esc(exercise.nav) + "</span>" +
        '<span class="ex-dot' + (hasDraft ? " on" : "") + '" aria-hidden="true"></span>' +
        "</button>";
    }).join("");
  }

  function updateCounts() {
    var exercise = current();
    var words = countWords(el.answer.value);
    el.wordCount.textContent = words;
    el.countUnit.textContent = "words, minimum " + exercise.words;
    el.meterFill.style.width = Math.min(100, (words / exercise.words) * 100) + "%";
    el.meterFill.style.background = words >= exercise.words ? "var(--teal)" : "var(--gold)";
    el.countWrap.classList.toggle("is-under", words > 0 && words < exercise.words);
  }

  function renderReview() {
    var exercise = current();
    var draft = draftFor(exercise.id);
    el.reviewList.innerHTML = DATA.review[exercise.type].map(function (item, index) {
      return '<label class="check"><input type="checkbox" data-check="' + index + '"' +
        (draft.checks[index] ? " checked" : "") + "><span>" + item + "</span></label>";
    }).join("");
    updateReviewProgress();
  }

  function updateReviewProgress() {
    var exercise = current();
    var draft = draftFor(exercise.id);
    var done = draft.checks.filter(Boolean).length;
    el.reviewProgress.textContent = done + " of " + DATA.review[exercise.type].length;
  }

  function renderBook() {
    var exercise = current();
    var draft = draftFor(exercise.id);
    el.answer.value = draft.text;
    el.savedNote.textContent = "";
    updateCounts();
    renderReview();
  }

  function renderBrief() {
    var exercise = current();
    el.brief.innerHTML = briefHTML(exercise);
    paintQuiz();
  }

  /* ------------------------------------------------------------
     Reference material
     ------------------------------------------------------------ */

  function modelHTML(exercise) {
    var words = exercise.model.reduce(function (total, paragraph) {
      return total + countWords(paragraph);
    }, 0);
    return '<div class="model">' +
      '<p class="model-meta">High-band model, ' + words + " words. There is no single correct answer, " +
      "so use it to compare structure and selection rather than to memorise phrases.</p>" +
      exercise.model.map(function (paragraph) { return "<p>" + paragraph + "</p>"; }).join("") +
      "</div>";
  }

  function languageHTML(exercise) {
    var groups = DATA.language[exercise.type].map(function (group) {
      return '<div class="lang"><h4>' + group.name + "</h4><dl>" +
        group.items.map(function (item) {
          return "<dt>" + item[0] + "</dt><dd>" + item[1] + "</dd>";
        }).join("") + "</dl></div>";
    }).join("");

    var own = '<div class="lang"><h4>Useful for this exercise</h4><dl>' +
      exercise.phrases.map(function (item) {
        return "<dt>" + item[0] + "</dt><dd>" + item[1] + "</dd>";
      }).join("") + "</dl></div>";

    return '<div class="lang-grid">' + groups + own + "</div>";
  }

  function guideHTML() {
    var rows = [
      ["Task achievement (Task 1) / Task response (Task 2)",
        "Fully satisfies all requirements and presents a fully developed position or a complete overview.",
        "Covers the requirements and presents a clear position or overview throughout.",
        "Addresses the requirements, but some parts are inadequately covered or unclear."],
      ["Coherence and cohesion",
        "Sequences information and ideas logically; cohesion is managed so well that it attracts no attention; paragraphing is sufficient and appropriate.",
        "Logically organises information with a clear progression; a range of cohesive devices is used appropriately.",
        "Arranges information coherently, but cohesive devices are sometimes used mechanically or inaccurately."],
      ["Lexical resource",
        "Uses a wide range fluently and flexibly; rare inaccuracies in word choice and spelling.",
        "Uses a sufficient range, with some less common vocabulary and occasional errors.",
        "Uses an adequate range; errors occur but do not impede communication."],
      ["Grammatical range and accuracy",
        "Uses a wide range of structures; the majority of sentences are error-free.",
        "Uses a variety of complex structures and produces frequent error-free sentences.",
        "Uses a mix of simple and complex sentences; some errors, but they rarely reduce clarity."]
    ];

    return '<table class="guide"><thead><tr><th scope="col">Criterion</th><th scope="col">Band 8</th>' +
      '<th scope="col">Band 7</th><th scope="col">Band 6</th></tr></thead><tbody>' +
      rows.map(function (row) {
        return '<tr><th scope="row">' + row[0] + "</th>" +
          row.slice(1).map(function (cell) { return "<td>" + cell + "</td>"; }).join("") + "</tr>";
      }).join("") +
      "</tbody><caption>Condensed from the public IELTS Writing band descriptors. Task 1 answers are " +
      "assessed on task achievement, coherence and cohesion, lexical resource, and grammatical range and " +
      "accuracy; Task 2 answers on the same four criteria, with task response in place of task achievement." +
      "</caption></table>";
  }

  function renderResources() {
    if (state.res === "model") el.resPanel.innerHTML = modelHTML(current());
    else if (state.res === "language") el.resPanel.innerHTML = languageHTML(current());
    else if (state.res === "guide") el.resPanel.innerHTML = guideHTML();
    else el.resPanel.innerHTML = "";
    el.resPanel.hidden = !state.res;

    Array.prototype.forEach.call(document.querySelectorAll("[data-res]"), function (button) {
      button.setAttribute("aria-pressed", button.getAttribute("data-res") === state.res ? "true" : "false");
    });
  }

  /* ------------------------------------------------------------
     Timer
     ------------------------------------------------------------ */

  function timerFor(exercise) {
    if (!timers[exercise.id]) {
      timers[exercise.id] = {
        total: exercise.minutes * 60,
        left: exercise.minutes * 60,
        run: false
      };
    }
    return timers[exercise.id];
  }

  function formatTime(seconds) {
    var minutes = Math.floor(seconds / 60);
    var rest = seconds % 60;
    return (minutes < 10 ? "0" : "") + minutes + ":" + (rest < 10 ? "0" : "") + rest;
  }

  function syncTimer() {
    var timer = timerFor(current());
    el.timerDigits.textContent = formatTime(timer.left);
    el.timerToggle.textContent = timer.left === 0 ? "Restart"
      : timer.run ? "Pause"
      : timer.left === timer.total ? "Start" : "Resume";
    el.timerDigits.classList.toggle("is-low", timer.left > 0 && timer.left <= 300);
    el.timerDigits.classList.toggle("is-over", timer.left === 0);
  }

  /* ------------------------------------------------------------
     Full render
     ------------------------------------------------------------ */

  function renderAll() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-task]"), function (button) {
      button.setAttribute("aria-pressed", button.getAttribute("data-task") === state.group ? "true" : "false");
    });
    var examMode = state.group === "exam";
    el.booklet.hidden = examMode;
    el.resources.hidden = examMode;
    el.mockExamRoot.hidden = !examMode;
    el.strip.hidden = examMode;
    el.timerBar.hidden = examMode;
    if (examMode) {
      mockExams.render();
      return;
    }
    renderNav();
    renderBrief();
    renderBook();
    renderResources();
    syncTimer();
  }

  /* ------------------------------------------------------------
     Events
     ------------------------------------------------------------ */

  function bindEvents() {
    el.strip.addEventListener("click", function (event) {
      var button = event.target.closest("[data-pos]");
      if (!button) return;
      draftSaver.flush();
      timerFor(current()).run = false;
      state.pos[state.group] = Number(button.getAttribute("data-pos"));
      renderAll();
      courseProgress.recordPractice(current());
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-task]"), function (button) {
      button.addEventListener("click", function () {
        var next = button.getAttribute("data-task");
        if (next === state.group) return;
        draftSaver.flush();
        if (state.group === "exam") mockExams.pause();
        else timerFor(current()).run = false;
        state.group = next;
        renderAll();
        if (next !== "exam") courseProgress.recordPractice(current());
      });
    });

    el.brief.addEventListener("click", function (event) {
      var option = event.target.closest("[data-opt]");
      if (!option) return;
      var exercise = current();
      var draft = draftFor(exercise.id);
      draft.pick = Number(option.getAttribute("data-opt"));
      storeWrite(exercise.id, draft);
      paintQuiz();
    });

    el.answer.addEventListener("input", function () {
      var exercise = current();
      var draft = draftFor(exercise.id);
      draft.text = el.answer.value;
      updateCounts();
      el.savedNote.textContent = "Saving\u2026";
      draftSaver.schedule(exercise.id, draft);
    });

    el.reviewList.addEventListener("change", function (event) {
      var box = event.target.closest("[data-check]");
      if (!box) return;
      var exercise = current();
      var draft = draftFor(exercise.id);
      draft.checks[Number(box.getAttribute("data-check"))] = box.checked;
      storeWrite(exercise.id, draft);
      updateReviewProgress();
    });

    el.clearDraft.addEventListener("click", function () {
      var exercise = current();
      if (!window.confirm("Delete your draft for \u201c" + exercise.title + "\u201d? This cannot be undone.")) return;
      draftSaver.cancel(exercise.id);
      storeClear(exercise.id);
      drafts[exercise.id] = { text: "", checks: [], pick: null };
      el.answer.value = "";
      el.savedNote.textContent = "Draft cleared";
      updateCounts();
      renderReview();
      renderNav();
      paintQuiz();
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-res]"), function (button) {
      button.addEventListener("click", function () {
        var nextResource = button.getAttribute("data-res");
        state.res = state.res === nextResource ? null : nextResource;
        renderResources();
      });
    });

    document.addEventListener("click", handleCourseClick);
    document.addEventListener("change", function (event) {
      var preference = event.target.closest("[data-pref]");
      if (!preference) return;
      var preferenceName = preference.getAttribute("data-pref");
      courseProgress.setPreference(preferenceName, preference.value);
      renderCourse();
      renderProgress();
      var preferenceRoot = appView.current === "progress" ? el.progressRoot : el.courseRoot;
      var focusedPreference = preferenceRoot.querySelector('[data-pref="' + preferenceName + '"]');
      if (focusedPreference) focusedPreference.focus();
    });

    window.addEventListener("pagehide", function () {
      draftSaver.flush();
    });

    el.timerToggle.addEventListener("click", function () {
      var timer = timerFor(current());
      if (timer.left === 0) {
        timer.left = timer.total;
        timer.run = true;
      } else {
        timer.run = !timer.run;
      }
      syncTimer();
    });

    el.timerReset.addEventListener("click", function () {
      var timer = timerFor(current());
      timer.left = timer.total;
      timer.run = false;
      syncTimer();
    });

    setInterval(function () {
      if (state.group === "exam") return;
      var timer = timerFor(current());
      if (!timer.run || timer.left <= 0) return;
      timer.left -= 1;
      if (timer.left === 0) timer.run = false;
      syncTimer();
    }, 1000);
  }

  /* ------------------------------------------------------------
     Boot
     ------------------------------------------------------------ */

  function cacheElements() {
    el.strip = document.getElementById("strip");
    el.brief = document.getElementById("brief");
    el.answer = document.getElementById("answer");
    el.wordCount = document.getElementById("wordCount");
    el.countUnit = document.getElementById("countUnit");
    el.countWrap = document.getElementById("countWrap");
    el.meterFill = document.getElementById("meterFill");
    el.savedNote = document.getElementById("savedNote");
    el.reviewList = document.getElementById("reviewList");
    el.reviewProgress = document.getElementById("reviewProgress");
    el.resPanel = document.getElementById("resPanel");
    el.timerDigits = document.getElementById("timerDigits");
    el.timerToggle = document.getElementById("timerToggle");
    el.timerReset = document.getElementById("timerReset");
    el.booklet = document.getElementById("booklet");
    el.resources = document.getElementById("resources");
    el.mockExamRoot = document.getElementById("mockExamRoot");
    el.timerBar = document.querySelector(".timer");
    el.statusSlot = document.getElementById("statusSlot");
    el.clearDraft = document.getElementById("clearDraft");
    el.learnView = document.getElementById("learnView");
    el.practiceView = document.getElementById("practiceView");
    el.progressView = document.getElementById("progressView");
    el.courseRoot = document.getElementById("courseRoot");
    el.progressRoot = document.getElementById("progressRoot");
  }

  function showStatus(title, bodyHTML) {
    var message = '<div class="status"><h2>' + title + "</h2>" + bodyHTML + "</div>";
    if (el.courseRoot) el.courseRoot.innerHTML = message;
    if (el.progressRoot) el.progressRoot.innerHTML = message;
    if (el.statusSlot) el.statusSlot.innerHTML = message;
    el.booklet.hidden = true;
    el.resources.hidden = true;
    if (el.learnView) el.learnView.hidden = false;
    if (el.practiceView) el.practiceView.hidden = true;
    if (el.progressView) el.progressView.hidden = true;
  }

  function showLoadError(error) {
    var local = location.protocol === "file:";
    showStatus("The course could not be loaded",
      "<p>" + (local
        ? "Browsers block local files from reading course data when a page is opened by double-clicking it. " +
          "Open this folder through a small web server instead:"
        : "The course or practice data could not be read (" + esc(error.message) + ").") +
      "</p><p>" + (local
        ? "run <code>python -m http.server 8000</code> in this folder, then visit " +
          "<code>http://localhost:8000</code>."
        : "Check that the data folder sits next to index.html, then reload.") + "</p>");
  }

  function syncAppNavigation() {
    Array.prototype.forEach.call(document.querySelectorAll(".app-nav [data-view]"), function (button) {
      if (button.getAttribute("data-view") === appView.current) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
  }

  function renderCourse() {
    if (!COURSE || !courseProgress) return;
    var oldOutline = el.courseRoot.querySelector(".lesson-outline-disclosure");
    var outlineWasOpen = oldOutline ? oldOutline.open : null;
    var found = appView.lessonId && window.CourseView.findLesson(COURSE, appView.lessonId);
    el.courseRoot.innerHTML = found
      ? window.CourseView.lesson(COURSE, courseProgress, DATA.exercises, appView.lessonId)
      : window.CourseView.dashboard(COURSE, courseProgress, DATA.exercises);
    var outline = el.courseRoot.querySelector(".lesson-outline-disclosure");
    if (outline) {
      outline.open = outlineWasOpen === null
        ? !window.matchMedia("(max-width: 780px)").matches
        : outlineWasOpen;
    }
  }

  function renderProgress() {
    if (!COURSE || !courseProgress) return;
    el.progressRoot.innerHTML = window.CourseView.progress(COURSE, courseProgress, DATA.exercises);
  }

  function focusViewHeading(view) {
    var target = view === "learn" ? el.courseRoot.querySelector("h1")
      : view === "progress" ? el.progressRoot.querySelector("h1")
      : state.group === "exam" ? el.mockExamRoot.querySelector("h2")
      : el.brief.querySelector("#briefHeading");
    if (!target) return;
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  }

  function showView(view, moveFocus) {
    if (["learn", "practice", "progress"].indexOf(view) < 0) return;
    if (view !== "practice" && state.group === "exam" && mockExams) mockExams.pause();
    appView.current = view;
    if (view === "learn") renderCourse();
    if (view === "progress") renderProgress();
    if (view === "practice") {
      renderAll();
      if (state.group !== "exam") courseProgress.recordPractice(current());
    }
    el.learnView.hidden = view !== "learn";
    el.practiceView.hidden = view !== "practice";
    el.progressView.hidden = view !== "progress";
    syncAppNavigation();
    if (moveFocus !== false) focusViewHeading(view);
  }

  function openCourseLesson(id) {
    var found = window.CourseView.findLesson(COURSE, id);
    if (!found) return;
    appView.lessonId = id;
    courseProgress.openLesson(id);
    showView("learn");
    window.scrollTo(0, 0);
  }

  function openPracticeExercise(id) {
    var exercise = DATA.exercises.filter(function (item) { return item.id === id; })[0];
    if (!exercise) return;
    if (state.group === "exam" && mockExams) mockExams.pause();
    state.group = exercise.task;
    var list = listFor(state.group);
    state.pos[state.group] = list.findIndex(function (item) { return item.id === exercise.id; });
    courseProgress.recordPractice(exercise);
    appView.lessonId = null;
    showView("practice");
    window.scrollTo(0, 0);
  }

  function handleCourseClick(event) {
    var viewButton = event.target.closest("[data-view]");
    if (viewButton) {
      if (viewButton.getAttribute("data-view") === "learn") appView.lessonId = null;
      showView(viewButton.getAttribute("data-view"));
      return;
    }

    var lessonButton = event.target.closest("[data-course-lesson]");
    if (lessonButton) { openCourseLesson(lessonButton.getAttribute("data-course-lesson")); return; }

    var practiceButton = event.target.closest("[data-practice-exercise]");
    if (practiceButton) { openPracticeExercise(practiceButton.getAttribute("data-practice-exercise")); return; }

    var routeButton = event.target.closest("[data-route]");
    if (routeButton) {
      var route = routeButton.getAttribute("data-route");
      courseProgress.setPreference("route", route);
      renderCourse();
      renderProgress();
      var routeRoot = appView.current === "progress" ? el.progressRoot : el.courseRoot;
      var selectedRoute = routeRoot.querySelector('[data-route="' + route + '"]');
      if (selectedRoute) selectedRoute.focus();
      return;
    }

    var levelButton = event.target.closest("[data-level]");
    if (levelButton) {
      var level = levelButton.getAttribute("data-level");
      courseProgress.setPreference("difficulty", level);
      renderCourse();
      renderProgress();
      var levelRoot = appView.current === "progress" ? el.progressRoot : el.courseRoot;
      var selectedLevel = levelRoot.querySelector('[data-level="' + level + '"]');
      if (selectedLevel) selectedLevel.focus();
      return;
    }

    var answerButton = event.target.closest("[data-checkpoint-answer]");
    if (answerButton && appView.lessonId) {
      var answerIndex = answerButton.getAttribute("data-checkpoint-answer");
      courseProgress.answerCheckpoint(appView.lessonId, Number(answerIndex));
      renderCourse();
      var selectedAnswer = el.courseRoot.querySelector('[data-checkpoint-answer="' + answerIndex + '"]');
      if (selectedAnswer) selectedAnswer.focus();
      return;
    }

    var completeButton = event.target.closest("[data-complete-lesson]");
    if (completeButton) {
      courseProgress.completeLesson(completeButton.getAttribute("data-complete-lesson"));
      renderCourse();
      renderProgress();
      focusViewHeading("learn");
    }
  }

  function init() {
    cacheElements();
    draftSaver = window.DraftSaver.create({
      write: storeWrite,
      delayMs: 500,
      onSaved: function (id, persisted) {
        if (current().id !== id) return;
        if (!persisted) {
          el.savedNote.textContent = "Could not save this draft in this browser.";
          return;
        }
        el.savedNote.textContent = "Draft saved in this browser";
        var dot = el.strip.querySelector(".ex-btn.is-active .ex-dot");
        if (dot) dot.classList.toggle("on", draftFor(id).text.trim().length > 0);
      }
    });
    el.statusSlot.innerHTML = "";
    el.booklet.hidden = false;
    el.resources.hidden = false;
    el.timerToggle.disabled = false;
    el.timerReset.disabled = false;
    courseProgress = window.CourseProgress.create();
    mockExams = window.MockExams.create(el.mockExamRoot, EXAMS, DATA.review);
    bindEvents();
    renderAll();
    renderCourse();
    renderProgress();
    showView("learn", false);
  }

  function boot() {
    cacheElements();
    showStatus("Loading the writing course\u2026", "<p>Reading lessons and practice exercises.</p>");

    function loadJSON(path) {
      return fetch(path, { cache: "no-store" }).then(function (response) {
        if (!response.ok) throw new Error(path + " returned HTTP " + response.status);
        return response.json();
      });
    }

    Promise.all([loadJSON("data/exercises.json"), loadJSON("data/course.json"), loadJSON("data/mock-exams.json")])
      .then(function (loaded) {
        DATA = loaded[0];
        COURSE = loaded[1];
        EXAMS = loaded[2].exams;
        init();
      })
      .catch(showLoadError);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
