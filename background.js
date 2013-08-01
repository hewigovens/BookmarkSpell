// functions

function extensionInstalled(details){
	if (details.reason === 'install'){
		console.log('bookmark spell installed');
        console.log('create archive folder if needed');
        // 1 -> Bookmark Bar
        chrome.bookmarks.getSubTree('1',function(results){
            var not_found = true
            var bookmark_bar = results[0].children;
            for (var i = bookmark_bar.length - 1; i >= 0; i--) {
                if (bookmark_bar[i].hasOwnProperty('children')) {
                    if (bookmark_bar[i].title === 'Archive') {
                        localStorage.setItem('ArchiveFolderId',bookmark_bar[i].id);
                        console.log('Archive id: ' + bookmark_bar[i].id);
                        not_found = false;
                        break;
                    }
                }
            }
            if (not_found) {
                // Create Archive folder under Bookmark Bar
                var archive_folder = {
                    'parentId': '1',
                    'title': 'Archive',
                    'url': null
                };
                chrome.bookmarks.create(archive_folder, function(result){
                    localStorage.setItem('ArchiveFolderId', result.id);
                    console.log('Archive id: ' + result.id);
                });
            }
        });
	}
}

function bookmarkCreated(id, bookmark){
    console.log('bookmark created');
    console.log(bookmark);
    var ArchiveFolderId = localStorage.getItem('ArchiveFolderId');
    if (bookmark.parentId === ArchiveFolderId) {
        console.log('spell added!');
        var x = screen.width/2 - 300/2;
        var y = screen.height/2 - 300/2;

        content_url = chrome.extension.getURL('content.html');
        window_spec = 'width=300,height=300,left='+x+',top='+y
        
        content_window = window.open(content_url, "", content_url);
        content_window.addEventListener('load', function(){
            chrome.tabs.query({'url':content_url}, function(results){
            console.log('send bookmark to new opened window');
            console.log(results)
            if (results.length !== 0) {
                    chrome.tabs.sendMessage(results[0].id, bookmark, function(response){
                    console.log('get response from new opened window');
                    console.log(response);
                });
            }
            });
        });
    }
}

function bookmarkChanged(id, changeInfo){
    console.log('bookmark changed');
}

function registerEvents(){

    // Install event
    chrome.runtime.onInstalled.addListener(extensionInstalled);

    // Bookmark event
    chrome.bookmarks.onCreated.addListener(bookmarkCreated);
    chrome.bookmarks.onChanged.addListener(bookmarkChanged);
}

// Main

registerEvents();