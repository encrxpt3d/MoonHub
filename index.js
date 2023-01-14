require('dotenv').config()

const { Partials, Client, Collection, GatewayIntentBits } = require('discord.js')
const { QuickDB } = require("quick.db");

const path = require('node:path');
const wrench = require("wrench");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.commands = new Collection();

//-------------------------------------------------------------------------------------------

const toSearch = "./Handlers"
const files = wrench.readdirSyncRecursive(toSearch)

files.forEach(async (file) => {
  if (file.endsWith('.js')) {
    const filePath = './' + path.join(toSearch, file);
    const handler = require(filePath)
    if ('execute' in handler) {
      handler.execute(client)
    }
  }
})

//-------------------------------------------------------------------------------------------

const db = new QuickDB()

if (db.get("keys") == null) {
  console.log("\"keys\" was not found in the database; creating new data...")
  db.set("keys", {})
}

if (db.get("perm_keys") == null) {
  console.log("\"perm_keys\" was not found in the database; creating new data...")
  db.set("perm_keys", {})
}

if (db.get("perm_owners") == null) {
  console.log("\"perm_owners\" was not found in the database; creating new data...")
  db.set("perm_owners", {
    "800889873061773342": false,
    "364572358700302346": false,
    "584617022239932447": false
  })  
}

//-------------------------------------------------------------------------------------------

const server = require("./server")
server()

const token = process.env['TOKEN']
client.login(token)