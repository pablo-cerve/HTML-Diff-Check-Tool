importScripts("async.js");
importScripts("common.js");

var compareDataJson = {};


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    var response;

    if (request.name === "sendDiffData") { //diff.jsからのメッセージリスナー
        response = {
            "compareDataJson": compareDataJson
        };
        sendResponse(response);

    } else if (request.name === "pathDiffData") { //popup.jsからのメッセージリスナー
        compareDataJson = request.compareDataJson;
        response = {
            "status": "success",
        };
        sendResponse(response);

    } else if (request.name === "migrateStorage") {

        //console.log('migrateStorage');
        //console.log(localStorage["domainPairs"]);

        if (localStorage["domainPairs"]) {
            chrome.storage.sync.set({
                'domainPairs': localStorage["domainPairs"]
            });
        } else {
            chrome.storage.sync.set({
                'domainPairs': ""
            });
        }

        if (localStorage["replaceStringPairs"]) {
            chrome.storage.sync.set({
                'replaceStringPairs': localStorage["replaceStringPairs"]
            });
        } else {
            chrome.storage.sync.set({
                'replaceStringPairs': ""
            });
        }

        if (localStorage["otherJSRender"] === "true") {
            chrome.storage.sync.set({
                'otherJSRender': true
            });
        } else {
            chrome.storage.sync.set({
                'otherJSRender': false
            });
        }

        chrome.storage.sync.set({
            'otherJSRenderWaitTime': Number(localStorage["otherJSRenderWaitTime"])
        });


        chrome.storage.sync.set({
            'migrateStorageFlg': true
        });

        response = {
            "status": "success",
        };
        sendResponse(response);
    }
    return true;
});


var parentId = chrome.contextMenus.create({
    "id":"htmlDiffCheckTool",
    "title": chrome.i18n.getMessage("contextMenu_title"),
    "type": "normal",
    "contexts": ["all"],
});

chrome.contextMenus.create({
    "id":"htmlDiffCheckToolOpen",
    "title": "open",
    "type": "normal",
    "contexts": ["all"],
    "parentId": parentId
});

chrome.contextMenus.create({
    "id":"htmlDiffCheckToolDiff",
    "title": "diff",
    "type": "normal",
    "contexts": ["all"],
    "parentId": parentId
});

chrome.contextMenus.create({
    "id":"htmlDiffCheckToolOption",    
    "title": chrome.i18n.getMessage("popup_options"),
    "type": "normal",
    "contexts": ["all"],
    "parentId": parentId
});

chrome.contextMenus.onClicked.addListener(function(info, tab){
    if(info.menuItemId == "htmlDiffCheckToolOpen"){
        bootFromContextMenus("open");
    } else if(info.menuItemId == "htmlDiffCheckToolDiff"){
        bootFromContextMenus("diff");
    } else if(info.menuItemId == "htmlDiffCheckToolOption"){
        optionFromContextMenus();
    } 
})