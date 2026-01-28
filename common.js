var configJson = {
    "domainPairs": [],
    "replaceStrPairs": [],
    "jsRender": false
};
var thisTab;

var currentUrl;
var currentUrlDomain;
var currentUrlHost;
var currentProtocol;
var currentUrlPath;
var currentCharCode;

var compareUrl;
var currentEnvFlg;
var currentUrlHtml;
var compareUrlHtml;
var unregisteredUrlFlg = false;


function getConfigJson(callback) {
    var response;
    chrome.storage.sync.get(["domainPairs", "replaceStringPairs", "otherJSRender", "otherJSRenderWaitTime"], function(value) {
        response = {
            "domainPairsOption": value.domainPairs,
            "replaceStringPairsOption": value.replaceStringPairs,
            "otherOptionJSRender": value.otherJSRender,
            "otherOptionJSRenderWaitTime": value.otherJSRenderWaitTime
        };
        //console.log(response);

        var domainPairsOptionArray;
        if (response.domainPairsOption) {
            domainPairsOptionArray = response.domainPairsOption.split(/\r\n|\r|\n/);
        } else {
            domainPairsOptionArray = [];
        }

        for (var i = 0; i < domainPairsOptionArray.length; i++) {
            var domainPairArray = domainPairsOptionArray[i].split(',');
            //console.log("domainPairArray = " + domainPairArray);
            configJson.domainPairs.push({
                "production": domainPairArray[0],
                "development": domainPairArray[1]
            });
        }

        var replaceStringPairsOptionArray;
        if (response.replaceStringPairsOption) {
            replaceStringPairsOptionArray = response.replaceStringPairsOption.split(/\r\n|\r|\n/);
        } else {
            replaceStringPairsOptionArray = [];
        }
        //console.log("replaceStringPairsOptionArray = " + replaceStringPairsOptionArray);
        for (var x = 0; x < replaceStringPairsOptionArray.length; x++) {
            var replaceStringPairArray = replaceStringPairsOptionArray[x].split(',');
            configJson.replaceStrPairs.push({
                "production": replaceStringPairArray[0],
                "development": replaceStringPairArray[1]
            });
        }

        configJson.jsRender = response.otherOptionJSRender;
        configJson.jsRenderWaitTime = response.otherOptionJSRenderWaitTime;
        //console.log(configJson.jsRender);

        callback();
    });
}

function getTabObj(callback) {
    chrome.tabs.query({active: true, lastFocusedWindow: true},function(tabs) {
        thisTab = tabs[0];
        callback();
    });
}

function checkUrl(url, callback) {
    //console.log(thisTab.url);
    if (url.indexOf("http://") === 0 || url.indexOf("https://") === 0) {
        if (url.indexOf("https://chromewebstore.google.com/") === 0) {
            callback('unsupportedChromeWebStore');
        } else {
            callback();
        }
    } else {
        callback('unsupported');
    }
}

function setUrls(url, callback) {
    currentUrl = url;
    currentProtocol = url.split('/')[0]; //"http:" or "https:"
    currentUrlDomain = url.split('/')[2];
    currentUrlHost = currentProtocol + "//" + currentUrlDomain;
    console.log("currentUrlHost = " + currentProtocol + "//" + currentUrlDomain);
    currentUrlPath = currentUrl.slice(currentProtocol.length + currentUrlDomain.length + 3);
    callback();
}


function setCompareUrl(callback) {
    //ページのURLを取得して、比較対象のURLを生成
    for (var i = 0; i < configJson.domainPairs.length; i++) {
        //console.log(currentUrlHost);
        if (currentUrlHost == configJson.domainPairs[i].production) {
            currentEnvFlg = "production";
            compareUrl = configJson.domainPairs[i].development + "/" + currentUrlPath;
        } else if (currentUrlHost == configJson.domainPairs[i].development) {
            currentEnvFlg = "development";
            compareUrl = configJson.domainPairs[i].production + "/" + currentUrlPath;
        }
    }
    console.log(compareUrl);
    callback();
}

function setCharCode(callback) {
    //currentUrlの文字コードを取得
    chrome.tabs.sendMessage(thisTab.id, {
        name: 'getCharCode',
    }, function(response) {
        //console.log(response);
        if (response === undefined) {
            callback('unsupportedReload');
        } else {
            currentCharCode = response.charCode;
            callback();
        }
    });
}


function openSite() {
    async.series([ //別タブでdiff画面を開く
            function(callback) {
                chrome.tabs.create({
                    index: thisTab.index + 1,
                    url: compareUrl
                });
                callback();
            }
        ],
        function(err, results) {
            if (err) {
                throw err;
            } else {
                //console.log('series all done. ' + results);
                //$("body").html("全部おわり");
            }
        });
}

