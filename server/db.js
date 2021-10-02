const MongoClient = require('mongodb').MongoClient
const config = require('./config.json')

const connect = async function() {
    const uri = `mongodb+srv://modos:${config.db.password}@chatnodesocket.mdxoy.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`

    const client = new MongoClient(uri)

    try {
        await client.connect()
        
    } catch (error) {
        console.log(error)
    }
    
    return client
}


const findUserPhoto = async function(sessionID) {
    const client = await connect()
    let image = null
    try {
        image = (await client.db(config.db.name).collection('users').findOne({sessionID: sessionID}, {image: 1})).image
    } catch (error) {
        image = "null"
    }

    return image
}

const existedUser = async function (client, username, email) {
    return await client.db(config.db.name).collection('users').find({ $or: [ { username:  username }, { email: email } ] }).toArray()
}

const allUser = async function (client) {
    return await client.db(config.db.name).collection('users').find({}).toArray()
}

const user = async function (client, username, password) {
 return await client.db(config.db.name).collection('users').find({ $and: [ { username:  username }, { password: password } ] }).toArray()
}

const uploadAvatar = async function (client, username, path) {
    await client.db(config.db.name).collection('users').updateOne({
        username: username
    }, {
        $set: {
            image: path
        }
    })
}

module.exports = {
    findUserPhoto,
    connect,
    existedUser,
    allUser,
    user,
    uploadAvatar
}