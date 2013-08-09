// global variable

var gContentWindow = undefined;
var gContentTab = undefined;
var gDBClient = undefined;
var gDataStore = undefined;

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
    console.log('<== bookmark created');
    console.log(bookmark);
    //var ArchiveFolderId = localStorage.getItem('ArchiveFolderId');
    //if (bookmark.parentId === ArchiveFolderId) {
    var folders = JSON.parse(localStorage.getItem('BookmarkBarFolders'));
    if (folders[bookmark.parentId]) {
        console.log('spell added!');
        var x = screen.width/2 - 516/2;
        var y = screen.height/2 - 476/2;

        if (gContentWindow === undefined) {
            console.log('==> create content window');
            content_url = chrome.extension.getURL('content.html');
            chrome.windows.create({url:content_url,type:'popup', width:516, height:476, left:x, top:y}, function(result_window){
                gContentWindow = result_window;
                chrome.tabs.query({'url':content_url}, function(results){
                console.log('==> send bookmark to new opened window');
                console.log(results)
                if (results.length !== 0) {
                            gContentTab = results[0];
                            chrome.tabs.sendMessage(results[0].id, bookmark, function(response){
                            console.log('==> get response from new opened window');
                            console.log(response);
                        });
                    }
                });
            });
        } else {
            console.log('==> set content window to focus');
            chrome.windows.update(gContentWindow.id, {focused: true});
            chrome.tabs.sendMessage(gContentTab.id, bookmark, function(response){
                console.log('==> get response from content window');
                console.log(response);
            });
        }
    }
}

function bookmarkChanged(id, bookmark){
    console.log('<== bookmark changed');
    chrome.bookmarks.get(id, function(results){
        $.each(results, function(index, bookmark){
            if (bookmark.parentId === '1' && !bookmark.hasOwnProperty('url')) {
                updateBookmarkBarFolders();
                return false;
            }
        });
    });
}

function bookmarkRemoved(id, bookmark){
    console.log('<== bookmark removed callback');
    console.log(bookmark);
    console.log(id);
    var folders = JSON.parse(localStorage.getItem('BookmarkBarFolders'));
    if (folders[id]) {
        console.log('==> bookmark bar folders removed');
        delete folders[id];
        localStorage.setItem('BookmarkBarFolders', JSON.stringify(folders));
        return;
    };
    if (gDataStore) {
        removeBookmarkFromDB(sprintf("%s_%s", bookmark.parentId, id));
    }
}

function showDesktopNotification(message){
    if (window.webkitNotifications) {
            var notification = webkitNotifications.createNotification('img/icon48.png','BookmarkSpell',message);
            notification.show();
            setTimeout(function(){
                notification.cancel();
            },2000);
    } else {
        console.log(message);
    }
}

function loadRecentBookmarks(){
    return JSON.parse(localStorage.getItem('RecentBookmarks'))
}

function messageHandler(request, sender, sendResponse){
    console.log('<== handle message from: ' + request.from);
    console.log(request);
    // receive bookmark with tags/notes
    if (request.from === chrome.extension.getURL('content.html')) {
        console.log('<== expected bookmark with tags and notes');
        parser_url = sprintf('https://www.readability.com/api/content/v1/parser?url=%s&token=%s',
                                escape(request.url), '1164eaff0a68f11e7474de98f03c34fc8acf258c');

        if(request.old_parentId){
            chrome.bookmarks.move(request.id, {parentId:request.parentId}, function(result){
                console.log(result);
            });
        }

        raw_tags = request.tags.split(",");
        tags = [];
        $.each(raw_tags, function(index, value){
            tags.push(value.trim());
        });
        message = {
            title: request.title,
            url: request.url,
            tags: tags.toString(),
            notes: request.notes,
            date_added: request.dateAdded,
            chrome_id: sprintf("%s_%s", request.parentId, request.id)
        };

        $.getJSON(parser_url).done(function(data) {
            message.short_url = data.short_url;
            message.excerpt = data.excerpt;
            message.content = data.content;
            message.domain = data.domain;
            message.word_count = data.word_count;
            if (data.author) {
                message.author = data.author;
            }
        }).fail(function(){
            console.log('==> call readability parser API failed');
        }).always(function(){
            if (gDataStore) {
                var bookmarkTable = gDataStore.getTable('bookmarks');
                bookmarkTable.insert(message);
                if (message.short_url) {
                    showDesktopNotification('Archived successfully.');
                } else {
                    showDesktopNotification('Archived without readability...');
                }
            } else {
                console.log('==> datastore is not ready!');
                showDesktopNotification('Archive failed, Dropbox datastore is not ready.');
            }
        });
    } else if (request.from === chrome.extension.getURL('popup.html')) {
        if (request.action_page) {
            var action_page = chrome.extension.getURL(request.action_page);
            chrome.tabs.create({url:action_page}, function(tab){
            });
        } 
    } else if (request.from === chrome.extension.getURL('recent_bookmarks.html')) {
        console.log('<== expected loadBookmarks');
        if (request.action === 'loadBookmarks') {
            var bookmarks = loadRecentBookmarks();
            chrome.tabs.sendMessage(request.from_tab_id, bookmarks, function(response){
                console.log('<== get response: ' + response);
            });
        } else if (request.action === 'removeBookmark') {
            var ids = request.remove_id.split('_');
            chrome.bookmarks.remove(ids[1]);
        }
    }
}

