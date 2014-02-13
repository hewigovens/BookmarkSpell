//Main

function recentClicked() {
    console.log('==> open recent bookmarks page');
    chrome.runtime.sendMessage({action_page:'recent_bookmarks.html', from: document.URL});
    window.close();
}

function searchClicked() {
    console.log('==> search clicked');
    chrome.tabs.create({url:'chrome://bookmarks/'}, function(tab){console.log(tab);});
}

function aboutClicked() {
    console.log('==> about clicked');
    chrome.tabs.create({url:'https://github.com/hewigovens/BookmarkSpell/'}, function(tab){console.log(tab);});
}

function viewNotesClicked() {
    console.log('==> notes for page clicked');
    chrome.runtime.sendMessage({action:'noteForPage', from: document.URL});
    window.close();
}

function viewDatastoreClicked () {
    console.log('==> view datastore clicked');
    chrome.tabs.create({url:'https://www.dropbox.com/developers/browse_datastores/297439'});
}

function manualSyncClicked(){
    console.log("==> manual sync clicked");
    chrome.runtime.sendMessage({action:'manualSync', from: document.URL});
    window.close();
}

function reportBugClicked(){
    console.log('reportBugClicked');
    chrome.tabs.create({url:'mailto:hewigovens@gmail.com?subject=Report BookmarkSpell Bugs&body=I just found a bug:'});
}

window.addEventListener('load', function(){
    document.getElementById('recent_bookmarks').onclick = recentClicked;
    document.getElementById('hosted_app').onclick = searchClicked;
    document.getElementById('about').onclick = aboutClicked;
    document.getElementById('notes_for_page').onclick = viewNotesClicked;
    document.getElementById('browser_datastore').onclick = viewDatastoreClicked;
    document.getElementById('report_bug').onclick = reportBugClicked;
    document.getElementById('manual_sync').onclick = manualSyncClicked;
}, false);

