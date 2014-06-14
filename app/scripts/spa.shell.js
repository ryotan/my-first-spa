/*
 * spa.shell.js
 * SPAのシェルモジュール
 */
'use strict';

spa.shell = (function() {
  var
    configMap = {
      main_html: String() +
                 '<div class="spa-shell-head">' +
                 '<div class="spa-shell-head-logo"></div>' +
                 '<div class="spa-shell-head-acct"></div>' +
                 '<div class="spa-shell-head-search"></div>' +
                 '</div>' +
                 '<div class="spa-shell-main">' +
                 '<div class="spa-shell-main-nav"></div>' +
                 '<div class="spa-shell-main-content"></div>' +
                 '</div>' +
                 '<div class="spa-shell-foot"></div>' +
                 '<div class="spa-shell-chat"></div>' +
                 '<div class="spa-shell-modal"></div>',
      chat_extend_time: 1000,
      chat_retract_time: 300,
      chat_extend_height: 450,
      chat_retract_height: 15,
      chat_extended_title: 'Click to retract',
      chat_retracted_title: 'Click to extend'
    },
    stateMap = {
      $container: null,
      is_chat_retracted: true
    },
    jqueryMap = {},

    setJqueryMap, toggleChat, onClickChat, initModule;

  setJqueryMap = function() {
    var $container = stateMap.$container;
    jqueryMap = {
      $container: $container,
      $chat: $container.find('.spa-shell-chat')
    };
  };

  // 目的：チャットスライダーの拡大や格納
  // 引数：
  //   * do_extend -- trueの場合、スライダーを拡大する。falseの場合は格納する。
  //   * callback -- アニメーションの最後に実行するオプションの関数。
  // 設定：
  //   * chat_extend_time, chat_retract_time
  //   * chat_extend_height, chat_retract_height
  // 戻り値：boolean
  //   * true -- スライダーアニメーションが開始された
  //   * false -- スライダーアニメーションが開始されなかった
  // 状態：stateMap.is_chat_retractedを設定する
  //   * true -- スライダーは格納されている
  //   * false -- スライダーは拡大されている
  //
  toggleChat = function(do_extend, callback) {
    var
      px_chat_ht = jqueryMap.$chat.height(),
      is_open = px_chat_ht === configMap.chat_extend_height,
      is_closed = px_chat_ht === configMap.chat_retract_height,
      is_sliding = !is_open && !is_closed;

    // 競合状態を避ける
    if(is_sliding) {
      return false;
    }

    // チャットスライダーの拡大開始
    if(do_extend) {
      jqueryMap.$chat.animate(
        { height: configMap.chat_extend_height },
        configMap.chat_extend_time,
        function() {
          jqueryMap.$chat.attr(
            'title', configMap.chat_extended_title
          );
          stateMap.is_chat_retracted = false;
          if(callback) {
            callback(jqueryMap.$chat);
          }
        }
      );
      return true;
    }
    // チャットスライダーの拡大終了

    // チャットスライダーの格納開始
    jqueryMap.$chat.animate(
      { height: configMap.chat_retract_height },
      configMap.chat_retract_time,
      function() {
        jqueryMap.$chat.attr(
          'title', configMap.chat_retracted_title
        );
        stateMap.is_chat_retracted = true;
        if(callback) {
          callback(jqueryMap.$chat);
        }
      }
    );
    return true;
    // チャットスライダーの格納終了
  };

  onClickChat = function(event) {
    if(toggleChat(stateMap.is_chat_retracted)) {
      $.uriAnchor.setAnchor({
        chat: (stateMap.is_chat_retracted ? 'open' : 'close')
      });
    }
    return false;
  };

  initModule = function($container) {
    // HTMLをロードし、jQueryコレクションをマッピングする
    stateMap.$container = $container;
    $container.html(configMap.main_html);
    setJqueryMap();

    // チャットスライダーを初期化し、クリックハンドラをバインドする
    stateMap.is_chat_retracted = true;
    jqueryMap.$chat
      .attr('title', configMap.chat_retracted_title)
      .click(onClickChat);
  };

  return {initModule: initModule};
}());
