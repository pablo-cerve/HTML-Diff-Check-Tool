window.onload = function() {
	async.series([

			function(callback) {
				//国別の文字列を入れる
				$("h1").html(chrome.i18n.getMessage("extNameShort"));
				$("#options_DNPOption").html(chrome.i18n.getMessage("options_DNPOption"));
				$("#options_DNPOptionAnnotation").html(chrome.i18n.getMessage("options_DNPOptionAnnotation"));
				$("#options_RSPOption").html(chrome.i18n.getMessage("options_RSPOption"));
				$("#options_RSPOptionAnnotation").html(chrome.i18n.getMessage("options_RSPOptionAnnotation"));

				$("#options_Other").html(chrome.i18n.getMessage("options_Other"));
				$("#options_OtherJSRengerAnnotation").html(chrome.i18n.getMessage("options_OtherJSRengerAnnotation"));
				$("#options_OtherJSRengerWaitTimeAnnotation").html(chrome.i18n.getMessage("options_OtherJSRengerWaitTimeAnnotation"));

				$("#options_OtherJSRengerWaitTimeUnit").html(chrome.i18n.getMessage("options_OtherJSRengerWaitTimeUnit"));

				$("#closeOptionsButton").val(chrome.i18n.getMessage("options_ButtonClose"));
				$("#registOptionsButton").val(chrome.i18n.getMessage("options_ButtonRegist"));

				$("#openContactLink").html(chrome.i18n.getMessage("openContactLink"));
				callback();
			},


			//chrome.storage.syncに入ってたら、それを設定する
			function(callback) {

				chrome.storage.sync.get(["domainPairs", "replaceStringPairs", "otherJSRender", "otherJSRenderWaitTime"], function(value) {
					//console.log(value);
					if (value.domainPairs) {
						$("#domainPairs").text(value.domainPairs);
					}

					if (value.replaceStringPairs) {
						$("#replaceStringPairs").text(value.replaceStringPairs);
					}

					//console.log(localStorage["otherJSrender"]);
					if (value.otherJSRender === true) {
						$("#options_OtherJSRenger").attr("checked", "true");
						$("#options_OtherJSRengerWaitTime").show();
					} else {
						$("#options_OtherJSRengerWaitTime").hide();
					}

					if (value.otherJSRenderWaitTime) {
						$("#otherJSRenderWaitSec" + value.otherJSRenderWaitTime).attr("selected", "true");
					} else {
						$("#otherJSRenderWaitSec3").attr("selected", "true");
					}
					callback();
				});
			}
		],
		function(err, results) {
			if (err) {

			} else {

			}
		}
	);
};


