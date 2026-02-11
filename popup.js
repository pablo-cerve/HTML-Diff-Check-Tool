var tabsArray = [];

window.onload = function() {

    async.series([
            function(callback) {
                $("#h2-1").html(chrome.i18n.getMessage("popup_header1"));
                $("#h2-2").html(chrome.i18n.getMessage("popup_header2"));
                $("#h2-promo").prepend('<i class="fab fa-pagelines"></i> ' + chrome.i18n.getMessage("popup_headerPromo"));
                $("#promo-close").append(' ' + chrome.i18n.getMessage("popup_headerPromo_close"));
                $("#openOptionsLinkText").html(chrome.i18n.getMessage("popup_options"));

                $("#main").hide();
                $("#regularDiv").hide();
                $("#openOptionsNote").hide();
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
                setUrls(thisTab.url,callback);
            },

            function(callback) {
                //開いているタブの一覧を取得
                // only get the tabs in the current window
                chrome.tabs.query({currentWindow: true}, function(tabs) {

                    //現在のurlと文字列の重なりの量を見る。
                    for (var i = 0; i < tabs.length; i++) {
                        if (currentUrlDomain == tabs[i].url.split('/')[2] && !tabs[i].active) {
                            tabs[i].sameDomain = true;
                            tabsArray.push(tabs[i]);
                        } else {
                            tabs[i].sameDomain = false;
                        }
                    }

                    for (var i2 = 0; i2 < tabs.length; i2++) {
                        if (!tabs[i2].sameDomain && !tabs[i2].active) {
                            tabsArray.push(tabs[i2]);
                        }
                    }
                    console.log(tabsArray);
                    callback();
                });
            },

            function(callback) {
                //タブ一覧のhtmlを作る
                for (var i = 0; i < tabsArray.length; i++) {
                    if (tabsArray[i].url.indexOf('https://') === 0 || tabsArray[i].url.indexOf('http://') === 0) {
                        var tabDiv = '<div class="tabDiv">';
                        tabDiv += '<div class="tabTitleDiv">';
                        tabDiv += '<div class="tabImgDiv"><img src="' + tabsArray[i].favIconUrl + '"></div>';
                        tabDiv += tabsArray[i].title + '</div>';
                        tabDiv += '<div class="tabUrlDiv">' + tabsArray[i].url + '</div>';
                        tabDiv += '<div class="clear"></div></div>';
                        $("#tabsDiv").append(tabDiv);
                    }
                }
                callback();
            },

            function(callback) {
                setCompareUrl(callback);
            },

            function(callback) {
                if (currentEnvFlg == "production" || currentEnvFlg == "development") {
                    $("#regularDiv").show();
                    $("#openSiteButton").blur();
                    $("#errorDiv").hide();
                    $("#openOptionsNote").hide();
                    //console.log('series all done. ' + results);
                    //$("body").html("全部おわり");
                    callback();
                } else {
                    unregisteredUrlFlg = true;
                    $("#regularDiv").hide();
                    $("#errorNote").html(chrome.i18n.getMessage("popup_errorNotRegistered"));
                    $("#errorDiv").show();
                    $("#openOptionsLink").blur();
                    $("#openOptionsNote").show();
                    callback();
                }
            },


            function(callback) {
                setCharCode(callback);
            },

            function(callback) {
                if (!unregisteredUrlFlg && currentEnvFlg == "production") {
                    $('#envTitle').html(chrome.i18n.getMessage("popup_compareWithDev"));
                } else if (!unregisteredUrlFlg && currentEnvFlg == "development") {
                    $('#envTitle').html(chrome.i18n.getMessage("popup_compareWithPro"));
                }
                callback();
            },


            function(callback) {
                //おすすめの拡張機能を紹介するhtmlを作る
                var promoDiv = '<div class="promoDiv">';
                promoDiv += '<div class="tabTitleDiv">';
                promoDiv += '<div class="tabImgDiv"><img src="promo/128.png"></div>';
                promoDiv += chrome.i18n.getMessage("popup_promo_title") + '</div>';
                promoDiv += '<div class="promoDescDiv">' + chrome.i18n.getMessage("popup_promo_desc1") + '</div>';
                promoDiv += '<div class="promoDescDiv">' + chrome.i18n.getMessage("popup_promo_desc2") + '</div>';
                promoDiv += '<div class="clear"></div></div>';
                $("#promoDiv").append(promoDiv);

                //表示頻度などをここで制御
                //一度閉じるボタンを押したら表示しない
                var promo_close_buttons_Flg = false;
                chrome.storage.sync.get(["promo_close_button_flg"], function(value) {
                    if (value.promo_close_button_flg === true) {
                        promo_close_buttons_Flg = true;
                    }
                    var promoDate = new Date();
                    if (window.navigator.language.indexOf('ja') === -1 || promo_close_buttons_Flg) {
                        $("#promoDiv").hide();
                        $("#h2-promo").hide();
                    } else if (promoDate.getSeconds() % 3 !== 0) {
                        $("#promoDiv").hide();
                        $("#h2-promo").hide();
                    }
                    callback();
                });
            }


        ],
        function(err, results) {
            if (err) {
                if (err === "unsupported") {
                    $("#errorNote").html('<div id="errorMsg" class="unsupported">' + chrome.i18n.getMessage("popup_notSupported") + '</div>');

                } else if (err === "unsupportedChromeWebStore") {
                    $("#errorNote").html('<div id="errorMsg" class="unsupported">' + chrome.i18n.getMessage("popup_notSupported") + '<br>' + chrome.i18n.getMessage("popup_tryOtherPage") + '</div>');

                } else if (err === "unsupportedReload") {
                    $("#errorNote").html('<div id="errorMsg" class="unsupported">' + chrome.i18n.getMessage("popup_doReload") + '</div>');
                    $("#regularDiv").hide();
                    $("#promoDiv").hide();
                    $("#tabsDiv").hide();
                }

                $("#errorDiv").show();
                $("#openOptionsNote").show();
                $("#h2-1").hide();
                $("#h2-2").hide();
                $("#h2-promo").hide();

                $("#openOptionsNote").hide();
            }

            //setTimeout('$("#main").show()', 50);
            $("#main").show();
            $("#openStoreLink").blur();
        });
};



document.addEventListener('DOMContentLoaded', function() {
    var openSiteButton = document.getElementById('openSiteButton');
    openSiteButton.addEventListener('click', function() {
        openSite();
    });

    var diffSiteButton = document.getElementById('diffSiteButton');
    diffSiteButton.addEventListener('click', function() {
        diffSite({
            target: 'otherEnv'
        });
    });


});

$(document).on("click", ".tabDiv", function() {
    //console.log($(this).find('.tabUrlDiv').text());
    diffSite({
        target: 'otherTab',
        compareUrl: $(this).find('.tabUrlDiv').text()
    });
});

$(document).on("click", ".promoDiv", function() {
    chrome.tabs.query({active: true, lastFocusedWindow: true},function(tabs) {
        chrome.tabs.create({
            index: tabs[0].index + 1,
            url: "https://chromewebstore.google.com/detail/melcjmapbnbppalonglljkadkemjajjf?utm_source=htmldiff-extention"
        });
    });
});

$(document).on("click", "#promo-close", function() {
    $("#promoDiv").hide();
    $("#h2-promo").hide();
    chrome.storage.sync.set({
        'promo_close_button_flg': true
    });
});