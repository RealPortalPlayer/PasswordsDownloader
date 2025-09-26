// Purpose: Downloader for the passwords database
// Created on: 9/26/25 @ 1:24 AM

const {execSync} = require("child_process")
const {rmSync, existsSync, readFileSync, copyFileSync} = require("fs")
const {createInterface} = require("readline")

if (existsSync("output")) {
    console.log("Removing old output")
    rmSync("output", {
        recursive: true
    })
}

console.log("Downloading master")
execSync("git clone http://10.0.44.20:3000/Passwords/Master output")
console.log("Removing unneeded files")
rmSync("output/.gitignore")
rmSync("output/.git", {
    recursive: true
})
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

const print = () => {
    for (const project in urls)
        console.log(`${project}: ${urls[project].enabled}`)
}

const get = name => {
    for (const urlName in urls) {
        if (!urlName.toLowerCase().startsWith(name.toLowerCase()))
            continue

        return urlName
    }

    return null
}

console.log("Select your options:")
print()

const input = createInterface(process.stdin, process.stdout)

input.setPrompt("> ")
input.prompt(true)

input.on("line", line => {
    const commandArguments = line.split(" ")
    const commandName = commandArguments.shift()

    switch (commandName) {
        case "print":
            console.log("Current configuration:")
            print()
            break

        case "done":
            input.close()
            return

        case "cancel":
            process.exit(0)

        default:
            const name = get(commandName)

            if (name == null) {
                console.error("Invalid command and configuration name")
                break
            }

            if (commandArguments.length > 0)
                urls[name].enabled = commandArguments[0].toLowerCase() === "true" || parseInt(commandArguments[0]) >= 1

            console.log(`${name} = ${urls[name].enabled}`)
    }

    input.prompt(true)
})

input.on("close", () => {
    console.log("Processing configuration")

    for (const name in urls) {
        const url = urls[name]

        if (!url.enabled)
            continue

        console.log(`Getting: ${name}`)
        execSync(`git clone ${url.url} .tmp`)
        copyFileSync(`.tmp/${name}.kdbx`, `output/${name}.kdbx`)
        copyFileSync(`.tmp/${name}.keyx;`, `output/${name}.keyx;`)
        rmSync(".tmp", {
            recursive: true
        })
    }

    console.log(`Your package is now ready: ${process.cwd()}/output`)
    console.warn("It isn't recommended to write to this package, as any changes will be lost")
    console.warn("You are expected to re-run this command to update your package")
})

input.on("SIGINT", () => {
    console.log("cancel (ctrl+c)")

    if (existsSync(".tmp"))
        rmSync(".tmp")

    process.exit(0)
})