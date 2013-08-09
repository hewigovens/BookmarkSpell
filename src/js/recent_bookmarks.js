function DisplayBookmarks(bookmarks){

    var old_bookmarks = $('li');
    $.each(old_bookmarks, function(index, object){
      object.remove();
    });

    $.each(bookmarks, function(index, object){
        var bookmark = $(sprintf('<li class="bookmark" id="li%s"></li>', object.chrome_id));
        bookmark.append($(sprintf('<a id="url" href="%s" title="%s">from %s</a>', 
            object.url, object.title, object.domain)));
        var reading_time = parseInt(object.word_count/120);
        if (reading_time == 0 || isNaN(reading_time)) {
            reading_time = 1;
        }

        bookmark.append($(sprintf('<span id="reading_time" class="reading-time">%d min read</span>', reading_time)));
        var remove_button = $(sprintf('<span id="%s" class="fui-cross"></span>', object.chrome_id));
        remove_button.on('click', function(sender){
            $('#li'+sender.target.id).hide();
            console.log(sender.target.id);
            chrome.tabs.getCurrent(function(tab){
                console.log('==> query bookmarks form backgroud.js');
                chrome.runtime.sendMessage({action:'removeBookmark', remove_id: sender.target.id, from:document.URL, from_tab_id:tab.id});
            });
        });
        bookmark.append(remove_button);
        bookmark.append($(sprintf('<h2><a id="title" href="%s" title="%s">%s</a></h2>', 
            object.url, object.title, object.title)));
        
        
        if (object.excerpt) {
            var excerpt = $(sprintf('<p id="excerpt">%s</p>', object.excerpt));

            if (object.content) {
                var more = $('<a> read more</a>');
                more.on('click', function(){
                    var content = bookmark.find('.content');
                    content.toggle();
                });
                excerpt.append(more);

                bookmark.append(excerpt);
                bookmark.append($(sprintf('<div class="content" hidden>%s<div class="clearfix"></div></div>', object.content)));

            } else {
                bookmark.append(excerpt);
            }
        }
        
        bookmark.append($(sprintf('<blockquote><p>%s</p></blockquote>', object.notes)));
        
        var tags = object.tags.split(',');
        var tag_container = $('<div id="tags" class="tagsinput" style="height: 100%;"></div>');
        $.each(tags, function(index, tag){
            tag_container.append($(sprintf('<span class="tag"><span>%s&nbsp;&nbsp;</span></span>', tag)));
        });
        bookmark.append(tag_container);
        bookmark.append($('<hr>'));

        $('#bookmarks').append(bookmark);
    });
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse){
      if (sender.url === document.URL) {
          console.log("==> pass message sent by self");
          return;
      }
      console.log(request);
      DisplayBookmarks(request);
      sendResponse('recent_bookmars page received bookmarks');
});

// setTimeout(function(){
//    DisplayBookmarks(JSON.parse(localStorage.getItem('RecentBookmarks'))); 
// },2000);

$(document).on('ready', function(){
    console.log('==> document.ready');
    chrome.tabs.getCurrent(function(tab){
        console.log('==> query bookmarks form backgroud.js');
        chrome.runtime.sendMessage({action:'loadBookmarks', from:document.URL, from_tab_id:tab.id});
    });
});