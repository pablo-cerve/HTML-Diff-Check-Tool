chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	var response;
	if (request.name == 'getCharCode') { //popup.jsからのメッセージ
		//console.log('getCharCode');
		response = {
			"charCode": document.charset
		};
		sendResponse(response);
	}
});