//Main

function recentClicked() {
    console.log('recent clicked, list recent 20 bookmarks');
    chrome.bookmarks.getRecent(20, function(bookmarks){
        for (var i = bookmarks.length - 1; i >= 0; i--) {
            console.log(bookmarks[i]);
        };
    });
}

function helpClicked() {
    console.log('help clicked');
}

function searchClicked() {
    console.log('search clicked');
}

document.addEventListener('ready', function(){
    document.getElementById('recent_bookmarks').onclick = recentClicked;
    document.getElementById('hosted_app').onclick = helpClicked;
    document.getElementById('help').onclick = searchClicked;
});

