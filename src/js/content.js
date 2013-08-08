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
    var title = document.getElementById('title');
    title.innerText = message.title

    var url = document.getElementById('url');
    url.innerText = message.url;

    document.getElementById('submit_button').onclick = function(){
        console.log('send tags/note back to background');

        var tags = document.getElementById('tags');
        var notes = document.getElementById('notes');

        message.tags = tags.value;
        message.notes = notes.value;

        message.from = document.URL;

        chrome.runtime.sendMessage(message);

        window.close();
    };    

    sendResponse('==> bookmark message received.');
    }
);