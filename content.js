// functions

// Main

chrome.extension.onMessage.addListener(function(message){
    alert('receive message from background page');
    console.log(message);
});