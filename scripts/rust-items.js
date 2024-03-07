// ==UserScript==
// @name         Corrosion Hour Item List To Object
// @namespace    http://tampermonkey.net/
// @version      2024-03-07
// @description  gets all the item item info from the rust item list and converts it to an object
// @author       Christian Grothaus
// @match        https://www.corrosionhour.com/rust-item-list/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=corrosionhour.com
// @grant        none
// ==/UserScript==

(function() {
  'use strict';
  const colIndexToKey = {
    0: 'displayName',
    1: 'shortname',
    2: 'itemId',
    3: 'description',
    4: 'stackSize'
  };

  window.addEventListener('load', function () {
    const tableBody = document.querySelector('#DataTables_Table_0 > tbody');
    const rows = tableBody.querySelectorAll('tr');

    const items = {};

    for (const row of rows) {
      const item = {};
      row.querySelectorAll('td').forEach((cell, index) => {
        const key = colIndexToKey[index];
        switch (key) {
          case 'displayName':
          case 'itemId':
            item[key] = cell.textContent;
            break;
        }

      });
      items[item.itemId] = item;
    }

    console.log(items);
  });
})();