function registOptions() {
	var errorMessageArray = [];
	var domainPairsArray;
	var replaceStringPairsArray;

	async.series([
			//formの値が、","で区切られているかチェックする
			function(callback) {
				var nullLineFlg = false;
				var tooMuchCommaFlg = false;
				var noCommaFlg = false;
				var noProtocolFlg = false;

				var form = document.forms.mainForm;
				domainPairsArray = form.domainPairs.value.split(/\r\n|\r|\n/);
				if (domainPairsArray.length === 1 && domainPairsArray[0].trim() === '') {
					callback();
				} else {
					for (var i = 0; i < domainPairsArray.length; i++) {
						//前後の空白を削除
						domainPairsArray[i] = domainPairsArray[i].trim();

						if (i !== 0 && domainPairsArray[i] === '') {
							if(i === domainPairsArray.length - 1){
								domainPairsArray.pop();
							} else {
								nullLineFlg = true;
							}
						} else if (domainPairsArray[i].match(RegExp(',', 'g')) === null) {
							noCommaFlg = true;
						} else if (domainPairsArray[i].match(RegExp(',', 'g')).length > 1) {
							tooMuchCommaFlg = true;
						} else {
							//カンマの前後にある空白を削除
							domainPairsArray[i] = domainPairsArray[i].split(',')[0].trim() + ',' + domainPairsArray[i].split(',')[1].trim();

							var url1 = domainPairsArray[i].split(',')[0];
							var url2 = domainPairsArray[i].split(',')[1];

							if (url1.match(RegExp('http://', 'g')) === null && url1.match(RegExp('https://', 'g')) === null) {
								noProtocolFlg = true;
							}

							if (url2.match(RegExp('http://', 'g')) === null && url2.match(RegExp('https://', 'g')) === null) {
								noProtocolFlg = true;
							}

							var pIndex = url1.indexOf("//");
							var url1_new = url1.substring(0, pIndex) + "//" + url1.split('/')[2];

							pIndex = url2.indexOf("//");
							var url2_new = url2.substring(0, pIndex) + "//" + url2.split('/')[2];


							//クエリがついてたら削除
							var qIndex = url1.indexOf("?");
							if (qIndex != -1) {
								url1_new = url1.substring(0, qIndex);
							}

							qIndex = url2.indexOf("?");
							if (qIndex != -1) {
								url2new = url2.substring(0, qIndex);
							}

							//カンマの前が"/"だった場合は削除
							if (url1_new.slice(-1) == '/') {
								url1_new = url1_new.slice(0, -1);
							}

							if (url2_new.slice(-1) == '/') {
								url2_new = url2_new.slice(0, -1);
							}

							domainPairsArray[i] = url1_new + ',' + url2_new;
							//console.log("domainPairsArray[i] = " + domainPairsArray[i]);
						}
					}

					if (nullLineFlg) {
						errorMessageArray.push('+ ' + chrome.i18n.getMessage("options_errorEmptyLineInDNP"));
					} else if (tooMuchCommaFlg) {
						errorMessageArray.push('+ ' + chrome.i18n.getMessage("options_errorMultipleCommaInDNP"));
					} else if (noCommaFlg) {
						errorMessageArray.push('+ ' + chrome.i18n.getMessage("options_errorNoCommaInDNP"));
					} else if (noProtocolFlg) {
						errorMessageArray.push('+ ' + chrome.i18n.getMessage("options_errorNoProtocolInDNP"));
					}

					callback();
				}
			},


			function(callback) {
				var nullLineFlg = false;
				var tooMuchCommaFlg = false;
				var noCommaFlg = false;

				var form = document.forms.mainForm;
				replaceStringPairsArray = form.replaceStringPairs.value.split(/\r\n|\r|\n/);
				if (replaceStringPairsArray.length === 1 && replaceStringPairsArray[0].trim() === '') {
					callback();
				} else {
					for (var i = 0; i < replaceStringPairsArray.length; i++) {
						//前後の空白を削除
						replaceStringPairsArray[i] = replaceStringPairsArray[i].trim();

						if (replaceStringPairsArray[i] === '') {
							if(i === replaceStringPairsArray.length - 1){
								replaceStringPairsArray.pop();
							} else {
								nullLineFlg = true;
							}
						} else if (replaceStringPairsArray[i].match(RegExp(',', 'g')) === null) {
							noCommaFlg = true;
						} else if (replaceStringPairsArray[i].match(RegExp(',', 'g')).length > 1) {
							tooMuchCommaFlg = true;
						} else {
							//カンマの前後にある空白を削除
							replaceStringPairsArray[i] = replaceStringPairsArray[i].split(',')[0].trim() + ',' + replaceStringPairsArray[i].split(',')[1].trim();
						}
					}


					if (nullLineFlg) {
						errorMessageArray.push('+ ' + chrome.i18n.getMessage("options_errorEmptyLineInRSP"));
					} else if (tooMuchCommaFlg) {
						errorMessageArray.push('+ ' + chrome.i18n.getMessage("options_errorMultipleCommaInRSP"));
					} else if (noCommaFlg) {
						errorMessageArray.push('+ ' + chrome.i18n.getMessage("options_errorNoCommaInRSP"));
					}

					callback();
				}
			},


			//localStorageに入れるのをやめて
			//chrome.storageに入れる
			function(callback) {
				if (errorMessageArray.length === 0) {

					chrome.storage.sync.set({
						'domainPairs': domainPairsArray.join("\n")
					});
					chrome.storage.sync.set({
						'replaceStringPairs': replaceStringPairsArray.join("\n")
					});
					chrome.storage.sync.set({
						'otherJSRender': document.forms.mainForm.otherJSRender.checked
					});
					chrome.storage.sync.set({
						'otherJSRenderWaitTime': document.forms.mainForm.otherJSRenderWaitTimeSelect.selectedIndex + 1
					});
					
					callback();
				} else {
					callback('e');
				}
			}
		],
		function(err, results) {
			if (err) {
				window.alert(errorMessageArray.join('\n'));
			} else {
				if (window.confirm(chrome.i18n.getMessage("options_confirm"))) {
					chrome.tabs.query({active: true, lastFocusedWindow: true},function(tabs) {
						chrome.tabs.remove(tabs[0].id, function() {});
					});
				}
			}
		}
	);
}


document.addEventListener('DOMContentLoaded', function() {
	var closeOptionsButton = document.getElementById('closeOptionsButton');
	closeOptionsButton.addEventListener('click', function() {
		chrome.tabs.query({active: true, lastFocusedWindow: true},function(tabs) {
			chrome.tabs.remove(tabs[0].id, function(tab) {});
		});
	});



	var registOptionsButton = document.getElementById('registOptionsButton');
	registOptionsButton.addEventListener('click', function() {
		registOptions();
	});


	var options_OtherJSRenger = document.getElementById('options_OtherJSRenger');
	options_OtherJSRenger.addEventListener('change', function() {
		if (options_OtherJSRenger.checked) {
			$("#options_OtherJSRengerWaitTime").show();
		} else {
			$("#options_OtherJSRengerWaitTime").hide();
		}
	});
});