function DisplayBookmarks(bookmarks){
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
                var more = $('<a class="read_more"> read more</a>');
                more.on('click', function(){
                    var content = bookmark.find('.content');
                    var click_again = content.is(':visible');
                    if (click_again) {
                        content.toggle();
                    } else {
                        content.toggle();
                        $('.content').not(content).hide();
                        $(window).scrollTop(bookmark.position().top);
                    }
                    $('.read_more').text(' read more');    
                    if (content.is(':visible')) {
                        more.text(' collapse');
                    } else {
                        more.text(' read more');
                    }
                });
                excerpt.append(more);

                bookmark.append(excerpt);

                var content = $(sprintf('<div class="content" hidden>%s<div class="clearfix"></div></div>', object.content));
                bookmark.append(content);

            } else {
                bookmark.append(excerpt);
            }
        }
        
        bookmark.append($(sprintf('<blockquote><p>%s</p></blockquote>', object.notes)));
        
        var tags = object.tags.split(',');
        var tag_container = $('<div id="tags" class="tagsinput" style="height: 100%;"></div>');
        $.each(tags, function(index, tag){
            var tag_item = $(sprintf('<span class="tag">%s </span>', tag));
            tag_item.on('click', function(){
                console.log('tag clickd:',tag);
                var all_tag = $('.tagsinput');
                $.each(all_tag, function(index, object){
                    var li = $(object.parentNode);
                    var div = $(object);
                    if ($.inArray(tag, div.text().trim().split(" ")) == -1) {
                        li.hide();
                    }
                });
            });
            tag_container.append(tag_item);
        });
        bookmark.append(tag_container);
        bookmark.append($('<hr>'));

        $('#bookmarks').append(bookmark);
    });
}

function DisplayTagstats(){
    var tag_stats = JSON.parse(localStorage.getItem('RecentTagStats'));
    var ul = $('#tagstats');
    $.each(tag_stats, function(key, value){
        ul.append($(sprintf('<li>%s (%d)</li>',key,value.length)));
    });
    $('#input_tag_filter').bind("enterKey",function(event){
        console.log(this.val());
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
      DisplayTagstats();
      sendResponse('recent_bookmars page received bookmarks');
});

$(document).on('ready', function(){
    console.log('==> document.ready');
    chrome.tabs.getCurrent(function(tab){
        console.log('==> query bookmarks form backgroud.js');
        chrome.runtime.sendMessage({action:'loadBookmarks', from:document.URL, from_tab_id:tab.id});
    });
});