var compareDataJson = {};
/* 下記のデータを含む
currentTab;
currentUrl;
compareUrl;
currentEnvFlg;
*/

var currentUrlHtml;
var compareUrlHtml;

var leftUrlHtml;
var rightUrlHtml;
var leftUrl;
var rightUrl;

var successGetComparUrl = false;

var charCode;



window.onload = function() {

    async.series([
            function(callback) {
                $("#JSRenderWaiting").hide();
                $('#annotation').css("visibility", "hidden");
                $('#htmlLeftTitle').css("visibility", "hidden");
                $('#htmlRightTitle').css("visibility", "hidden");

                //国別の文字列を入れる
                $("#diff_annotation1").html(chrome.i18n.getMessage("diff_annotation1"));
                $("#diff_annotation2_1").html(chrome.i18n.getMessage("diff_annotation2_1"));
                $("#openOptionsLink").html(chrome.i18n.getMessage("diff_annotation2_2"));
                $("#diff_annotation2_3").html(chrome.i18n.getMessage("diff_annotation2_3"));

                $("#openContactLink").html(chrome.i18n.getMessage("openContactLink"));
                $("#diff_mergely1_1").html(chrome.i18n.getMessage("diff_mergely1_1"));
                $("#diff_mergely1_2").html(chrome.i18n.getMessage("diff_mergely1_2"));
                callback();
            },

            function(callback) {
                //設定を取得
                getConfigJson(callback);
            },

            function(callback) {
                //tabのオブジェクトを取得
                getTabObj(callback);
            },

            function(callback) {
                //JSRenderがONになっている場合は、待ち時間を表示する
                if (configJson.jsRender !== true) {
                    callback();
                } else {
                    $("#JSRenderWaitingSec").html(configJson.jsRenderWaitTime + ' sec');
                    $("#JSRenderWaiting").show();
                    countdown(configJson.jsRenderWaitTime);
                    callback();
                }
            },


            function(callback) {
                //比較するhtmlのデータをbachground.jsから貰う
                chrome.runtime.sendMessage({
                    name: "sendDiffData"
                }, function(response) {
                    //console.log(response);
                    compareDataJson = response.compareDataJson;
                    callback();
                });
            },

            function(callback) {
                //charCodeを設定する
                charCode = "text/plain; charset=" + compareDataJson.currentCharCode;
                callback();
            },

            function(callback) {
                if (compareDataJson.currentEnvFlg) {
                    $('#annotation').css("visibility", "visible");
                    $("#diff_production").html(chrome.i18n.getMessage("diff_production"));
                    $("#diff_development").html(chrome.i18n.getMessage("diff_development"));
                } else {
                    $("#diff_production").html(chrome.i18n.getMessage("diff_currentTab"));
                    $("#diff_development").html(chrome.i18n.getMessage("diff_otherTab"));
                }
                callback();
            },

            function(callback) {

                if (configJson.jsRender !== true) { //JS描画のhtmlソースは比較しない場合(default)
                    //まず現在のページのhtmlソースを取得
                    //普通にxmlHttpRequestで取得するやり方
                    var xhr = new XMLHttpRequest();
                    xhr.onload = function() {
                        if (this.readyState == 4 && this.status == 200) {
                            currentUrlHtml = this.response;
                            callback();
                        } else {
                            callback("e");
                        }
                    };
                    var now = new Date();
                    if (compareDataJson.currentUrl.indexOf("?") != -1) {
                        xhr.open('GET', compareDataJson.currentUrl + '&tenbintimestamp' + now.getTime() + '=' + now.getTime(), true);
                    } else {
                        xhr.open('GET', compareDataJson.currentUrl + '?tenbintimestamp' + now.getTime() + '=' + now.getTime(), true);
                    }
                    xhr.overrideMimeType(charCode);
                    xhr.responseType = 'text';
                    xhr.send();

                } else { ////JS描画のhtmlソースは比較する場合
                    var completeGettingCurrentUrlHtml = false;
                    var completeGettingCompareUrlHtml = false;

                    chrome.runtime.onMessage.addListener(function(request, sender) {
                        if (request.action == "getSourceIncludeJSRenderOfCurrent") {
                            currentUrlHtml = request.source;
                            completeGettingCurrentUrlHtml = true;
                            //console.log("completeGettingCurrentUrlHtml = " + completeGettingCurrentUrlHtml);
                            if (completeGettingCompareUrlHtml === true) { //反対側が終わってたら callback
                                callback();
                            }
                        }
                    });

                    var tmpCurrentTabId = parseInt(compareDataJson.currentTab.id);
                    sleepSetTimeout(configJson.jsRenderWaitTime * 1000, () => getCompareUrlHtml(tmpCurrentTabId, "getpagesrc_current.js", "callback()"));
                    

                    //JS描画のhtmlを取得する場合は、待ち時間の短縮のため、ここで比較対象のページも一緒に処理。
                    //描画のため別タブで開く。
                    var compareUrlNewTabId;
                    chrome.runtime.onMessage.addListener(function(request, sender) {
                        if (request.action == "getSourceIncludeJSRenderOfCompare") {
                            compareUrlHtml = request.source;
                            completeGettingCompareUrlHtml = true;
                            //console.log("completeGettingCompareUrlHtml = " + completeGettingCompareUrlHtml);
                            chrome.tabs.remove(compareUrlNewTabId, function(tab) {
                                if (completeGettingCurrentUrlHtml === true) { //反対側が終わってたら callback
                                    callback();
                                }
                            });
                        }
                    });

                    chrome.tabs.create({
                        url: compareDataJson.compareUrl,
                        index: thisTab.index + 1,
                        active: false
                    }, function(tab) {
                        compareUrlNewTabId = tab.id;
                    });                     

                    chrome.tabs.onUpdated.addListener(function(tabid, info) {
                        if (tabid == compareUrlNewTabId && info.status == "complete") {
                            sleepSetTimeout(configJson.jsRenderWaitTime * 1000, () => getCompareUrlHtml(compareUrlNewTabId, "getpagesrc_compare.js", "callback()"));
                        }
                    });
                }
            },

            function(callback) {
                //次に比較対象のページのhtmlソースを取得
                if (configJson.jsRender !== true) { //JS描画のhtmlソースは比較しない場合(default)
                    var xhr = new XMLHttpRequest();
                    xhr.onload = function() {
                        //console.log(this);
                        if (this.readyState == 4 && this.status == 200) {
                            compareUrlHtml = this.response;
                            successGetComparUrl = true;
                            callback();
                        } else {
                            callback("cannotAccessToCompareUrl");
                        }
                    };
                    var now = new Date();
                    if (compareDataJson.compareUrl.indexOf("?") != -1) {
                        xhr.open('GET', compareDataJson.compareUrl + '&tenbintimestamp' + now.getTime() + '=' + now.getTime(), true);
                    } else {
                        xhr.open('GET', compareDataJson.compareUrl + '?tenbintimestamp' + now.getTime() + '=' + now.getTime(), true);
                    }
                    xhr.overrideMimeType(charCode);
                    xhr.responseType = 'text';
                    xhr.send();
                } else { ////JS描画のhtmlソースは比較する場合
                    //一つ前のところで一緒に取得
                    successGetComparUrl = true;
                    callback();
                }
            },

            function(callback) {
                //開発環境のページのhtmlの中で、画像やCSSのURLなど比較に邪魔なものを置換
                for (var i = 0; i < configJson.replaceStrPairs.length; i++) {
                    if (compareDataJson.currentEnvFlg == "production") {
                        compareUrlHtml = compareUrlHtml.replace(new RegExp(configJson.replaceStrPairs[i].development, 'g'), configJson.replaceStrPairs[i].production);
                    } else if (compareDataJson.currentEnvFlg == "development") {
                        currentUrlHtml = currentUrlHtml.replace(new RegExp(configJson.replaceStrPairs[i].development, 'g'), configJson.replaceStrPairs[i].production);
                        //検証環境に商用URLが入っているケースはあるので、
                        //そこについては、検証環境URLに変換して差分チェックのノイズを減らす
                        //currentUrlHtml = currentUrlHtml.replace(new RegExp(configJson.replaceStrPairs[i].production, 'g'), configJson.replaceStrPairs[i].development);
                    }
                }

                callback();
            },

            function(callback) {

                //左にはいつでも本番環境を、右にはいつでも開発環境を入れる
                //別タブとの比較の場合は、左が現在、右が別タブ
                if (compareDataJson.currentEnvFlg == "production") {
                    leftUrlHtml = currentUrlHtml;
                    rightUrlHtml = compareUrlHtml;
                } else if (compareDataJson.currentEnvFlg == "development") {
                    leftUrlHtml = compareUrlHtml;
                    rightUrlHtml = currentUrlHtml;
                } else {
                    leftUrlHtml = currentUrlHtml;
                    rightUrlHtml = compareUrlHtml;
                }

                //Pretty print the HTML before comparison
                leftUrlHtml = prettyPrintHtml(leftUrlHtml);
                rightUrlHtml = prettyPrintHtml(rightUrlHtml);

                //windowサイズを取得する
                //console.log($(window).width());

                var margelyWidth = $(window).width() * 0.9;
                if (margelyWidth < 1200) {
                    margelyWidth = 1200;
                }
                $("#container").css("width", margelyWidth);
                $("#container").css("margin", '5px auto');
                $("#htmlLeftTitle").css("width", margelyWidth / 2);
                $("#htmlLeftTitleUrl").css("width", margelyWidth / 2 - 10);

                var margelyHeight = $(window).height() * 0.75;
                if (margelyHeight < 600) {
                    margelyHeight = 600;
                }

                //mergelyに渡してhtmlを描画する
                $(document).ready(function() {
                    $('#compare').mergely({
                        width: margelyWidth,
                        height: margelyHeight,
                        cmsettings: {
                            readOnly: true
                        },
                        lhs: function(setValue) {
                            setValue(leftUrlHtml);
                        },
                        rhs: function(setValue) {
                            setValue(rightUrlHtml);
                        },
                        loaded: function() {
                            callback();
                        }
                    });
                });
            },

            function(callback) {
                //左にはいつでも本番環境を、右にはいつでも開発環境を入れる
                if (compareDataJson.currentEnvFlg == "production") {
                    leftUrl = compareDataJson.currentUrl;
                    rightUrl = compareDataJson.compareUrl;
                } else if (compareDataJson.currentEnvFlg == "development") {
                    leftUrl = compareDataJson.compareUrl;
                    rightUrl = compareDataJson.currentUrl;
                } else {
                    leftUrl = compareDataJson.currentUrl;
                    rightUrl = compareDataJson.compareUrl;
                }

                //urlをhtmlに描画する
                $('#openLeftUrl').html(leftUrl);
                $('#openRightUrl').html(rightUrl);
                callback();
            }
        ],
        function(err, results) {
            if (err) {
                if (err == "cannotAccessToCompareUrl") {
                    alert(chrome.i18n.getMessage("diff_alert_cannnotAccessCompareUrl"));
                }
                throw err;
            } else {
                //console.log('series all done. ' + results);
                //$("body").html("全部おわり");
                $('#preloaderContainer').hide();
                $('#htmlLeftTitle').css("visibility", "visible");
                $('#htmlRightTitle').css("visibility", "visible");
            }
        });
};

