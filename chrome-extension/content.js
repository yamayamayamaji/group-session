/**
 * [C]ontent [S]cripts util function
 */
$CS = {
	getManifest: function(callback){
		var url = chrome.extension.getURL('/manifest.json');
		var xhr = new XMLHttpRequest();
		xhr.onload = function(){
			callback(JSON.parse(xhr.responseText));
		};
		xhr.open('GET',url,true);
		xhr.send(null);
	}
};

STORE_KEY = {
	PREV_VERSION: 'prev_version',
	VERSION_CONFIRMED: 'version_confirmed',
	REG_QUE: 'reg_que',
	PROC_SCOPE: 'process_scope',
	SCH_DEF_GROUP: 'sch_default_group',
	MONTH_SCH_DEF_MEMBER: 'monthly_sch_default_member',
	PWEEK_SCH_DEF_MEMBER: 'personal_weekly_sch_default_member'
};

GS3Helper = {
	/**
	 * 初期処理
	 */
	init: function(){
//		var locPath = location.pathname;
		var locPath = $('form').attr('action');
console.log(locPath);
		this.retryMgr.init();
		if (locPath) {
			if (locPath.match('/main/man001.do')) {
//sessionStorage[STORE_KEY.VERSION_CONFIRMED] = '';
				//バージョン更新確認
				if (sessionStorage[STORE_KEY.VERSION_CONFIRMED] != 'true') {
					this.versionMgr.init();
				}
				this.man001();
			}
			if (locPath.match('/schedule/sch020.do')) {
				this.sch020.init();
			}
			if (locPath.match('/schedule/sch200.do')) {
				this.sch200.init();
			}
			if (locPath.match('/schedule/sch093.do')) {
				this.sch093.init();
			}
			if (locPath.match('/common/cmn999.do')) {
				this.cmn999.init();
			}
		}
	},

	/**
	 * リトライ管理オブジェクト
	 */
	retryMgr: {
		//初期化
		init: function(){
			this.cnt = {};
			this.max = { def: 10 };
		},
		//リトライ回数カウントアップ
		countUp:  function(pageId){
			return (++this.cnt[pageId] || (this.cnt[pageId] = 1));
		},
		//まだリトライするか(最大リトライ回数に達していないか)
		isRetryable: function(pageId){
			return (this.cnt[pageId] || 0) < (this.max[pageId] || this.max.def);
		}
	},

	/**
	 * バージョン管理オブジェクト
	 */
	versionMgr: {
		//初期化
		init: function(){
			this.prevVer = localStorage[STORE_KEY.PREV_VERSION];
			$CS.getManifest($.proxy(function(manifest){
				this.curVer = manifest.version;
				if (this.isUpdated()) {
					this.notifyUpdate();
					this.updatePrevVersion();
				}
			}, this));
			sessionStorage[STORE_KEY.VERSION_CONFIRMED] = 'true';
		},
		//アップデートされているか
		isUpdated: function(){
			return (!this.prevVer || (this.prevVer != this.curVer));
		},
		//以前のバージョンとして記録している情報を更新
		updatePrevVersion: function(){
			localStorage[STORE_KEY.PREV_VERSION] = this.curVer;
		},
		//更新されたのを通知
		notifyUpdate: function(){
			var txt = 'DcomGS3Helper was upgraded to ' + this.prevVer + ' (from ' + this.curVer + ')... ';
			var path = chrome.extension.getURL('/updates.txt');
			var anc = $('<a href="#" onclick="window.open(\'' + path + '\')">show details</a>').addClass('sc_ttl_sat');
			$('<div>').text(txt).append(anc)
			.css({
				fontSize: '12px',
				margin: '5px 0 5px 0',
				minHeight: '40px',
				padding: '10px',
				textAlign: 'left'
			}).appendTo($('#mainScreenListLeft') || $(document.body || document.frames[0]));
		}
	},

	/**
	 * 処理中のスコープを設定
	 */
	setProcScope: function(scope){
		sessionStorage[STORE_KEY.PROC_SCOPE] = scope;
	},
	/**
	 * 処理中のスコープをクリア
	 */
	clearProcScope: function(){
		sessionStorage.removeItem(STORE_KEY.PROC_SCOPE);
	},

	/**
	 * /main/man001.do読込時に実行
	 * ・月間スケジュール表示ボタン押下後の遷移先初期表示を [全社員]&[グループ＋所属ユーザー] に設定
 * ・月間スケジュール表示ボタン押下後の遷移先初期表示を localStorageの内容に設定
	 */
	man001: function(){
/*		var monthSchBtn = $('.btn_base1s_1'),
			schForm = $('form[name=schmainForm]');

		//対象エレメントが存在しない間は待機
		if (!monthSchBtn.length || !schForm.length) {
			if (this.retryMgr.isRetryable('man001')) {
				this.retryMgr.countUp('man001');
				setTimeout($.proxy(arguments.callee, this), 1);
			}
			return;
		}

		//月間スケジュールボタンにラッパーを設定
		monthSchBtn.wrap('<span>').parent().get(0)
		.addEventListener('click', function(){
			//月間スケジュール画面遷移時にポストするパラメータを設定
			//([全社員]&[グループ＋所属ユーザー])
			var prms = [
				{name: 'sch020SelectUsrSid', value: localStorage[STORE_KEY.MONTH_SCH_DEF_MEMBER]}
			];
			$.each(prms, function(i, prm){
				$('<input>').attr({
					type: 'hidden',
					name: prm.name,
					value: prm.value
				}).appendTo(schForm);
			});
		}, true);
*/	},

	/**
	 * /schedule/sch010.do管理オブジェクト
	 * (週間スケジュール画面)
	 */
	sch010: {
		//初期化
		init: function(){
		}
	},

	/**
	 * /schedule/sch020.do管理オブジェクト
	 * (月間スケジュール画面)
	 */
	sch020: {
		scope: 'sch020',
		//初期化
		init: function(){
			var self = this;
			if (sessionStorage[STORE_KEY.PROC_SCOPE] != this.scope) {
				this.setProcScope();
				$('select[name=sch020SelectUsrSid]').val(localStorage[STORE_KEY.MONTH_SCH_DEF_MEMBER]).change();
				return;
			}
			this.clearProcScope();

			//グループ・メンバー変更時のイベントリスナ追加
			$('select').filter('[name=sch020SelectUsrSid],[name=sch010DspGpSid]').change(function(){
				self.setProcScope();
			});
			//月移動ボタン押下時のイベントリスナ追加
			$('a:has(img)[onclick*=buttonPush][href=#]').click(function(){
				self.setProcScope();
			});
		},
		//処理スコープ設定
		setProcScope: function(){
			GS3Helper.setProcScope(this.scope);
		},
		//処理スコープ解除
		clearProcScope: function(){
			GS3Helper.clearProcScope();
		}
	},

	/**
	 * /schedule/sch200.do管理オブジェクト
	 * (個人週間スケジュール画面)
	 */
	sch200: {
		scope: 'sch200',
		//初期化
		init: function(){
			var self = this;
			if (sessionStorage[STORE_KEY.PROC_SCOPE] != this.scope) {
				this.setProcScope();
				$('select[name=sch010DspGpSid]').val(localStorage[STORE_KEY.SCH_DEF_GROUP]);
				$('select[name=sch100SelectUsrSid]').val(localStorage[STORE_KEY.PWEEK_SCH_DEF_MEMBER]).change();
				return;
			}
			this.clearProcScope();

			//グループ・メンバー変更時のイベントリスナ追加
			$('select').filter('[name=sch010DspGpSid],[name=sch100SelectUsrSid]').change(function(){
				self.setProcScope();
			});
			//月移動ボタン押下時のイベントリスナ追加
			$('a:has(img)[onclick*=buttonPush][href=#]').click(function(){
				self.setProcScope();
			});
		},
		//処理スコープ設定
		setProcScope: function(){
			GS3Helper.setProcScope(this.scope);
		},
		//処理スコープ解除
		clearProcScope: function(){
			GS3Helper.clearProcScope();
		}
	},

	/**
	 * /schedule/sch093.do管理オブジェクト
	 * (グループメンバー表示設定画面)
	 */
	sch093: {
		//初期化
		init: function(){
			var self = this;
			this.$defGrp = $('select[name=sch093DefGroup]');
			this.createContainer();
			//メンバーセレクトボックスを表示
			this.setMemberSelector(this.getGpSid());
			//グループ変更時のイベントリスナ追加
			this.$defGrp.change(function(){
				self.setMemberSelector(this.value);
			});
			//OKボタン押下時のイベントリスナ追加
			$('.btn_ok1').click(function(){
				var q = {};
				q[STORE_KEY.SCH_DEF_GROUP] = self.$defGrp.val();
				q[STORE_KEY.MONTH_SCH_DEF_MEMBER] = self.$defMonthMbr.val();
				q[STORE_KEY.PWEEK_SCH_DEF_MEMBER] = self.$defPWeekMbr.val();
				sessionStorage[STORE_KEY.REG_QUE] = JSON.stringify(q);
			});
		},
		//グループID取得
		getGpSid: function(){
			return this.$defGrp.val();
		},
		//コンテナ作成
		createContainer: function(){
			var grp_tr = $('select[name=sch093DefGroup]').closest('tr');
			var mbr_tr = grp_tr.clone()
							.find('.text_bb1').text('デフォルト表示メンバー').end()
							.find('.text_r2').remove().end()
							.find('td:eq(1)').empty().end()
							.insertAfter(grp_tr);
			this.$mbrContainer = mbr_tr.find('td:eq(1)');
		},
		//メンバーセレクトボックスを表示
		setMemberSelector: function(gpId){
			var params = [{
				url: 'sch020.do',
				key: STORE_KEY.MONTH_SCH_DEF_MEMBER,
				selName: 'sch020SelectUsrSid',
				selProp: '$defMonthMbr',
				label: '月間：'
			}, {
				url: 'sch200.do',
				key: STORE_KEY.PWEEK_SCH_DEF_MEMBER,
				selName: 'sch100SelectUsrSid',
				selProp: '$defPWeekMbr',
				label: '個人週間：'
			}];
			$.each(params, $.proxy(function(i, p){
				var mbrId = this[p.selProp] ? this[p.selProp].val() : null;
				$.post('../schedule/' + p.url, { sch010DspGpSid: gpId }, $.proxy(function(res){
					var tmp = sessionStorage[STORE_KEY.REG_QUE] ? JSON.parse(sessionStorage[STORE_KEY.REG_QUE])[p.key] : null;
					var def = mbrId || tmp || localStorage[p.key] || '';
					var sel = $(res).find('select[name=' + p.selName + ']')
								.removeAttr('onchange').unbind().val(def);
					if (this[p.selProp]) { this[p.selProp].parent().remove(); }
					this[p.selProp] = sel;

					var label = $('<span>').text(p.label).addClass('text_bb1')
								.css({width: '80px', display: 'inline-block', textAlign: 'right', paddingRight: '5px'});
					$('<div>').appendTo(this.$mbrContainer).append(sel);
					sel.before(label).after('<br>');
				}, this));
			}, this));
		}
	},

	/**
	 * common/cmn999.do管理オブジェクト
	 * (登録/更新 確認画面)
	 */
	cmn999: {
		//初期化
		init: function(){
			//OKボタン押下時のイベントリスナ追加
			$('.btn_ok1').click(function(){
				//前画面で登録待ちの値がsessionStorageに保持されている場合は
				//それらをlocalStorageに保存する
				if (sessionStorage[STORE_KEY.REG_QUE]) {
					var q = JSON.parse(sessionStorage[STORE_KEY.REG_QUE]);
					$.each(q, function(k, v){
						localStorage[k] = v;
					});
					sessionStorage.removeItem(STORE_KEY.REG_QUE);
				}
			});
		}
	}
};

$(function(){GS3Helper.init()});
