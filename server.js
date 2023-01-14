const { QuickDB } = require("quick.db");
const db = new QuickDB()

const bodyParser = require("body-parser")
const express = require('express')

const server = express()

server.use(bodyParser.json());
server.post('/', (req, res) => {
    const key = req.body.Key
    const HWID = req.body.HWID

    console.log(key, HWID)

    const data = db.pull("keys", (data) => data.Key == key)

    if (!data.HWID) {
        console.log("This user is unverified.")
        res.send("unverified")
        return
    }

    if (data.HWID == HWID) {
        console.log("Verified.")
        res.send("approved");
    }
});

module.exports = function() {
    server.listen(3000, () => {
        console.log("[SERVER]: Online")
    })
}