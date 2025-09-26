// Purpose: Downloader for the passwords database
// Created on: 9/26/25 @ 1:24 AM

const {execSync} = require("child_process")
const {rmSync, existsSync, readFileSync} = require("fs")
const {createInterface} = require("readline")
const url = require("node:url");

if (existsSync("output")) {
    console.log("Removing old output")
    rmSync("output", {
        recursive: true
    })
}

console.log("Downloading master")
execSync("git clone http://10.0.44.20:3000/Passwords/Master output")
console.log("Parsing optional password databases")

const readmeOriginal = readFileSync("output/README.md").toString().trim()
let urls = {}

for (const project of readmeOriginal.split("\n")) {
    let name = project.substring(3)
    let url = project.substring(project.indexOf("(") + 1)

    name = name.substring(0, name.indexOf("]"))
    url = url.substring(0, url.length - 1)
    urls[name] = {
        url,
        enabled: false
    }
}

console.log("Select your options:")

for (const project in urls)
    console.log(`${project}: ${urls[project].enabled}`)

const input = createInterface(process.stdin, process.stdout)

input.setPrompt("> ")
input.prompt(true)

input.on("line", input => {
    console.log(input)
})