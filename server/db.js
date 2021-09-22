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

    console.log(image)

    return image
}

module.exports = {
    findUserPhoto
}