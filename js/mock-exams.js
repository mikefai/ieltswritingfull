/* Full-length IELTS Academic Writing mock papers. */
(function () {
  "use strict";

  var STORAGE_PREFIX = "ielts-writing:v1:fullmock:";
  var DEFAULT_SECONDS = 60 * 60;

  function escapeHTML(value) {
    return String(value == null ? "" : value).replace(/[&<>\"]/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[character];
    });
  }

  function wordCount(value) {
    var matches = String(value || "").match(/[\p{L}\p{N}][\p{L}\p{N}'\u2019-]*/gu);
    return matches ? matches.length : 0;
  }

  function readSession(exam) {
    try {
      var value = JSON.parse(localStorage.getItem(STORAGE_PREFIX + exam.id) || "null") || {};
      var answers = value.answers && typeof value.answers === "object" ? value.answers : {};
      var checks = value.checks && typeof value.checks === "object" ? value.checks : {};
      return {
        task: value.task === "2" ? "2" : "1",
        left: Number.isFinite(value.left) ? Math.max(0, Math.min(DEFAULT_SECONDS, value.left)) : DEFAULT_SECONDS,
        running: false,
        answers: { "1": typeof answers["1"] === "string" ? answers["1"] : "", "2": typeof answers["2"] === "string" ? answers["2"] : "" },
        checks: {
          "1": Array.isArray(checks["1"]) ? checks["1"] : [],
          "2": Array.isArray(checks["2"]) ? checks["2"] : []
        }
      };
    } catch (error) {
      return { task: "1", left: DEFAULT_SECONDS, running: false, answers: { "1": "", "2": "" }, checks: { "1": [], "2": [] } };
    }
  }

  function chartHTML(figure) {
    var builders = window.ChartSVG;
    if (!builders || typeof builders[figure.kind] !== "function") return "";
    return builders[figure.kind](figure);
  }

  function figuresHTML(task) {
    var figures = task.figures || (task.figure ? [task.figure] : []);
    if (!figures.length) return "";
    var parts = figures.map(function (figure) {
      return '<div class="figure-part"><div class="fig-scroll">' + chartHTML(figure) + "</div></div>";
    }).join("");
    var caption = task.figureCaption || figures.map(function (figure) { return figure.caption || ""; }).filter(Boolean).join(" ");
    return '<figure class="figure mock-figure">' + parts + "</figure>" +
      (caption ? '<p class="figure-note">' + escapeHTML(caption) + "</p>" : "");
  }

  function questionHTML(exam, taskKey) {
    var task = exam[taskKey === "1" ? "task1" : "task2"];
    var taskLabel = taskKey === "1" ? "Task 1" : "Task 2";
    var wordMinimum = taskKey === "1" ? 150 : 250;
    var minutes = taskKey === "1" ? 20 : 40;
    var prompt = taskKey === "1"
      ? '<p class="mock-prompt-copy">' + escapeHTML(task.prompt) + '</p>' + figuresHTML(task) +
        '<p class="mock-task-instruction">Summarise the information by selecting and reporting the main features, and make comparisons where relevant.</p>' +
        '<p class="mock-task-note">Use the information shown. Do not speculate about causes or add an opinion.</p>'
      : '<p class="mock-prompt-copy mock-prompt-copy--essay">' + escapeHTML(task.question) + "</p>" +
        '<p class="mock-task-instruction">' + escapeHTML(task.instruction) + "</p>";

    return '<section class="mock-question" aria-labelledby="mock-question-title">' +
      '<div class="mock-question-head"><p class="eyebrow">' + taskLabel + " · " + escapeHTML(task.kind) + "</p>" +
      '<h3 id="mock-question-title">' + escapeHTML(task.title) + "</h3></div>" +
      prompt +
      '<div class="mock-question-foot"><span>Suggested time: ' + minutes + ' minutes</span>' +
      '<span>Write at least ' + wordMinimum + ' words</span></div>' +
      "</section>";
  }

  function reviewHTML(review, examId, taskKey, checks) {
    var items = review[taskKey] || [];
    return '<details class="mock-review"><summary>Self-review checklist <span>(optional)</span></summary>' +
      '<div class="mock-checks" data-mock-checks="' + taskKey + '">' + items.map(function (item, index) {
        return '<label class="check"><input type="checkbox" data-mock-check="' + index + '"' +
          (checks[index] ? " checked" : "") + '><span>' + escapeHTML(item) + "</span></label>";
      }).join("") + "</div></details>";
  }

  function formatTime(seconds) {
    var minutes = Math.floor(seconds / 60);
    var remainder = seconds % 60;
    return (minutes < 10 ? "0" : "") + minutes + ":" + (remainder < 10 ? "0" : "") + remainder;
  }

  function create(root, exams, review) {
    var sessions = {};
    var activeIndex = 0;
    var interval = null;

    function examNow() { return exams[activeIndex]; }
    function sessionFor(exam) {
      if (!sessions[exam.id]) sessions[exam.id] = readSession(exam);
      return sessions[exam.id];
    }
    function saveSession(exam) {
      var session = sessionFor(exam);
      try {
        localStorage.setItem(STORAGE_PREFIX + exam.id, JSON.stringify({
          task: session.task,
          left: session.left,
          answers: session.answers,
          checks: session.checks
        }));
        return true;
      } catch (error) { return false; }
    }
    function hasDraft(exam) {
      var session = sessionFor(exam);
      return Boolean((session.answers["1"] || "").trim() || (session.answers["2"] || "").trim());
    }
    function renderClock() {
      var session = sessionFor(examNow());
      var output = root.querySelector("[data-mock-clock]");
      var toggle = root.querySelector('[data-mock-action="toggle"]');
      var status = root.querySelector("[data-mock-status]");
      if (!output || !toggle || !status) return;
      output.textContent = formatTime(session.left);
      output.classList.toggle("is-low", session.left > 0 && session.left <= 300);
      output.classList.toggle("is-over", session.left === 0);
      toggle.textContent = session.running ? "Pause exam" : session.left === 0 ? "Time is up" : "Start 60-minute exam";
      toggle.disabled = session.left === 0;
      status.textContent = session.left === 0
        ? "Time is up. Your saved drafts are still available for review."
        : session.running
          ? "Exam in progress. The clock continues when you switch tasks."
          : session.left === DEFAULT_SECONDS
            ? "The clock starts when you are ready. Task 1 is usually about 20 minutes; Task 2 about 40."
            : "Paused. Your answer drafts are saved on this device.";
    }
    function render() {
      var exam = examNow();
      var session = sessionFor(exam);
      var taskKey = session.task;
      var currentTask = exam[taskKey === "1" ? "task1" : "task2"];
      var minimum = taskKey === "1" ? 150 : 250;
      var isLongProcess = taskKey === "1" && exam.task1.figure && exam.task1.figure.kind === "process" &&
        exam.task1.figure.data.steps.length > 6;
      var savedAnswer = session.answers[taskKey] || "";
      var words = wordCount(savedAnswer);
      var taskReview = review[taskKey] || [];
      var done = (session.checks[taskKey] || []).filter(Boolean).length;

      root.innerHTML = '<div class="mock-console">' +
        '<header class="mock-console-head"><div class="mock-heading">' +
          '<p class="eyebrow">Ten original full-length papers · Advanced challenge</p>' +
          '<p class="mock-paper-number">Paper ' + String(activeIndex + 1).padStart(2, "0") + ' of ' + exams.length + '</p>' +
          '<h2>' + escapeHTML(exam.title) + '</h2>' +
          '<p class="mock-theme">' + escapeHTML(exam.theme) + '</p>' +
          '<div class="mock-challenge"><span>Stretch focus</span><p>' + escapeHTML(exam.challenge) + '</p></div>' +
        '</div><section class="mock-clock-card" aria-label="Full exam timer">' +
          '<p class="eyebrow">Full writing paper</p><p class="mock-clock-label">Time remaining</p>' +
          '<output class="mock-clock" data-mock-clock aria-live="off">' + formatTime(session.left) + '</output>' +
          '<p class="mock-clock-copy">60 minutes total · Task 2 contributes twice as much as Task 1.</p>' +
          '<div class="mock-clock-actions"><button type="button" class="btn btn-primary" data-mock-action="toggle">' +
            (session.running ? "Pause exam" : session.left === 0 ? "Time is up" : "Start 60-minute exam") +
          '</button><button type="button" class="btn" data-mock-action="reset">Reset clock</button></div>' +
          '<p class="mock-clock-status" data-mock-status aria-live="polite"></p>' +
        '</section></header>' +
        '<div class="mock-disclaimer">Original practice material designed as an expert-level stretch. It follows the Academic Writing timing and word-count format but is not an official IELTS paper.</div>' +
        '<section class="mock-paper-picker" aria-labelledby="mock-picker-title">' +
          '<div class="mock-picker-head"><h3 id="mock-picker-title">Choose a full exam</h3><p>Each paper has both writing tasks.</p></div>' +
          '<nav class="mock-picker" aria-label="Full mock exams">' + exams.map(function (item, index) {
            var selected = index === activeIndex;
            var drafted = hasDraft(item);
            return '<button type="button" class="mock-pick' + (selected ? " is-active" : "") + '" data-mock-exam="' + index + '"' +
              (selected ? ' aria-current="true" aria-pressed="true"' : ' aria-pressed="false"') + '>' +
              '<span class="mock-pick-number">' + String(index + 1).padStart(2, "0") + '</span>' +
              '<span class="mock-pick-title">' + escapeHTML(item.title) + '</span>' +
              '<span class="mock-pick-state">' + (drafted ? "Draft saved" : "New paper") + '</span></button>';
          }).join("") + '</nav></section>' +
        '<section class="mock-workspace" aria-label="' + escapeHTML(exam.title) + '">' +
          '<div class="mock-tabs-row"><div class="mock-tabs" role="tablist" aria-label="Exam tasks">' +
            '<button type="button" role="tab" id="mock-tab-1" aria-controls="mock-task-panel" aria-selected="' + (taskKey === "1") + '" data-mock-task="1">' +
              '<span>Writing Task 1</span><small>About 20 min · 150+ words</small></button>' +
            '<button type="button" role="tab" id="mock-tab-2" aria-controls="mock-task-panel" aria-selected="' + (taskKey === "2") + '" data-mock-task="2">' +
              '<span>Writing Task 2</span><small>About 40 min · 250+ words · double weight</small></button>' +
          '</div><p class="mock-switch-note">You may switch tasks at any time. The shared clock keeps running.</p></div>' +
          '<div class="mock-columns' + (isLongProcess ? " mock-columns--process" : "") + '" id="mock-task-panel" role="tabpanel" aria-labelledby="mock-tab-' + taskKey + '">' +
            questionHTML(exam, taskKey) +
            '<section class="mock-answer panel" aria-labelledby="mock-answer-title">' +
              '<div class="mock-answer-head"><div><p class="eyebrow">Your response · ' + (taskKey === "1" ? "Task 1" : "Task 2") + '</p>' +
                '<h3 id="mock-answer-title">Write your answer</h3></div>' +
                '<div class="mock-count"><strong data-mock-count>' + words + '</strong><span> words</span><small>minimum ' + minimum + '</small></div></div>' +
              '<div class="mock-meter" aria-hidden="true"><span data-mock-meter style="width:' + Math.min(100, words / minimum * 100) + '%"></span></div>' +
              '<label class="visually-hidden" for="mock-answer">' + escapeHTML(exam.title) + ' Writing Task ' + taskKey + ' response</label>' +
              '<textarea class="editor mock-editor" id="mock-answer" data-mock-answer spellcheck="true" placeholder="Write a connected response. Your draft saves automatically on this device.">' + escapeHTML(savedAnswer) + '</textarea>' +
              '<p class="mock-saved" data-mock-saved aria-live="polite">' + (savedAnswer ? "Draft saved on this device" : "") + '</p>' +
              '<div class="mock-review-head"><h4>Finish with a quick self-check</h4><p data-mock-review-count>' + done + ' of ' + taskReview.length + '</p></div>' +
              reviewHTML(review, exam.id, taskKey, session.checks[taskKey] || []) +
            '</section>' +
          '</div>' +
        '</section>' +
        '<p class="mock-footnote">The response editor and timing are practice tools. The course does not produce an official IELTS band score.</p>' +
      '</div>';
      renderClock();
    }

    function updateWords() {
      var textarea = root.querySelector("[data-mock-answer]");
      if (!textarea) return;
      var exam = examNow();
      var session = sessionFor(exam);
      var taskKey = session.task;
      var minimum = taskKey === "1" ? 150 : 250;
      var words = wordCount(textarea.value);
      var count = root.querySelector("[data-mock-count]");
      var meter = root.querySelector("[data-mock-meter]");
      if (count) count.textContent = words;
      if (meter) {
        meter.style.width = Math.min(100, words / minimum * 100) + "%";
        meter.classList.toggle("is-complete", words >= minimum);
      }
    }

    root.addEventListener("click", function (event) {
      var examButton = event.target.closest("[data-mock-exam]");
      if (examButton) {
        var nextIndex = Number(examButton.getAttribute("data-mock-exam"));
        if (!Number.isInteger(nextIndex) || !exams[nextIndex] || nextIndex === activeIndex) return;
        sessionFor(examNow()).running = false;
        saveSession(examNow());
        activeIndex = nextIndex;
        render();
        var activePicker = root.querySelector('[data-mock-exam="' + nextIndex + '"]');
        if (activePicker) activePicker.focus();
        return;
      }

      var taskButton = event.target.closest("[data-mock-task]");
      if (taskButton) {
        sessionFor(examNow()).task = taskButton.getAttribute("data-mock-task");
        saveSession(examNow());
        render();
        var selectedTask = root.querySelector('[data-mock-task="' + sessionFor(examNow()).task + '"]');
        if (selectedTask) selectedTask.focus();
        return;
      }

      var action = event.target.closest("[data-mock-action]");
      if (!action) return;
      var session = sessionFor(examNow());
      if (action.getAttribute("data-mock-action") === "toggle") {
        if (session.left > 0) session.running = !session.running;
      } else if (action.getAttribute("data-mock-action") === "reset") {
        session.left = DEFAULT_SECONDS;
        session.running = false;
      }
      saveSession(examNow());
      renderClock();
    });

    root.addEventListener("input", function (event) {
      if (!event.target.matches("[data-mock-answer]")) return;
      var exam = examNow();
      var session = sessionFor(exam);
      session.answers[session.task] = event.target.value;
      var persisted = saveSession(exam);
      updateWords();
      var note = root.querySelector("[data-mock-saved]");
      if (note) note.textContent = persisted ? "Draft saved on this device" : "This browser could not save the draft.";
      var selectedPaper = root.querySelector(".mock-pick.is-active .mock-pick-state");
      if (selectedPaper) selectedPaper.textContent = event.target.value.trim() ? "Draft saved" : "New paper";
    });

    root.addEventListener("change", function (event) {
      var checkbox = event.target.closest("[data-mock-check]");
      if (!checkbox) return;
      var exam = examNow();
      var session = sessionFor(exam);
      var taskKey = session.task;
      var index = Number(checkbox.getAttribute("data-mock-check"));
      session.checks[taskKey][index] = checkbox.checked;
      saveSession(exam);
      var count = root.querySelector("[data-mock-review-count]");
      if (count) count.textContent = session.checks[taskKey].filter(Boolean).length + " of " + (review[taskKey] || []).length;
    });

    interval = window.setInterval(function () {
      var session = sessionFor(examNow());
      if (!session.running || session.left <= 0) return;
      session.left -= 1;
      if (session.left === 0) session.running = false;
      if (session.left % 5 === 0 || session.left === 0) saveSession(examNow());
      renderClock();
    }, 1000);

    render();

    return {
      render: render,
      pause: function () {
        var session = sessionFor(examNow());
        session.running = false;
        saveSession(examNow());
        renderClock();
      }
    };
  }

  window.MockExams = { create: create };
})();
