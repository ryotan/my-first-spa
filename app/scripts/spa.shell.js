/*
 * spa.shell.js
 * SPAのシェルモジュール
 */
'use strict';

spa.shell = (function() {
  var
    configMap = {
      anchor_schema_map: {
        chat: {open: true, closed: true}
      },
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
      anchor_map: {},
      is_chat_retracted: true
    },
    jqueryMap = {},

    copyAnchorMap, setJqueryMap, toggleChat,
    changeAnchorPart, onHashchange,
    onClickChat, initModule;

  // 格納したアンカーマップのコピーを返す。オーバーヘッドを最小限にする。
  copyAnchorMap = function() {
    return $.extend(true, {}, stateMap.anchor_map);
  };

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

  // 目的：URIアンカー要素部分を変更する
  // 引数：
  //   * arg_map -- 変更したいURIアンカー部分を表すマップ
  // 戻り値：boolean
  //   * true -- URIのアンカー部分が変更された
  //   * false -- URIのアンカー部分を変更できなかった
  // 動作：
  // 現在のアンカーをstateMap.anchor_mapに格納する。
  // エンコーディングの説明はuriAnchorを参照。
  // このメソッドは
  //   * copyAnchorMap()を使ってこのマップのコピーを作成する。
  //   * arg_mapを使ってキーバリューを修正する。
  //   * エンコーディングの独立値と従属値の区別を管理する。
  //   * uriAnchorを使ってURIの変更を試みる。
  //   * 成功時にはtrue、失敗時にはfalseを返す。
  changeAnchorPart = function(arg_map) {
    var
      anchor_map_revise = copyAnchorMap(),
      bool_return = true,
      key_name, key_name_dep;

    // アンカーマップへ変更を統合開始
    for(key_name in arg_map) {
      if(arg_map.hasOwnProperty(key_name)) {
        // 反復中に従属キーを飛ばす
        if(key_name.indexOf('_') === 0) { continue; }

        // 独立キー値を更新する
        anchor_map_revise[key_name] = arg_map[key_name];

        // 合致する独立キーを更新する
        key_name_dep = '_' + key_name;
        if(arg_map[key_name_dep]) {
          anchor_map_revise[key_name_dep] = arg_map[key_name_dep];
        } else {
          delete anchor_map_revise[key_name_dep];
          delete anchor_map_revise['_s' + key_name_dep];
        }
      }
    }
    // アンカーマップへ変更を統合終了

    // URIの更新開始。成功しなければ元に戻す。
    try {
      $.uriAnchor.setAnchor(anchor_map_revise);
    } catch(error) {
      // URIを既存の状態に置き換える
      $.uriAnchor.setAnchor(stateMap.anchor_map, null, true);
      bool_return = false;
    }
    // URIの更新終了
    return bool_return;
  };

  // 目的：hashchangeイベントを処理する
  // 引数：
  //   * event -- jQueryイベントオブジェクト
  // 設定：なし
  // 戻り値：false
  // 動作：
  //   * URIアンカー要素を解析する。
  //   * 提示されたアプリケーション状態と現在の状態を比較する。
  //   * 提示された状態が既存の状態と異なる場合のみアプリケーションを調整する。
  //
  onHashchange = function(event) {
    var
      anchor_map_previous = copyAnchorMap(),
      anchor_map_proposed,
      _s_chat_previous, _s_chat_proposed,
      s_chat_proposed;

    // アンカーの解析を試みる
    try {
      anchor_map_proposed = $.uriAnchor.makeAnchorMap();
    } catch(error) {
      $.uriAnchor.setAnchor(anchor_map_previous, null, true);
      return false;
    }
    stateMap.anchor_map = anchor_map_proposed;

    // 便利な変数
    _s_chat_previous = anchor_map_previous._s_chat;
    _s_chat_proposed = anchor_map_proposed._s_chat;

    // 変更されている場合のチャットコンポーネントの調整開始
    if(!anchor_map_previous || _s_chat_previous !== _s_chat_proposed) {
      s_chat_proposed = anchor_map_proposed.chat;
      switch(s_chat_proposed) {
        case 'open':
          toggleChat(true);
          break;
        case 'closed':
          toggleChat(false);
          break;
        default:
          toggleChat(false);
          delete anchor_map_proposed.chat;
          $.uriAnchor.setAnchor(anchor_map_proposed, null, true);
      }
    }
    // 変更されている場合のチャットコンポーネントの調整終了

    return false;
  };

  onClickChat = function(event) {
    changeAnchorPart({
      chat: (stateMap.is_chat_retracted ? 'open' : 'closed')
    });
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

    // 我々のスキーマを使うようにuriAnchorを設定する
    $.uriAnchor.configModule({
      schema_map: configMap.anchor_schema_map
    });

    // URIアンカー変更イベントを処理する。
    // これは全ての機能モジュールを設定して初期化した後に行う。
    // そうしないと、トリガーイベントを処理できる状態になっていない。
    // トリガーイベントはアンカーがロード状態とみなせることを保証するために使う。
    //
    $(window)
      .bind('hashchange', onHashchange)
      .trigger('hashchange');
  };

  return {initModule: initModule};
}());
