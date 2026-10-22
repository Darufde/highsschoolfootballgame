/* Boot. */
(function () {
  'use strict';
  const FNG = window.FNG;
  const App = FNG.App;

  function boot() {
    App.changed();
    if (App.hasSave()) FNG.Win.title();
    else FNG.Win.setup();
  }

  // Keyboard shortcut: Ctrl/Cmd+S saves.
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      if (App.state) App.save();
    }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
