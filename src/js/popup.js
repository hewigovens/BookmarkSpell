//Main

function recentClicked() {
    console.log('==> open recent bookmarks page');
    chrome.runtime.sendMessage({action_page:'recent_bookmarks.html', from: document.URL});
    window.close();
}

function searchClicked() {
    console.log('search clicked');
    chrome.tabs.create({url:'chrome://bookmarks/'}, function(tab){console.log(tab);});
}

function helpClicked() {
    console.log('help clicked');
    chrome.tabs.create({url:'https://github.com/hewigovens/BookmarkSpell/'}, function(tab){console.log(tab);});
}

function viewNotesClicked() {
    console.log('notes for page clicked');
    chrome.runtime.sendMessage({action:'noteForPage', from: document.URL});
    window.close();
}

window.addEventListener('load', function(){
    document.getElementById('recent_bookmarks').onclick = recentClicked;
    document.getElementById('hosted_app').onclick = searchClicked;
    document.getElementById('help').onclick = helpClicked;
    document.getElementById('notes_for_page').onclick = viewNotesClicked;
}, false);