function getCompareUrlHtml(tabid, jsFileName, callback) {
    if (callback) {
        chrome.scripting.executeScript({
            target: { tabId: tabid },
            files: [jsFileName]
        }, function() {
            // If you try and inject into an extensions page or the webstore/NTP you'll get an error
            if (chrome.runtime.lastError) {
                //alert("Error : can not get compare URL HTML.");
                callback();
                //console.log('There was an error injecting script : \n' + chrome.runtime.lastError.message);
            }
        });
    }
}


function countdown(num) {
    var i = 0;
    var interval = setInterval(function() {
        var lastnum = num - i;
        $("#JSRenderWaitingSec").html(lastnum + ' sec');
        if (i == num) {
            clearInterval(interval);
            $("#JSRenderWaiting").hide();
        }
        i++;
    }, 1000);
}


function prettyPrintHtml(html) {
    if (!html || typeof html !== 'string') {
        return html;
    }
    
    var formatted = '';
    var indent = 0;
    var indentStr = '  '; // 2 spaces for indentation
    
    // Remove existing indentation and extra whitespace
    html = html.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Split by tags while preserving them
    var tokens = html.split(/(<[^>]+>)/g).filter(function(token) {
        return token.trim() !== '';
    });
    
    // Tags that should not have line breaks before content
    var inlineTags = ['a', 'span', 'strong', 'em', 'b', 'i', 'u', 'small', 'code', 'label', 'abbr', 'cite'];
    
    // Self-closing tags
    var selfClosingTags = ['br', 'hr', 'img', 'input', 'link', 'meta', 'area', 'base', 'col', 'command', 'embed', 'keygen', 'param', 'source', 'track', 'wbr'];
    
    // Tags that preserve whitespace
    var preserveWhitespaceTags = ['pre', 'script', 'style', 'textarea'];
    
    var inPreserveTag = false;
    var preserveTagName = '';
    var previousWasTag = false;
    
    for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];
        
        // Check if this is a tag
        if (token.match(/^<[^>]+>$/)) {
            var isClosingTag = token.match(/^<\//);
            var tagName = token.replace(/^<\/?/, '').replace(/\/?>.*$/, '').split(/\s/)[0].toLowerCase();
            var isSelfClosing = selfClosingTags.indexOf(tagName) > -1 || token.match(/\/>$/);
            var isInline = inlineTags.indexOf(tagName) > -1;
            var isPreserve = preserveWhitespaceTags.indexOf(tagName) > -1;
            
            // Handle preserve whitespace tags
            if (!isClosingTag && isPreserve) {
                inPreserveTag = true;
                preserveTagName = tagName;
            }
            
            if (inPreserveTag && isClosingTag && tagName === preserveTagName) {
                formatted += token;
                inPreserveTag = false;
                preserveTagName = '';
                previousWasTag = true;
                continue;
            }
            
            if (inPreserveTag) {
                formatted += token;
                previousWasTag = true;
                continue;
            }
            
            // Decrease indent for closing tags (except inline tags)
            if (isClosingTag && !isInline) {
                indent = Math.max(0, indent - 1);
            }
            
            // Add newline and indentation
            if (!isInline && (isClosingTag || !previousWasTag)) {
                formatted += '\n' + Array(indent + 1).join(indentStr);
            }
            
            formatted += token;
            
            // Increase indent for opening tags (except inline and self-closing)
            if (!isClosingTag && !isSelfClosing && !isInline) {
                indent++;
            }
            
            previousWasTag = true;
        } else {
            // This is text content
            if (inPreserveTag) {
                formatted += token;
            } else {
                var trimmedToken = token.trim();
                if (trimmedToken !== '') {
                    if (!previousWasTag) {
                        formatted += '\n' + Array(indent + 1).join(indentStr);
                    }
                    formatted += trimmedToken;
                    previousWasTag = false;
                }
            }
        }
    }
    
    // Clean up extra blank lines
    formatted = formatted.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    return formatted.trim();
}


