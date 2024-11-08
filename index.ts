#!/usr/bin/env node

import spawn from "cross-spawn";
import fs from "fs";
import path from "path";
import chalk from "chalk";



const isObject = (o: unknown): o is object => typeof o === 'object';
const $ex = (strings: TemplateStringsArray, ...args: unknown[]) => {
	let cmd = '';
	let argues = [];
	let options = {stdio: 'inherit'};
	for(let i = 0; i<strings.length; i++){
		cmd = strings[i]
		if(args.length <= i) continue;
		const arg = args[i];
		if(isObject(arg)) options = {...options, ...arg}
		else cmd += arg;
	}
	const [c, ...md] = cmd.split(' ');
	const res = spawn.sync(c, md, options)
	if(res.error) throw res.error;
	return res;
	
	
}
const [name, ...args] = process.argv.slice(2);

const PROJECT_PATH = path.join(process.cwd(), name);
const PROJECT_PACKAGE = path.join(PROJECT_PATH, "package.json");
const EXPRESS_PATH = path.join(PROJECT_PATH, "express");
//while developing
try{
	fs.rmSync(PROJECT_PATH, {recursive: true});
} catch (e) {}
const PROJECT_CWD = {cwd: PROJECT_PATH};
const VITE_CWD = {cwd: path.join(PROJECT_PATH, "vite")}
const EXPRESS_CWD = {cwd: EXPRESS_PATH}
console.log(chalk.cyan.bold('Setting up project:'), chalk.cyan(name), '@', chalk.blue(PROJECT_PATH));
//create the project directory.
fs.mkdirSync(PROJECT_PATH);

$ex`${PROJECT_CWD}npm init -y`;
$ex`${PROJECT_CWD}npm i -D concurrently`;
$ex`${PROJECT_CWD}npm create vite@latest vite`;
console.log(chalk.green("Vite environment setup at /vite"), chalk.cyan("Installing vite dependencies"));
$ex`${VITE_CWD}npm install`;
console.log(chalk.green("Installed vite dependencies"), chalk.cyan("Setting up express"));
fs.mkdirSync(EXPRESS_PATH);
fs.mkdirSync(path.join(EXPRESS_PATH, "src"));
fs.mkdirSync(path.join(EXPRESS_PATH, "src/controllers"));
fs.mkdirSync(path.join(EXPRESS_PATH, "src/routes"));
fs.mkdirSync(path.join(EXPRESS_PATH, "src/db"));

fs.cpSync(path.join(__dirname, "../express.package.json"), path.join(EXPRESS_PATH, "package.json"));
$ex`${EXPRESS_CWD}npm install`;
$ex`${EXPRESS_CWD}npm i cors`;

fs.writeFileSync(path.join(EXPRESS_PATH, '.env'), `
MONGO_URI=<YOUR MONGO URI HERE>
SERVER_PORT=3000
`)

fs.writeFileSync(path.join(EXPRESS_PATH, 'index.js'), `
const express = require("express");
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');

dotenv.config();
const { SERVER_PORT, MONGO_URI } = process.env;
if(MONGO_URI !== "<YOUR MONGO URI HERE>"){
	mongoose.connect(MONGO_URI);
	const db = mongoose.connection;
	db.on('error', (error) =>console.log("[MONGO] Database Error", error?.message)); 
	db.once('open', () => console.log("[MONGO] Connection successfull"));
}else{
	console.warn("No database URI has been provided");
}
const app = express();
app.set('trust proxy', 1);
app.use(cors({
	credentials: true,
	origin: ['http://localhost:3000', 'http://localhost:3001']
}));
app.use(express.json());
app.use(passport.initialize());
app.listen(SERVER_PORT, ()=>console.log("Listening on port", SERVER_PORT));
`)

console.log(chalk.green("Express environment setup at /express"), chalk.cyan("Installing dependencies"));

const data = JSON.parse(fs.readFileSync(PROJECT_PACKAGE).toString());
data.scripts.start = `concurrently "npm run dev --prefix vite" "npm run start --prefix express"`;
fs.writeFileSync(PROJECT_PACKAGE, JSON.stringify(data));