function diffSite(obj) {
    async.series([
            function(callback) {
                var compareDataJson2;

                if (obj.target === 'otherTab') {
                    compareDataJson2 = {
                        "currentTab": thisTab,
                        "currentUrl": currentUrl,
                        "compareUrl": obj.compareUrl,
                        "currentEnvFlg": null,
                        "currentCharCode": currentCharCode
                    };
                } else {
                    compareDataJson2 = {
                        "currentTab": thisTab,
                        "currentUrl": currentUrl,
                        "compareUrl": compareUrl,
                        "currentEnvFlg": currentEnvFlg,
                        "currentCharCode": currentCharCode
                    };
                }

                //比較するhtmlのデータをbachground.jsに渡す
                if (obj.from === 'contextMenu') {
                    compareDataJson = compareDataJson2;
                    callback();
                } else {
                    chrome.runtime.sendMessage({
                        name: "pathDiffData",
                        "compareDataJson": compareDataJson2
                    }, function(response) {
                        //console.log(response);
                        if (response) {
                            callback();
                        } else {
                            callback("e");
                        }
                    });
                }
            },

            function(callback) {
                //別タブでdiffを開く
                chrome.tabs.create({
                    index: thisTab.index + 1,
                    url: "diff.html"
                });
                callback();
            }
        ],
        function(err, results) {
            if (err) {
                if (err == "cannotAccessToCompareUrl") {
                    //window.alert(chrome.i18n.getMessage("popup_errorDiff") + compareUrl);
                    chrome.scripting.executeScript({
                        target: {tabId: thisTab.id},
                        args: [chrome.i18n.getMessage("popup_errorDiff") + compareUrl],
                        function: function(args){
                            alert(args);
                        }
                    });
                } else {
                    //window.alert(chrome.i18n.getMessage("popup_error"));
                    chrome.scripting.executeScript({
                        target: {tabId: thisTab.id},
                        args: [chrome.i18n.getMessage("popup_error")],
                        function: function(args){
                            alert(args);
                        }
                    });

                }
                throw err;
            } else {
                //console.log('series all done. ' + results);
            }
        });
}


function bootFromContextMenus(action) {
    async.series([
            function(callback) {
                currentUrl = null;
                currentProtocol = null;
                currentUrlDomain = null;
                currentUrlHost = null;
                currentUrlPath = null;
                currentEnvFlg = null;
                compareUrl = null;
                currentCharCode = null;
                currentUrlHtml = null;
                compareUrlHtml = null;
                unregisteredUrlFlg = false;
                callback();
            },

            function(callback) {
                getConfigJson(callback);
            },

            function(callback) {
                getTabObj(callback);
            },

            function(callback) {
                checkUrl(thisTab.url, callback);
            },

            function(callback) {
                setUrls(thisTab.url, callback);
            },

            function(callback) {
                setCompareUrl(callback);
            },

            function(callback) {
                if (currentEnvFlg == "production" || currentEnvFlg == "development") {
                    callback();
                } else {
                    unregisteredUrlFlg = true;
                    //$("#errorNote").html(chrome.i18n.getMessage("popup_errorNotRegistered"));
                    callback("unregisteredUrl");
                }
            },

            function(callback) {
                setCharCode(callback);
            },

            function(callback) {
                if (action == "open") {
                    openSite();
                    callback();
                } else if (action == "diff") {
                    diffSite({
                        target: 'otherEnv',
                        from: 'contextMenu'
                    });
                    callback();
                }
            }
        ],
        function(err, results) {
            if (err) {
                if (err == "unsupported") {
                    //window.alert(chrome.i18n.getMessage("popup_notSupported"));
                    chrome.scripting.executeScript({
                        target: {tabId: thisTab.id},
                        args: [chrome.i18n.getMessage("popup_notSupported")],
                        function: function(args){
                            alert(args);
                        }
                    });
                } else if (err === "unsupportedChromeWebStore") {
                    //window.alert(chrome.i18n.getMessage("popup_notSupported"));
                    chrome.scripting.executeScript({
                        target: {tabId: thisTab.id},
                        args: [chrome.i18n.getMessage("popup_notSupported")],
                        function: function(args){
                            alert(args);
                        }
                    });
                } else if (err === "unsupportedReload") {
                    //window.alert(chrome.i18n.getMessage("popup_doReload"));
                    chrome.scripting.executeScript({
                        target: {tabId: thisTab.id},
                        args: [chrome.i18n.getMessage("popup_doReload")],
                        function: function(args){
                            alert(args);
                        }
                    });
                } else if (err == "unregisteredUrl") {
                    //window.alert("このURLのドメインは登録されてません。\nオプション画面で商用環境と開発環境のドメインを登録してください。");
                    chrome.scripting.executeScript({
                        target: {tabId: thisTab.id},
                        args: [chrome.i18n.getMessage("contextMenu_errorNotRegistered")],
                        function: function(args){
                            alert(args);
                        }
                    });
                } else {
                    window.alert(chrome.i18n.getMessage("contextMenu_errorNotRegistered"));
                }
                throw err;
            } else {
                //console.log('series all done. ' + results);
            }
        });
}


function optionFromContextMenus() {
    async.series([
            function(callback) {
                getTabObj(callback);
            },

            function(callback) {
                chrome.tabs.create({
                    index: thisTab.index + 1,
                    url: "options.html"
                });
                callback("all");
            }
        ],
        function(err, results) {
            if (err) {
                throw err;
            }
        });
}

function sleepSetTimeout(ms, callback) {
  setTimeout(callback, ms);
}

