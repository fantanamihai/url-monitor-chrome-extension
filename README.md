# url-monitor-chrome-extension

Chrome extension webRequest API demo consisting of

* a simple backend implementation (folder ```backend```)
* extension implementation (folder ```extension```)

### Backend
The backend server will print out any url sent out by the extension.
In order to run the server, execute the following commands in a ```node``` environment:

1.  ```npm install``` - to install necessary node modules
1. ```npm start``` - to run the backend server

### Extension
In order to load the extension, setup the following:

1. Chrome ```chrome://extensions/``` environment to ```Developer mode```
1. Press ```Load upacked``` button and load extension from ```extension``` folder
