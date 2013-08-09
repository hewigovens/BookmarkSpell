// Main

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse){
        console.log('==> content.js onMessage');
        if (sender.url === document.URL) {
            console.log("==> pass message sent by self");
            return;
        }
        var message = request;
        console.log(sprintf('==> receive bookmark %s:%s', message.title, message.url));

        $('#title').text(message.title);
        $('#url').text(message.url);
        var options = $('#folder_select option');

        $.each(options, function(index, option){
            if (option.value === request.parentId) {
                console.log(sprintf('set %s %s selected', option.value, option.text));
                $('.filter-option').text(option.text);
                $('select[name=folder_list]').val(option.value);
                return false;
            };
        });

        $('#submit_button').on('click', function() {
            console.log(message);('send tags/note back to background');

            message.tags = $('#tags').val();
            message.notes = $('#notes').val();

            message.from = document.URL;
            if (message.parentId !== $('select[name=folder_list]').val()) {
                message.old_parentId = message.parentId;
                message.parentId = $('select[name=folder_list]').val();
            }

            chrome.runtime.sendMessage(message);

            window.close();
        });  
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
});