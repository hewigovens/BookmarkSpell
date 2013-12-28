// Main

function SelectOption(parentId, title){
    $('.filter-option').text(title);
    $('select[name=folder_list]').val(parentId);
}

function AdjustWindowSize(){

    var w = $('body').width();
    var h = $('#content_container').height() + $('#submit_button').height() *2;
    window.resizeTo(w,h);
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse){
        console.log('==> content.js onMessage');
        if (sender.url === document.URL) {
            console.log("==> pass message sent by self");
            return;
        }
        var message = request;
        console.log(sprintf('==> receive bookmark %s:%s', message.title, message.url));

        if (message.title === undefined && message.url === undefined) {
            chrome.windows.getCurrent(function(window){
                chrome.windows.remove(window.id);
                return;
            });
        }

        $('#title').text(message.title);
        $('#url').text(message.url);

        var bar_folders = JSON.parse(localStorage.getItem('BookmarkBarFolders'));
        if (bar_folders[request.parentId]) {
            console.log(sprintf('set %s %s selected', bar_folders[request.parentId], request.parentId));
            SelectOption(request.parentId, bar_folders[request.parentId]);
        } else {
            chrome.bookmarks.get(request.parentId, function(results){
                if (results.length != 0) {
                    var result = results[0];
                    var new_option = $(sprintf('<option value=%s>%s</option>', request.parentId, result.title));
                    $('#folder_select').append(new_option);

                    SelectOption(request.parentId, result.title);
                }
            });
        }

        $('#submit_button').on('click', function() {
            console.log(message);('send tags/note back to background');

            message.title = $('#title').text();
            message.url = $('#url').text();
            message.tags = $('#tags').val().replace(/[，\\s]/gi,',');
            message.notes = $('#notes').val();

            message.from = document.URL;
            if (message.parentId !== $('select[name=folder_list]').val()) {
                message.old_parentId = message.parentId;
                message.parentId = $('select[name=folder_list]').val();
            }
            chrome.runtime.sendMessage(message);

            window.close();
        });

        AdjustWindowSize();
        sendResponse('==> bookmark message received.');
    }
);

$(document).on('ready', function(){
    console.log('==> document.ready');
    var folders = JSON.parse(localStorage.getItem('BookmarkBarFolders'));
    var select = $('#folder_select');
    for (folder in folders){
        select.append($(sprintf('<option value="%s">%s</option>', folder, folders[folder])));
    }
    $("select[name='folder_list']").selectpicker({style: 'btn-default', menuStyle: 'dropdown-inverse'});
    $('.edit').editable(function(value){
        return(value);
    }, {
        onblur: 'submit'
    });
});