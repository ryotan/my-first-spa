/*
 * spa.js
 * ルート名前空間モジュール
 */
'use strict';

var spa = (function() {
  var initModule = function($container) {
    spa.shell.initModule($container);
  };

  return {initModule: initModule};
}());
