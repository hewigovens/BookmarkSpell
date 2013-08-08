// Main

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse){
        console.log('==> content.js onMessage');
        if (sender.url === document.URL) {
            console.log("==> pass message sent by self");
            return;
        }
        var message = request;
        console.log('==> receive bookmark ' + message.title + ' : ' + message.url);
        $('#title').text(message.title);
        $('#url').text(message.url);

        $('#submit_button').on('click', function() {
            console.log('send tags/note back to background');

            var tags = document.getElementById('tags');
            var notes = document.getElementById('notes');

            message.tags = tags.value;
            message.notes = notes.value;

            message.from = document.URL;

            chrome.runtime.sendMessage(message);

            window.close();
        });  

        sendResponse('==> bookmark message received.');
    }
);

$(document).on('ready', function(){
    console.log('==> document.ready');
    var folders = JSON.parse(localStorage.get('BookmarkBarFolders'));
    var select = $('#folder_select');
    for (folder in folders){
        select.append($('<option value="%s">$s</option>', folder, folders[folder]));
    }
    $("select[name='folder_list']").selectpicker({style: 'btn-primary', menuStyle: 'dropdown-inverse'});
});