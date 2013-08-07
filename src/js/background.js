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
    var ArchiveFolderId = localStorage.getItem('ArchiveFolderId');
    if (bookmark.parentId === ArchiveFolderId) {
        console.log('spell added!');
        var x = screen.width/2 - 480/2;
        var y = screen.height/2 - 440/2;

        if (gContentWindow === undefined) {
            console.log('==> create content window');
            content_url = chrome.extension.getURL('content.html');
            chrome.windows.create({url:content_url,type:'popup', width:480, height:440, left:x, top:y}, function(result_window){
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
}

function bookmarkRemoved(id, bookmark){
    console.log('<== bookmark removed');
}

function messageHandler(request, sender, sendResponse){
    if (sender.hasOwnProperty('tab')) {
        console.log('<== handle message from contetn script:' + sender.tab.url);
        if (sender.tab.url === chrome.extension.getURL('content.html')) {
            console.log('<== expected bookmark with tags and notes');
            console.log(request);
            parser_url = sprintf('https://www.readability.com/api/content/v1/parser?url=%s&token=%s',
                                    escape(request.url), '1164eaff0a68f11e7474de98f03c34fc8acf258c');
            message = {
                title: request.title,
                url: request.url,
                tags: request.tags,
                notes: request.notes,
                date_added: request.dateAdded
            };
            $.getJSON(parser_url).always(function(data){
                console.log(data);
                message.short_url = data.short_url;
                message.excerpt = data.excerpt;
                message.content = data.content;
                message.domain = data.domain;
                message.word_count = data.word_count;
                if (data.author) {
                    message.author = data.author;
                }
                if (gDataStore) {
                    var bookmarkTable = gDataStore.getTable('bookmarks');
                    bookmarkTable.insert(message);
                } else {
                    console.log('==> datastore is not ready!');
                }
            });
        }
    } else {
        console.log('<== handle message from extension');
        try {
            var action_page = chrome.extension.getURL(request.action) + '.html';
            chrome.tabs.create({url:action_page}, function(tab){
                chrome.tabs.query({'url':action_page}, function(results){
                    if (results.length == 0) {
                        return;
                    }
                    if (gDBClient.isAuthenticated()) {
                        if (gDataStore) {
                            var bookmarkTable = gDataStore.getTable('bookmarks');
                            //limit to 20
                            var results = bookmarkTable.query();
                            var bookmarks = [];
                            $.each(results, function(index, object){
                                var bookmark = object.getFields();
                                if (bookmark.short_url) {
                                    bookmarks.unshift(bookmark);
                                }
                            });
                            chrome.tabs.sendMessage(tab.id, bookmarks, function(response){
                                console.log('<== get response:'+response);
                            });
                        } else {
                            console.log('==> datastore is not ready!');
                        }
                    } else {
                        gDBClient.authenticate();
                    }
                });
            });
        }
        catch(e) {
            console.log(e);
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
                }});
            }
        });
    }
}

// Main

setup();
registerEvents();
