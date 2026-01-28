document.addEventListener('DOMContentLoaded', function() {

    var openAboutLink = document.getElementById('openOptionsLink');
    if (openAboutLink) {

        openAboutLink.addEventListener('click', function() {
            chrome.tabs.query({active: true, lastFocusedWindow: true},function(tabs){
                chrome.tabs.create({
                    index: tabs[0].index + 1,
                    url: "options.html"
                });
            });
        });
    }

    var openStoreLink = document.getElementById('openStoreLink');
    if (openStoreLink) {
        openStoreLink.addEventListener('click', function() {
            chrome.tabs.query({active: true, lastFocusedWindow: true},function(tabs){
                chrome.tabs.create({
                    index: tabs[0].index + 1,
                    url: "https://chromewebstore.google.com/detail/fjbonpakihikkocmockbkndhooihpijo"
                });
            });
        });
    }


    var openContactLink = document.getElementById('openContactLink');
    if (openContactLink) {
        openContactLink.addEventListener('click', function() {
            //chrome.tabs.getSelected(window.id, function(tab) {
            chrome.tabs.query({active: true, lastFocusedWindow: true},function(tabs){
                chrome.tabs.create({
                    index: tabs[0].index + 1,
                    url: "https://docs.google.com/forms/d/e/1FAIpQLSe-Hr1Q_TLBw8Im6N1iKvsoUAo1nEPUsgXC4PsQXDbdhfOt-w/viewform?usp=sf_link"
                });
            });
        });
    }

    var openMergelyLink = document.getElementById('openMergelyLink');
    if (openMergelyLink) {
        openMergelyLink.addEventListener('click', function() {
            chrome.tabs.query({active: true, lastFocusedWindow: true},function(tabs){
                chrome.tabs.create({
                    index: tabs[0].index + 1,
                    url: "http://www.mergely.com/"
                });
            });
        });
    }
});
