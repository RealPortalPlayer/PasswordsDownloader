// Purpose: Downloader for the passwords database
// Created on: 9/26/25 @ 1:24 AM

const {execSync} = require("child_process")
const {rmSync, existsSync} = require("fs")

if (existsSync("output")) {
    console.log("Removing old output")
    rmSync("output", {
        recursive: true
    })
}

console.log("Downloading master")
execSync("git clone http://10.0.44.20:3000/Passwords/Master output")