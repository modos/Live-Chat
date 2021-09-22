const MongoClient = require('mongodb').MongoClient
const config = require('./config.json')
const crypto = require("crypto");
const randomId = () => crypto.randomBytes(8).toString("hex")
const formidable = require('formidable')
const fs = require('fs')
const serveHandler = require('serve-handler')
module.exports = async function requestHandler(req, res) {
    
    const headers = {
        "Access-Control-Allow-Origin": "http://localhost:8080",
        "Access-Control-Allow-Methods": "OPTIONS, POST, GET",
        "Access-Control-Allow-Headers": ['Content-Type', 'Authorization']
      }

    if (req.method === "OPTIONS") {
        res.writeHead(204, headers);
        res.end()
        return
      }


    const uri = `mongodb+srv://modos:${config.db.password}@chatnodesocket.mdxoy.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`

    const client = new MongoClient(uri)

    try {
        await client.connect()
    } catch (error) {
        console.log(error)
    }


    if (req.url === '/users' && req.method === 'POST') {

        let body = ''
        req.on('data', function(data) {
        body += data

        try {
            const data = JSON.parse(body)
            if (data.username && data.password && data.email) {
                client.db(config.db.name).collection('users').find({ $or: [ { username:  data.username }, { email: data.email } ] }).toArray((err, result) => {

                    if (!result.length > 0) {

                        data.sessionID = randomId()

                        client.db(config.db.name).collection('users').insertOne(data)

                        res.writeHead(200, {
                            "Access-Control-Allow-Origin": "http://localhost:8080",
                             'Content-Type': 'application/json' })
                        res.write(JSON.stringify({
                             message: 'user signed up successfuly',
                             sessionID: data.sessionID,
                             username: data.username
                            }))
                        res.end()

                    }else {
                        res.writeHead(400, {
                            "Access-Control-Allow-Origin": "http://localhost:8080",
                             'Content-Type': 'application/json' })
                        res.write(JSON.stringify({ message: 'user has already existed' }))
                        res.end()
                    }
                })
            }else {
                res.writeHead(400, {
                    "Access-Control-Allow-Origin": "http://localhost:8080",
                     'Content-Type': 'application/json' })
                res.write(JSON.stringify({ message: 'credentials are not correct' }))
                res.end()
            }
        } catch (error) {
            console.log(error)
        }

        })


    }else if (req.url === '/users' && req.method === 'GET') {
        const data = await client.db(config.db.name).collection('users').find({}).toArray()

        res.writeHead(200, { 'Content-Type': 'application/json', 
        "Access-Control-Allow-Origin": "http://localhost:8080"
     })
        res.write(JSON.stringify(data))
        res.end()


    }else if ( req.url === '/login' && req.method === 'POST') {
        let body = ''
        req.on('data', async function(data) {
        body += data

        try {
            const data = JSON.parse(body)

            if (data.username && data.password) {

                const r = await client.db(config.db.name).collection('users').find({ $and: [ { username:  data.username }, { password: data.password } ] }).toArray()

                if (r.length > 0) {
                    res.writeHead(200, {
                        "Access-Control-Allow-Origin": "http://localhost:8080",
                         'Content-Type': 'application/json' })
                    res.write(JSON.stringify({
                         message: 'user Logged in successfuly',
                         sessionID: r[0].sessionID,
                         username: r[0].username
                        }))
                    res.end()
                }else {
                    res.writeHead(400, {
                        "Access-Control-Allow-Origin": "http://localhost:8080",
                         'Content-Type': 'application/json' })
                    res.write(JSON.stringify({
                         message: 'user does not exist or an internal error, try again',
                        }))
                    res.end()
                }
           }
        
        } catch (error) {
            console.log(error)
        }

        })
    }else if (req.url === '/uploadPhoto') {
        let username = ''
        let path = ''
        const form = new formidable.IncomingForm()
        form.parse(req, function (err, fields, files) {
          username = fields.username
          const oldpath = files.image.path
          const newName = randomId() + files.image.name
          const newpath = './uploads/' +  newName
          path = newName
          fs.rename(oldpath, newpath, async function (err) {
            if (err) throw err
            
            res.writeHead(200, {
                "Access-Control-Allow-Origin": "http://localhost:8080",
                'Content-Type': 'application/json' })
                res.write(JSON.stringify({
                    message: 'uploaded successfully',
                    image: "http://localhost:3000/uploads/" + newName
                }))

                
            res.end()
                        
            try {
                await client.db(config.db.name).collection('users').updateOne({
                    username: username
                }, {
                    $set: {
                        image: path
                    }
                })
            } catch (error) {
                console.log(error)
            }
            })
            
        })
    }else {

        await serveHandler(req, res, {
            renderSingle: true
        })
    }
}