function changeWrapLine() {
    if ($('#compare').mergely('options').wrap_lines) {
        $('#compare').mergely('options', {
            wrap_lines: false
        });
    } else {
        $('#compare').mergely('options', {
            wrap_lines: true
        });
    }
    $('#compare').mergely('update');
}

function gotoNextDiff() {
    if (successGetComparUrl) {
        $('#compare').mergely("scrollToDiff", "next");
    }
}

function gotoPrevDiff() {
    if (successGetComparUrl) {
        $('#compare').mergely("scrollToDiff", "prev");
    }
}

function gotoNextSearchResult(side) {
    var st;
    if (successGetComparUrl) {
        if (side == "lhs") {
            st = $("#searchBoxTextL").val();
        } else {
            st = $("#searchBoxTextR").val();
        }
        $('#compare').mergely("search", side, st, "next");
    }
}

function gotoPrevSearchResult(side) {
    var st;
    if (successGetComparUrl) {
        if (side == "lhs") {
            st = $("#searchBoxTextL").val();
        } else {
            st = $("#searchBoxTextR").val();
        }
        $('#compare').mergely("search", side, st, "prev");
    }
}

document.addEventListener('DOMContentLoaded', function() {

    var openLeftUrl = document.getElementById('openLeftUrl');
    openLeftUrl.addEventListener('click', function() {
        //console.log(compareDataJson.currentTab);
        if (compareDataJson.currentEnvFlg == "production" || compareDataJson.currentEnvFlg === null) {
            chrome.tabs.update(parseInt(compareDataJson.currentTab.id), {
                selected: true
            });
        } else if (compareDataJson.currentEnvFlg == "development") {
            //chrome.tabs.getSelected(window.id, function(tab) {
            chrome.tabs.query({ active: true, lastFocusedWindow: true }, function(tabs) {
                thisTab = tabs[0];
                chrome.tabs.create({
                    index: thisTab.index + 1,
                    url: leftUrl
                });
            });
        }
    });

    var openRightUrl = document.getElementById('openRightUrl');
    openRightUrl.addEventListener('click', function() {
        if (compareDataJson.currentEnvFlg == "production" || compareDataJson.currentEnvFlg === null) {
            //chrome.tabs.getSelected(window.id, function(tab) {
            chrome.tabs.query({ active: true, lastFocusedWindow: true }, function(tabs) {
                thisTab = tabs[0];
                chrome.tabs.create({
                    index: thisTab.index + 1,
                    url: rightUrl
                });
            });
        } else if (compareDataJson.currentEnvFlg == "development") {
            chrome.tabs.update(parseInt(compareDataJson.currentTab.id), {
                selected: true
            });
        }
    });

    var openLeftUrlVS = document.getElementById('openLeftUrlVS');
    openLeftUrlVS.addEventListener('click', function() {

        chrome.tabs.query({ active: true, lastFocusedWindow: true }, function(tabs) {
            thisTab = tabs[0];
            chrome.tabs.create({
                index: thisTab.index + 1,
                url: "view-source:" + leftUrl
            });
        });

    });

    var openRightUrlVS = document.getElementById('openRightUrlVS');
    openRightUrlVS.addEventListener('click', function() {
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, function(tabs) {
            thisTab = tabs[0];
            chrome.tabs.create({
                index: thisTab.index + 1,
                url: "view-source:" + rightUrl
            });
        });
    });


    var wrapLineL = document.getElementById('wrapLineL');
    wrapLineL.addEventListener('click', function() {
        changeWrapLine();
    });

    var wrapLineR = document.getElementById('wrapLineR');
    wrapLineR.addEventListener('click', function() {
        changeWrapLine();
    });

    var nextDiffL = document.getElementById('nextDiffL');
    nextDiffL.addEventListener('click', function() {
        gotoNextDiff();
    });

    var prevDiffL = document.getElementById('prevDiffL');
    prevDiffL.addEventListener('click', function() {
        gotoPrevDiff();
    });

    var nextDiffR = document.getElementById('nextDiffR');
    nextDiffR.addEventListener('click', function() {
        gotoNextDiff();
    });

    var prevDiffR = document.getElementById('prevDiffR');
    prevDiffR.addEventListener('click', function() {
        gotoPrevDiff();
    });

    var searchBoxTextL = document.getElementById('searchBoxTextL');
    searchBoxTextL.addEventListener('keydown', function(e) {
        var key = e.which || e.keyCode;
        if (key === 13) { // 13 is enter
            gotoNextSearchResult('lhs');
        }
    });

    var nextSearchResultL = document.getElementById('nextSearchResultL');
    nextSearchResultL.addEventListener('click', function() {
        gotoNextSearchResult('lhs');
    });

    var prevSearchResultL = document.getElementById('prevSearchResultL');
    prevSearchResultL.addEventListener('click', function() {
        gotoPrevSearchResult('lhs');
    });

    var removeSearchTextL = document.getElementById('removeSearchTextL');
    removeSearchTextL.addEventListener('click', function() {
        $("#searchBoxTextL").val("");
    });

    var searchBoxTextR = document.getElementById('searchBoxTextR');
    searchBoxTextR.addEventListener('keydown', function(e) {
        var key = e.which || e.keyCode;
        if (key === 13) { // 13 is enter
            gotoNextSearchResult('rhs');
        }
    });

    var nextSearchResultR = document.getElementById('nextSearchResultR');
    nextSearchResultR.addEventListener('click', function() {
        gotoNextSearchResult('rhs');
    });

    var prevSearchResultR = document.getElementById('prevSearchResultR');
    prevSearchResultR.addEventListener('click', function() {
        gotoPrevSearchResult('rhs');
    });

    var removeSearchTextR = document.getElementById('removeSearchTextR');
    removeSearchTextR.addEventListener('click', function() {
        $("#searchBoxTextR").val("");
    });
});

