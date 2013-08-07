function DisplayBookmarks(bookmarks){
    $.each(bookmarks, function(index, object){
        var bookmark = $('<article class="bookmark"></article>');
        bookmark.append($(sprintf('<a id="url" href="%s" title="%s">from %s</a>', 
            object.url, object.title, object.domain)));
        var reading_time = parseInt(object.word_count/120);
        if (reading_time == 0 || reading_time == NaN) {
            reading_item = 1;
        }

        bookmark.append($(sprintf('<span id="reading_time" class="reading-time">%d min read</span>', reading_time)));
        bookmark.append($(sprintf('<h2><a id="title" href="%s" title="%s">%s</a></h2>', 
            object.url, object.title, object.title)));
        
        bookmark.append($(sprintf('<p id="excerpt">%s</p>', object.excerpt)));
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
      console.log(request);
      localStorage.setItem('RecentBookmarks', JSON.stringify(request));
      DisplayBookmarks(request);
      sendResponse('recent_bookmars page received bookmarks');
});

setTimeout(function(){
   DisplayBookmarks(JSON.parse(localStorage.getItem('RecentBookmarks'))); 
},2000);