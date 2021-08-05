const express = require('express')
const app = express()
const { ExpressPeerServer } = require('peer')

app.use(express.static('static'))

const server = app.listen(33333, () => {
    console.log('server running')
})

const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/'
});

app.use('/api', peerServer)