// ------------------------------------------------------------
// キーボードを押したときに実行されるイベント
// ------------------------------------------------------------
$(window).keydown(function(e) {
    if (event.altKey) {
        if (e.keyCode === 40) {
            document.getElementById("nextDiffL").style.color = "#ff8c00";
            document.getElementById("nextDiffR").style.color = "ff8c00";
            gotoNextDiff();
            return false;
        } else if (e.keyCode === 38) {
            document.getElementById("prevDiffL").style.color = "ff8c00";
            document.getElementById("prevDiffR").style.color = "ff8c00";
            gotoPrevDiff();
            return false;
        } else if (e.keyCode === 87) {
            document.getElementById("wrapLineL").style.color = "ff8c00";
            document.getElementById("wrapLineR").style.color = "ff8c00";
            changeWrapLine();
            return false;
        }
    }
});

$(window).keyup(function(e) {
    if (event.altKey) {
        if (e.keyCode === 40) {
            document.getElementById("nextDiffL").style.color = "#777";
            document.getElementById("nextDiffR").style.color = "777";
            return false;
        } else if (e.keyCode === 38) {
            document.getElementById("prevDiffL").style.color = "777";
            document.getElementById("prevDiffR").style.color = "777";
            return false;
        } else if (e.keyCode === 87) {
            document.getElementById("wrapLineL").style.color = "777";
            document.getElementById("wrapLineR").style.color = "777";
            return false;
        }
    }
});