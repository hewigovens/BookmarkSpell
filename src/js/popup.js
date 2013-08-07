//Main

function recentClicked() {
    console.log('==> open recent bookmarks page');
    chrome.runtime.sendMessage({action:'recent_bookmarks'});
    window.close();
}

function searchClicked() {
    console.log('search clicked');
    window.close();
}

function helpClicked() {
    console.log('help clicked');
    window.close();
}

window.addEventListener('load', function(){
    document.getElementById('recent_bookmarks').onclick = recentClicked;
    document.getElementById('hosted_app').onclick = helpClicked;
    document.getElementById('help').onclick = searchClicked;
}, false);

