/* Local, private learning state for the IELTS Academic Writing course. */
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.CourseProgress = api;
}(typeof window !== "undefined" ? window : this, function () {
  "use strict";

  var KEY = "ielts-writing-course:v1";
  var ROUTES = ["new", "building", "timed"];
  var FOCUS = ["all", "task1", "task2", "language"];
  var LEVELS = ["guided", "core", "stretch"];

  function defaults() {
    return {
      version: 1,
      route: "new",
      focus: "all",
      difficulty: "core",
      lastLesson: null,
      completed: [],
      checkpoints: {},
      practiceHistory: []
    };
  }

  function validString(value) { return typeof value === "string" && value.length < 160; }

  function normalize(value) {
    var base = defaults();
    if (!value || value.version !== 1 || typeof value !== "object") return base;
    base.route = ROUTES.indexOf(value.route) >= 0 ? value.route : base.route;
    base.focus = FOCUS.indexOf(value.focus) >= 0 ? value.focus : base.focus;
    base.difficulty = LEVELS.indexOf(value.difficulty) >= 0 ? value.difficulty : base.difficulty;
    base.lastLesson = validString(value.lastLesson) ? value.lastLesson : null;
    base.completed = Array.isArray(value.completed)
      ? value.completed.filter(validString).slice(0, 100) : [];
    base.completed = Array.from(new Set(base.completed));
    if (value.checkpoints && typeof value.checkpoints === "object" && !Array.isArray(value.checkpoints)) {
      Object.keys(value.checkpoints).slice(0, 100).forEach(function (id) {
        var answer = value.checkpoints[id];
        if (validString(id) && Number.isInteger(answer) && answer >= 0 && answer < 10) {
          base.checkpoints[id] = answer;
        }
      });
    }
    if (Array.isArray(value.practiceHistory)) {
      base.practiceHistory = value.practiceHistory.filter(function (item) {
        return item && validString(item.id) && validString(item.title) &&
          validString(item.task) && validString(item.kind) && validString(item.openedAt);
      }).slice(0, 8);
    }
    return base;
  }

  function create(storage, now) {
    var store = storage;
    if (typeof store === "undefined") {
      try { store = typeof localStorage !== "undefined" ? localStorage : null; }
      catch (error) { store = null; }
    }
    var clock = typeof now === "function" ? now : function () { return new Date().toISOString(); };
    var state = defaults();

    try {
      var saved = store && store.getItem(KEY);
      if (saved) state = normalize(JSON.parse(saved));
    } catch (error) { state = defaults(); }

    function persist() {
      try {
        if (!store || typeof store.setItem !== "function") return false;
        store.setItem(KEY, JSON.stringify(state));
        return true;
      } catch (error) { return false; }
    }

    function copy() { return JSON.parse(JSON.stringify(state)); }

    function setPreference(name, value) {
      var allowed = name === "route" ? ROUTES : name === "focus" ? FOCUS
        : name === "difficulty" ? LEVELS : null;
      if (!allowed || allowed.indexOf(value) < 0) return false;
      state[name] = value;
      persist();
      return true;
    }

    function openLesson(id) {
      if (!validString(id)) return false;
      state.lastLesson = id;
      persist();
      return true;
    }

    function answerCheckpoint(id, answer) {
      if (!validString(id) || !Number.isInteger(answer) || answer < 0 || answer > 9) return false;
      state.checkpoints[id] = answer;
      persist();
      return true;
    }

    function completeLesson(id) {
      if (!validString(id)) return false;
      if (state.completed.indexOf(id) < 0) state.completed.push(id);
      persist();
      return true;
    }

    function recordPractice(exercise) {
      if (!exercise || !validString(exercise.id) || !validString(exercise.title)) return false;
      var item = {
        id: exercise.id,
        title: exercise.title,
        task: String(exercise.task || ""),
        kind: String(exercise.kind || "Writing task"),
        openedAt: clock()
      };
      state.practiceHistory = [item].concat(state.practiceHistory.filter(function (old) {
        return old.id !== item.id;
      })).slice(0, 8);
      persist();
      return true;
    }

    function summary(course) {
      var completed = new Set(state.completed);
      var lessons = [];
      (course && course.units || []).forEach(function (unit) {
        (unit.lessons || []).forEach(function (lesson) { lessons.push(lesson); });
      });
      return {
        completed: lessons.filter(function (lesson) { return completed.has(lesson.id); }).length,
        total: lessons.length,
        units: (course && course.units || []).map(function (unit) {
          var unitLessons = unit.lessons || [];
          return {
            id: unit.id,
            title: unit.title,
            summary: unit.summary,
            accent: unit.accent,
            completed: unitLessons.filter(function (lesson) { return completed.has(lesson.id); }).length,
            total: unitLessons.length
          };
        })
      };
    }

    function recommendedLesson(course) {
      var units = course && course.units || [];
      var preferred = state.route === "new" ? "start"
        : state.route === "timed" ? "exam"
        : state.focus === "task1" ? "task1"
        : state.focus === "task2" ? "task2"
        : state.focus === "language" ? "language" : "task1";
      var ordered = units.filter(function (unit) { return unit.id === preferred; })
        .concat(units.filter(function (unit) { return unit.id !== preferred; }));
      for (var u = 0; u < ordered.length; u += 1) {
        for (var l = 0; l < (ordered[u].lessons || []).length; l += 1) {
          if (state.completed.indexOf(ordered[u].lessons[l].id) < 0) return ordered[u].lessons[l];
        }
      }
      return state.lastLesson ? findLesson(course, state.lastLesson) : (lessonsIn(course)[0] || null);
    }

    return {
      get: copy,
      persist: persist,
      setPreference: setPreference,
      openLesson: openLesson,
      answerCheckpoint: answerCheckpoint,
      completeLesson: completeLesson,
      recordPractice: recordPractice,
      summary: summary,
      recommendedLesson: recommendedLesson,
      isComplete: function (id) { return state.completed.indexOf(id) >= 0; },
      checkpointFor: function (id) { return state.checkpoints[id]; },
      storageKey: KEY
    };
  }

  function lessonsIn(course) {
    var result = [];
    (course && course.units || []).forEach(function (unit) {
      (unit.lessons || []).forEach(function (lesson) { result.push(lesson); });
    });
    return result;
  }

  function findLesson(course, id) {
    return lessonsIn(course).filter(function (lesson) { return lesson.id === id; })[0] || null;
  }

  return { create: create, normalize: normalize, findLesson: findLesson, key: KEY };
}));
