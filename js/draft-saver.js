(function (root, factory) {
  "use strict";

  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.DraftSaver = api;
  }
}(typeof window !== "undefined" ? window : this, function () {
  "use strict";

  function create(options) {
    options = options || {};
    if (typeof options.write !== "function") {
      throw new TypeError("DraftSaver.create requires a write function");
    }

    var write = options.write;
    var onSaved = typeof options.onSaved === "function" ? options.onSaved : function () {};
    var delay = typeof options.delayMs === "number" ? options.delayMs : 500;
    var startTimer = options.setTimeout || setTimeout;
    var stopTimer = options.clearTimeout || clearTimeout;
    var pending = null;

    function flush() {
      if (!pending) return false;

      var item = pending;
      pending = null;
      if (item.timer !== null) stopTimer(item.timer);
      var persisted = write(item.id, item.draft) !== false;
      onSaved(item.id, persisted);
      return true;
    }

    function schedule(id, draft) {
      if (pending && pending.id !== id) flush();
      if (pending && pending.timer !== null) stopTimer(pending.timer);

      var item = { id: id, draft: draft, timer: null };
      pending = item;
      item.timer = startTimer(function () {
        if (pending === item) flush();
      }, delay);
    }

    function cancel(id) {
      if (!pending || pending.id !== id) return false;
      if (pending.timer !== null) stopTimer(pending.timer);
      pending = null;
      return true;
    }

    return {
      schedule: schedule,
      flush: flush,
      cancel: cancel
    };
  }

  return { create: create };
}));
