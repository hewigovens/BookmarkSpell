// global variable

var gDBClient = undefined;
var gDataStore = undefined;
var gAppKey = 'APP_KEY_PLACEHOLDER';

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
                    updateBookmarkBarFolders();
                });
            }
        });
	}
}

function bookmarkCreated(id, bookmark){
    console.log('<== bookmark created');
    console.log(bookmark);
    if (bookmark.url == undefined) {
        return;
    } else if (bookmark.url.match("^javascript")){
        return;
    } else {
        //bookmark id is uniq within profile
        var chrome_id = sprintf('%s_%s', bookmark.parentId, bookmark.id);
        var bookmarkTable = gDataStore.getTable('bookmarks');
        var results = bookmarkTable.query({url:bookmark.url});

        //if existed in Dropbox, update bookmark id
        if (results.length != 0) {
            $.each(results, function(index, record){
                var chrome_ids = record.getFields().chrome_id.split(',');
                if ($.inArray(chrome_id, chrome_ids) == -1) {
                    chrome_ids.push(chrome_id);
                    record.update({chrome_id:chrome_ids.toString()});
                    return false;
                } else {
                    return false;
                }
            });
            return;
        } else {

            console.log('spell added!');
            var x = screen.width/2 - 516/2;
            var y = screen.height/2 - 496/2;


            console.log('==> create content window');
            content_url = sprintf("%s?bookmark=%s",chrome.extension.getURL('content.html'), bookmark.id);
            chrome.windows.create({url:content_url,type:'popup', width:516, height:496, left:x, top:y}, function(result_window){
                chrome.tabs.query({'url':content_url}, function(results){
                console.log('==> send bookmark to new opened window');
                console.log(results)
                if (results.length !== 0) {
                        chrome.tabs.sendMessage(results[0].id, bookmark, function(response){
                        console.log('==> get response from new opened window');
                        console.log(response);
                        });
                    }
                });
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

function bookmarkMoved(id, moveInfo){
    console.log(id, moveInfo);
    //update dropbox chrome_id
    var bookmarkTable = gDataStore.getTable('bookmarks');
    chrome.bookmarks.get(id, function(results){
        $.each(results, function(index, bookmark){
            records = bookmarkTable.query({url:bookmark.url});
            $.each(records, function(index, record){
                record.update({chrome_id:sprintf('%s_%s',moveInfo.parentId, id)});
            });
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

function generateRecordId(){

    // h1388239943503_mxducy
    var prefix = 'h';
    var timestamp = new Date().getTime();
    var suffix = Math.random().toString(36).substr(2,6);
    return sprintf("%s%d_%s", prefix, timestamp, suffix);
}

function messageHandler(request, sender, sendResponse){
    console.log('<== handle message from: ' + request.from);
    console.log(request);
    // receive bookmark with tags/notes
    if (request.from.match(chrome.extension.getURL('content.html'))) {
        console.log('<== expected bookmark with tags and notes');
        var parser_url = sprintf('https://www.readability.com/api/content/v1/parser?url=%s&token=%s',
                                escape(request.url), '1164eaff0a68f11e7474de98f03c34fc8acf258c');

        if(request.old_parentId){
            chrome.bookmarks.move(request.id, {parentId:request.parentId}, function(result){
                console.log(result);
            });
        }

        var raw_tags = request.tags.split(",");
        var tags = [];

        // Dropbox Maximum record size
        var isTooLarge = false;
        var largeLimit = 100*1024;
        $.each(raw_tags, function(index, value){
            tags.push(value.trim());
        });
        message = {
            id: generateRecordId(),
            title: request.title,
            url: request.url,
            tags: tags.toString(),
            notes: request.notes,
            date_added: request.dateAdded,
            added_by: "bookmarkspell_chrome",
            chrome_id: sprintf("%s_%s", request.parentId, request.id)
        };

        $.getJSON(parser_url).done(function(data) {
            message.short_url = data.short_url;
            message.excerpt = data.excerpt;
            if(data.content.length > largeLimit){
                // too large, use excerpt
                message.content = data.excerpt;
                isTooLarge = true;
            } else{
                message.content = data.content;
            }
            
            message.domain = data.domain;
            message.word_count = data.word_count;
            if (data.author) {
                message.author = data.author;
            }
        }).fail(function(){
            console.log('==> call readability parser API failed');
            var a = document.createElement('a');
            message.domain = a.host;
        }).always(function(){
            if (gDataStore) {
                var bookmarkTable = gDataStore.getTable('bookmarks');
                bookmarkTable.insert(message);
                if (message.short_url) {

                    var tip = 'Archived successfully.';
                    if (isTooLarge) {
                        tip += " But not full text content";
                    };
                    showDesktopNotification(tip);
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
        } else if (request.action === 'noteForPage') {
            console.log('==> handle noteForPage');
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
                console.log(tabs);
                 if (tabs.length) {
                    var table = gDataStore.getTable('bookmarks');
                    var tab = tabs[0];
                    var results = table.query({url: tab.url});
                    if (results.length) {
                        var result = results[0];
                        var notes = result.get('notes');
                        console.log(notes);
                        insertNotesBox(tab.id, notes);
                    };
                }
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
            removeBookmarkFromDB(request.remove_id);
            $.each(request.remove_chrome_id.split(','), function(index, chrome_id){
                var ids = chrome_id.split('_');
                chrome.bookmarks.remove(ids[1]);
            });
        }
    }
}

function insertNotesBox(tab_id, notes) {
    chrome.tabs.insertCSS(tab_id, {file: 'css/note_box.css'});
    var insert_js = sprintf('var note_box_id = "bookmarkspell_note_box"; \
        if (document.getElementById(note_box_id)) { \
            document.getElementById(note_box_id).style.display = "block"; \
            return; \
        } \
        var note_box_close_id = "bookmarkspell_note_box_close"; \
        var note_box_close = document.createElement("a"); \
        note_box_close.id =  note_box_close_id; \
        note_box_close.className = note_box_close_id; \
        note_box_close.textContent = "X"; \
        note_box_close.onclick = function(){ \
            console.log(note_box_id); \
            var e = document.getElementById(note_box_id); \
            console.log(e); \
            e.style.display = "none"; \
            return; \
        }; \
        var note_box = document.createElement("div"); \
        note_box.id = note_box_id; \
        note_box.className = note_box_id; \
        var blockquote = document.createElement("blockquote"); \
        blockquote.textContent = "%s"; \
        note_box.appendChild(note_box_close); \
        note_box.appendChild(blockquote); \
        document.body.insertBefore(note_box,document.body.childNodes[0]);', notes);
    chrome.tabs.executeScript(tab_id, {code: insert_js});
}

function windowRemoved(window_id) {
    console.log('<== content window closed:',window_id);
}

function removeBookmarkFromDB(id){
    var bookmarkTable = gDataStore.getTable('bookmarks');
    var results = bookmarkTable.query({id:id});
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
    var tag_stats = {};
    $.each(results, function(index, object){
        var bookmark = object.getFields();
        if (!bookmark.id) {
            //if not set id, use dropbox record internal id
            bookmark.id = object.getId();
        }
        if (bookmark.url) {
            bookmarks.unshift(bookmark);
        }
        if (bookmark.tags) {
            var tags = bookmark.tags.split(',');
            $.each(tags, function(index, tag){
                var key = tag.trim();
                if (tag_stats[key]) {
                    tag_stats[key].push(bookmark.chrome_id);
                } else {
                    tag_stats[key] = [bookmark.chrome_id];
                }
            });
        }
    });

    bookmarks = bookmarks.sort(function(a, b){
        //compatible records create by other datastore SDK
        //so we need to sort by date_added, what a pain
        if (b.date_added < a.date_added) {
            return -1;
        } else if(b.date_added > a.date_added){
            return 1;
        } else{
            return 0;
        }
    });
    localStorage.setItem('RecentBookmarks', JSON.stringify(bookmarks));
    localStorage.setItem('RecentTagStats', JSON.stringify(tag_stats));
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
    chrome.bookmarks.onRemoved.addListener(bookmarkRemoved);
    chrome.bookmarks.onMoved.addListener(bookmarkMoved);

    // Window event

    chrome.windows.onRemoved.addListener(windowRemoved);

    // Message Passing
    chrome.runtime.onMessage.addListener(messageHandler);
}

function setup() {

    
    updateBookmarkBarFolders();

    gDBClient = new Dropbox.Client({'key': gAppKey});
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
