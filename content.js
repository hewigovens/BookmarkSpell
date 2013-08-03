// functions

function buttonClicked() {
    console.log('buttonClicked');
}

function insertDBDataStore(bookmark) {
    var datastoreManager = client.getDatastoreManager();
    datastoreManager.openDefaultDatastore(function(error, datastore) {
        if (error) {
            console.log('open default datastore failed: ' + error);
        }
        console.log(datastore);
        var bookmarkTable = datastore.getTable('bookmarks');
        var bookmark = bookmarkTable.insert(bookmark);
        console.log(bookmark);    
    }
}

// Main

document.getElementById('submit_button').onclick = buttonClicked;

var client = new Dropbox.Client({'key':'pgx3960nqyh983j'});
client.authDriver(new Dropbox.AuthDriver.Chrome());

chrome.extension.onMessage.addListener(function(message){
    console.log(message);
    console.log('receive bookmark ' + message.title + ' : ' + message.url);
    var title = document.getElementById('title');
    title.innerText = message.title

    var url = document.getElementById('url');
    url.innerText = message.url;

    if (client.isAuthenticated()) {
        console.log('authenticated');
        insertDBDataStore({'title': message.title,'url': message.url,'created': new Date()});
    } else {
        console.log('not authenticated');
        client.authenticate(function(error, dbclient) {
            if (error) {
                console.log('authenticated failed: ' + error);
            } else {
                insertDBDataStore({'title': message.title,'url': message.url,'created': new Date()});                
            }
        }
    }
});