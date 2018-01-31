# 9tensu_search  
Last edited: '2018-01-15T18:59:14.335Z'
### WTF is this?
- This is a bot to append information for your stuffs downloaded and extracted from *9tensu*.
- This may helps when you have downloaded **TONS OF THEM** and not having enough time to index well.
- >! Seems most of them have been processed maually (or by bot) before uploading. Unfortunately they are not containing enough information to let me import to iTunes fluently (and store effectively in HDD) and some of them are even have missing tag, fake codec etc.
### Why?
- I'm more than 1+ year behind the live music channel! 
- Current downloading progress: C91, partially
- Current filing progress: C91, partially
- Current listening progress: ARTS3, done
### Currently it supports:
Function | status | reason | comments
--- | --- | --- | ---
Searching Producer from given album title | done | This is the most time-consuming part after extracting. | Album title should be the extracted folder name, this is most likely a waste of time.
Rename folders from album title to grouped format | in progress | This is **MY** intention. I need event names, producer, title, (DISC_ID hopefully) and codec (and scans!) | All information are just scattered through the world. Argh.
Search and copy covers if avaliable | in progress | To refresh my FB icon. | This is the easiest part.
Fill MP3 tags before moving to foobar2000 | in progress | Most of them are incomplete isn't it? | I can do this after I gather enough informations
Given a label (CXX, M3-XX, RTSXX etc), spam through the search result and get all the download links | in progress | Then I can import the links to the waiting bots
Slack bot for notification | in progress | I will not watching them for hours. But I need to know the result when it comes | 
### How to use
- Sorry, no API docuement, no example, just try to read `app.js` and spam `init()` on every modules. 
- All modules read as **GLOBAL SETTINGS** in `app_modules/app_config.js`
- Btw, `npm install` and then `node app.js` and ~~GO TO SLEEP~~ let it be done. If you really have 500+ folders after hours of extraction, it may take another hours to process (but I can save days yay). ~~Maybe run with the mining machines is a good idea~~
### Next project 
- Just when I have tons of time.
- Same stuffs but in other sites. (I have a few of them)
- "Search - Navigate - Wait - Download - Extract - File - Edit - Import to mobile" in full auto. Around 20 distinct steps, very chaotic situations. Ultimate goal.  
### License
- MIT. Included in license.md. This is just a selfish personal project with no friends.
### Contact
- 6DammK9@gmail.com. Better contact me in this site.