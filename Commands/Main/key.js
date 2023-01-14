const { SlashCommandBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");

const { embedColor, whitelisted, perm_users } = require("../../config.json");

const wait = require('node:timers/promises').setTimeout;
const createEmbed = require("../../Modules/embed.js").new

const db = new QuickDB()

function dm(user, title, desc, returnMessage) {
    try {
        user.createDM({ force: true })
        const msg = user.send({
            embeds: [createEmbed({
                title,
                desc,
                color: embedColor
            })]
        })
        if (returnMessage)
            return msg
    } catch (e) {
        console.log(e)
    }
}

function hasKey(data) {
    if (!data || data == null || data == "" || !data.Key || data.Key == null || data.Key == "") {
        return false
    } else {
        return true
    }
}

function hasPermanentKey(data) {
    if (!data || data == null || data == false) {
        return false
    } else {
        return true
    }
}

function generateKey(length) {
    const chars = "0AaBbC1cDdEe2FfGgH3hIiJj4KkLlM5mNnOo6PpQqR7rSsTt8UuVvW9wXxYy0Zz".split("").join(" ").split(" ")
    let key = ""
    for (let i = 0; i < length; i++) {
        key += chars[Math.floor(Math.random() * chars.length)]
    }
    return key
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('key')
        .setDescription('Perform actions with keys.')

        .addSubcommand(subcommand => subcommand
            .setName('generate')
            .setDescription('Generates a key.'))

        .addSubcommand(subcommand => subcommand
            .setName('generate_perm_key')
            .setDescription('Generates a permanent key. You must be an approved donor to use this.'))

        .addSubcommand(subcommand => subcommand
            .setName('check')
            .setDescription('Checks to see if you have a valid key.'))

        .addSubcommand(subcommand => subcommand
            .setName('invalidate')
            .setDescription('Invalidates, deletes, and expires your key.'))

    , async execute(interaction) {
        const userData = await db.pull("keys", (data) => data.KeyHolder == interaction.user.id)
        const userPermData = await(db.pull("perm_owners", (id) => id == interaction.user.id))
        console.log(userPermData)

        if (interaction.options.getSubcommand() === 'generate') {
            console.log("Checking if user has key...")

            if (hasKey(userData)) {
                interaction.reply({
                    content: "You already have a valid key.",
                    ephemeral: true
                })
                console.log(`${interaction.user.tag} tried to generate a key, but it failed.`)
            } else {

                const generatedKey = generateKey(22)

                await db.add("keys", {
                    Key: generatedKey,
                    KeyHolder: interaction.user.id
                })

                interaction.reply({
                    content: "Chcek your dms for the new key!",
                    ephemeral: true
                })

                try {
                    interaction.user.createDM({ force: true })
                    interaction.user.send({
                        embeds: [createEmbed({
                            title: "Key Check Successful",
                            desc: "Generating key...",
                            color: embedColor
                        })]
                    }).then(async msg => {
                        await interaction.guild.channels.fetch(whitelisted).then(c => c.send({
                            content: `User: ${interaction.user}`,
                            embeds: [createEmbed({
                                title: `Whitelisted User: ${interaction.user.tag} (${interaction.user.id})`,
                                desc: `User Id: ${interaction.user.id}\nUsername: ${interaction.user.tag}\nStatus: **Whitelisted**\n\nKey: **${generatedKey}**\nExpires: <t:${Math.round(Date.now() / 1000 + 24 * 3600)}:R>`
                            })]
                        }))

                        await wait(3000)
                        msg.edit({
                            embeds: [createEmbed({
                                title: "Key Generation Successful",
                                desc: `Your new key is: **${generatedKey}**`
                            })]
                        })
                    })
                } catch (e) {
                    console.log(e)
                }

                console.log(`Generated key for ${interaction.user.tag}: ${generatedKey}`)

                await wait(5000) // 86400000

                await db.delete(interaction.user.id)
                await db.
                dm(interaction.user, "Key Expired", "Your key has expired. Go to the <#1046939006375563275> channel to generate another!")

                await interaction.guild.channels.fetch(whitelisted).then(async c => {
                    let msg = await c.messages.fetch().then(msgs =>
                        msgs.filter(m => m.content.includes(interaction.user.id)))

                    if (!msg.content)
                        msg = msg.first()
                    
                    if (!msg || msg.content.includes('EXPIRED'))
                        return;

                    msg.edit({
                        embeds: [createEmbed({
                            content: `User: ${interaction.user}`,
                            title: `Whitelisted User: ${interaction.user.tag} (${interaction.user.id}) (EXPIRED)`,
                            desc: `User Id: ${interaction.user.id}\nUsername: ${interaction.user.tag}\nStatus: **Expired**\n\nKey: **${generatedKey}**`,
                            color: "ff2121"
                        })]
                    })
                })
            }
        }
        else if (interaction.options.getSubcommand() === 'check') {
            console.log("Checking if user has key...")

            if (!hasKey(userData)) {
                interaction.reply({
                    content: "You have no active keys in our database.",
                    ephemeral: true
                })
                console.log(`${interaction.user.tag} tried to check their key, but it failed.`)
            } else {
                interaction.reply({
                    content: "Check your dms for your key!",
                    ephemeral: true
                })
                dm(interaction.user, "Key Check Successful", `Your current key is: **${userData.Key}**`)
                console.log(`${interaction.user.tag} checked their key.`)
            }
        }
        else if (interaction.options.getSubcommand() === 'invalidate') {
            console.log("Checking if user has key...")

            if (!hasKey(userData)) {
                interaction.reply({
                    content: "You have no active keys in our database.",
                    ephemeral: true
                })
                console.log(`${interaction.user.tag} tried to check their key, but it failed.`)
            } else {

                const key = userData.Key
                await db.delete(interaction.user.id)

                interaction.reply({
                    content: `Successfully invalidated key: **${key}**`,
                    ephemeral: true
                })

                await interaction.guild.channels.fetch(whitelisted).then(async c => {
                    let msg = await c.messages.fetch().then(msgs =>
                        msgs.filter(m => m.content.includes(interaction.user.id)))

                    if (!msg.content)
                        msg = msg.first()
                    
                    if (!msg || msg.content.includes('EXPIRED'))
                        return;

                    msg.edit({
                        embeds: [createEmbed({
                            content: `User: ${interaction.user}`,
                            title: `Whitelisted User: ${interaction.user.tag} (${interaction.user.id}) (EXPIRED)`,
                            desc: `User Id: ${interaction.user.id}\nUsername: ${interaction.user.tag}\nStatus: **Expired**\n\nKey: **${key}**`,
                            color: "ff2121"
                        })]
                    })
                })

                console.log(`${interaction.user.tag} invalidated their key: ${key}`)
            }
        }
        else if (interaction.options.getSubcommand() === 'generate_perm_key') {
            console.log("Checking if user has key...")

            if (hasPermanentKey(userPermData)) {
                const data = await db.pull("perm_keys", (ownerData) => ownerData.KeyHolder == interaction.user.id)
                interaction.reply({
                    content: `You already have a permanent in our database: ${data.Key}\n*DM Lightstrap#0658 for inquiries about your key.*`,
                    ephemeral: true
                })
                console.log(`${interaction.user.tag} tried to generated a permanent key, but it failed.`)
            } else {
                const generatedKey = generateKey(32)

                console.log(`Old: ${userPermData}`)

                const oldData = await db.get("perm_owners")
                oldData = oldData.assign(interaction.user.id, true)

                console.log(`New: ${oldData}`)

                await db.set("perm_owners", oldData)
                await db.add("perm_keys", {
                    Key: generatedKey,
                    KeyHolder: interaction.user.id
                })

                interaction.reply({
                    content: "Chcek your dms for the new permanent key!",
                    ephemeral: true
                })

                try {
                    interaction.user.createDM({ force: true })
                    interaction.user.send({
                        embeds: [createEmbed({
                            title: "Key Check Successful",
                            desc: "Generating permanent key..."
                        })]
                    }).then(async msg => {
                        await interaction.guild.channels.fetch(perm_users).then(c => c.send({
                            content: `User: ${interaction.user}`,
                            embeds: [createEmbed({
                                title: `Permanent Key Owner: ${interaction.user.tag} (${interaction.user.id})`,
                                desc: `User Id: ${interaction.user.id}\nUsername: ${interaction.user.tag}\nStatus: **Perm-Owner**\n\nKey: **${generatedKey}**`
                            })]
                        }))

                        await wait(3000)
                        msg.edit({
                            embeds: [createEmbed({
                                title: "Key Generation Successful",
                                desc: `Your permanent key is: **${generatedKey}**\n\n**SAVE THIS SO YOU DON'T LOSE IT!!** *If you do end up losing it (or for whatever reason), DM Lightstrap#0658 to invalidate and generate a new one.*`
                            })]
                        })
                    })
                } catch (e) {
                    console.log(e)
                }

                console.log(`${interaction.user.tag} generated a permanent key: ${generatedKey}`)
            }
        }
        else if (interaction.options.getSubcommand() === 'invalidate_perm_key') {
            console.log("Checking if user has key...")

            if (!hasPermanentKey(userPermData)) {
                interaction.reply({
                    content: "You have no active permanent keys in our database.",
                    ephemeral: true
                })
                console.log(`${interaction.user.tag} tried to check their key, but it failed.`)
            } else {

                const key = await db.pull("perm_keys", (ownerData) => ownerData.KeyHolder == interaction.user.id).Key

                const oldData = await db.pull("perm_keys", (ownerData) => ownerData.KeyHolder == interaction.user.id)
                oldData = delete oldData.

                interaction.reply({
                    content: `Successfully invalidated key: **${key}**`,
                    ephemeral: true
                })

                await interaction.guild.channels.fetch(whitelisted).then(async c => {
                    let msg = await c.messages.fetch().then(msgs =>
                        msgs.filter(m => m.content.includes(interaction.user.id)))

                    if (!msg.content)
                        msg = msg.first()
                    
                    if (!msg || msg.content.includes('EXPIRED'))
                        return;

                    msg.edit({
                        embeds: [createEmbed({
                            content: `User: ${interaction.user}`,
                            title: `Whitelisted User: ${interaction.user.tag} (${interaction.user.id}) (EXPIRED)`,
                            desc: `User Id: ${interaction.user.id}\nUsername: ${interaction.user.tag}\nStatus: **Expired**\n\nKey: **${key}**`,
                            color: "ff2121"
                        })]
                    })
                })

                console.log(`${interaction.user.tag} invalidated their key: ${key}`)
            }
        }
    }
}