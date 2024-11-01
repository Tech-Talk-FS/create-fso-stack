const fs = require('fs').promises;
const spawn = require('cross-spawn');
const path = require('path');

const CLIENT_DIRECTORY = path.join(process.cwd(), 'client');
const SERVER_DIRECTORY = path.join(process.cwd(), 'server');

fs.mkdir(CLIENT_DIRECTORY)
.then(()=>{
	//run vite
})
.then(fs.mkdir(SERVER_DIRECTORY))
.then(()=>{
	// install express.
})