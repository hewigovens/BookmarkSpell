$(document).on('ready', function(){
    console.log('==> document.ready');
    $('#save_button').on('click', function(){
        var blob = new Blob([localStorage.getItem('RecentBookmarks')], {type: "application/json"});
        var today = new Date();
        var filename = sprintf('BookmarkSpell_dump_%d.json', parseInt(today.getTime()/1000));
        saveAs(blob, filename);
    });
    $('#link_button').on('click', function(){
        chrome.runtime.sendMessage({action:'manualLink', from: document.URL}, function(message){
            alert(message);
        });
    });
});