function windowRemoved(window_id) {
    if (gContentWindow) {
        if (window_id == gContentWindow.id) {
            console.log('<== content window closed');
            gContentWindow = undefined;
            gContentTab = undefined;
        }
    }
}

function removeBookmarkFromDB(id){
    var bookmarkTable = gDataStore.getTable('bookmarks');
    var results = bookmarkTable.query({chrome_id:id});
    $.each(results, function(index, object){
        console.log('==> remove from dropbox datastore:',object);
        object.deleteRecord();
    });
}

function DBDataStoreChanged(){
    console.log("<== dropbox datastore changed, update localStorage");
    updateRecentBookmarks();
}

function updateRecentBookmarks(){
    var bookmarkTable = gDataStore.getTable('bookmarks');
    //XXXXXX limit to 20
    var results = bookmarkTable.query();
    var bookmarks = [];
    $.each(results, function(index, object){
        var bookmark = object.getFields();
        if (bookmark.short_url) {
            bookmarks.unshift(bookmark);
        }
    });
    localStorage.setItem('RecentBookmarks', JSON.stringify(bookmarks));
}

function updateBookmarkBarFolders() {
    chrome.bookmarks.getSubTree('1',function(results) {
        var bookmark_bar = results[0].children;
        var folders = {};
        $.each(bookmark_bar, function(index, bookmark){
            if (bookmark.hasOwnProperty('children')) {
                folders[bookmark.id] = bookmark.title;
            }
        });
        localStorage.setItem('BookmarkBarFolders', JSON.stringify(folders));
    });
}

function registerEvents() {

    // Install event
    chrome.runtime.onInstalled.addListener(extensionInstalled);

    // Bookmark event
    chrome.bookmarks.onCreated.addListener(bookmarkCreated);
    chrome.bookmarks.onChanged.addListener(bookmarkChanged);
    chrome.bookmarks.onMoved.addListener(bookmarkCreated);
    chrome.bookmarks.onRemoved.addListener(bookmarkRemoved);

    // Window event

    chrome.windows.onRemoved.addListener(windowRemoved);

    // Message Passing
    chrome.runtime.onMessage.addListener(messageHandler);
}

function setup() {

    
    updateBookmarkBarFolders();

    gDBClient = new Dropbox.Client({'key': 'pgx3960nqyh983j'});
    gDBClient.authDriver(new Dropbox.AuthDriver.Chrome());

    credentials = localStorage.getItem('DropboxOAuth');
    if (credentials) {
        gDBClient.setCredentials(JSON.parse(credentials));
    }
    if (gDBClient.isAuthenticated()) {
        console.log('==> dropbox authenticated');
        var datastoreManager = gDBClient.getDatastoreManager ();
        datastoreManager.openDefaultDatastore(function(error, datastore){
        if (error) {
            console.log('==> open dropbox datastore failed:' + error);
        } else {
            gDataStore = datastore;
            gDataStore.recordsChanged.addListener(DBDataStoreChanged);
            updateRecentBookmarks();
        }});

    } else {
        console.log('==> try authenticate dropbox');
        gDBClient.authenticate(function(error, client){
            if (error) {
                console.log('==> authenticate failed:' + error);
                return;
            } else {
                localStorage.setItem('DropboxOAuth', JSON.stringify(client.credentials()));
                var datastoreManager = gDBClient.getDatastoreManager ();
                datastoreManager.openDefaultDatastore(function(error, datastore){
                if (error) {
                    console.log('==> open dropbox datastore failed:' + error);
                } else {
                    gDataStore = datastore;
                    gDataStore.recordsChanged.addListener(DBDataStoreChanged);
                    updateRecentBookmarks();
                }});
            }
        });
    }
}

// Main

setup();
registerEvents();
