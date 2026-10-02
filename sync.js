/* Sincroniza localStorage <-> API (Postgres). Si no hay backend, no hace nada
   y la app sigue funcionando con localStorage local. */
(function () {
  var PREFIX = 'neo_';
  var online = false;

  function hydrate() {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', '/api/db', false);
      xhr.send();
      if (xhr.status === 200) {
        var db = JSON.parse(xhr.responseText || '{}');
        Object.keys(db).forEach(function (key) {
          try { localStorage.setItem(key, db[key]); } catch (e) { /* noop */ }
        });
        online = true;
      }
    } catch (error) {
      online = false;
    }
  }

  hydrate();
  if (!online) return;

  var nativeSet = localStorage.setItem.bind(localStorage);
  var nativeRemove = localStorage.removeItem.bind(localStorage);

  function push(key, value) {
    try {
      fetch('/api/store/' + encodeURIComponent(key), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: value }),
      }).catch(function () {});
    } catch (error) { /* noop */ }
  }

  function remove(key) {
    try {
      fetch('/api/store/' + encodeURIComponent(key), { method: 'DELETE' }).catch(function () {});
    } catch (error) { /* noop */ }
  }

  localStorage.setItem = function (key, value) {
    nativeSet(key, value);
    if (String(key).indexOf(PREFIX) === 0) push(key, value);
  };

  localStorage.removeItem = function (key) {
    nativeRemove(key);
    if (String(key).indexOf(PREFIX) === 0) remove(key);
  };
})();
