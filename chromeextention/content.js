GS3Helper = {
	retry: {},

	/**
	 * 初期処理
	 */
	init: function(){
		if (location.pathname.match('/main/man001.do')) {
			this.man001();
		}
	},

	/**
	 * /main/man001.do読込時に実行。
	 * ・月間スケジュール表示ボタン押下後の遷移先初期表示を [全社員]&[グループ＋所属ユーザー] に設定
	 */
	man001: function(){
		var maxRetry = 10;
		var monthSchBtn = $('.btn_base1s_1'),
			schForm = $('form[name=schmainForm]');

		//対象エレメントが存在しない間は待機
		if (!monthSchBtn.length || !schForm.length) {
			this.retry['man001']
			setTimeout(arguments.callee, 300);
			return;
		}

		//月間スケジュールボタンにラッパーを設定
		monthSchBtn.wrap('<span>').parent().get(0)
		.addEventListener('click', function(){
			//月間スケジュール画面遷移時にポストするパラメータを設定
			//([全社員]&[グループ＋所属ユーザー])
			var prms = [
				{name: 'sch010DspGpSid', value: '5'},
				{name: 'sch020SelectUsrSid', value: '-2'}
			];
			$.each(prms, function(i, prm){
				$('<input>').attr({
					type: 'text',
					name: prm.name,
					value: prm.value
				}).appendTo(schForm);
			});
		}, true);
	}
};
GS3Helper.init();
