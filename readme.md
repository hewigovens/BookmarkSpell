### What is Bookmark Spell?

Bookmark Spell is a chrome extension, is an idea of bookmark based automator:

	Input: -> url/bookmark 
		   -> under different folder
		   -> take different actions:
		   		-> Archive, add tags/notes/full text for your bookmark
		   		-> Download, download and sync to your dropbox folder
		   		-> Tweet, send a tweet!

### Why not delicious/Pocket/Readability/etc…?

* For fun
* Your data is kept both Chrome and Dropbox
* Intuitive, just hit Command+D


### How it works(take Archive as example)

1. OAuth Dropbox for datastore
1. Listen to `chrome.bookmarks.onCreated`
2. Check bookmark.parentId is Archive folder
3. Show a popup to fill your tags/notes
3. Integrate readability parser API to get full text
4. Insert to Dropbox

### Todo List

* Download folder
* Tweet folder
* Configurable as option page
* Hosted App to provide search functionally
* Mobile client

### Credit

* SwitchySharp popup.css
* [iconfinder.com](https://www.iconfinder.com/icondetails/111113/256/book_bookmark_icon)