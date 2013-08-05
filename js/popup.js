//Main

function recentClicked() {
    console.log('recent clicked, list recent 20 bookmarks');
    chrome.bookmarks.getRecent(20, function(bookmarks){
        for (var i = bookmarks.length - 1; i >= 0; i--) {
            console.log(bookmarks[i]);
        };
    });
}

function searchClicked() {
    console.log('search clicked');
}

function helpClicked() {
    console.log('help clicked');
}

$(function() {
    $('#recent_bookmarks').on('click', function() {
        recentClicked();
    });
    $('#hosted_app').on('click', function() {
        searchClicked();
    });
    $('#help').on('click', function() {
        helpClicked();
    });
});

