const express = require('express')
const app = express()
const expressWs = require('express-ws')(app)
const uuid = require('uuid')
const counters = {}

app.use(express.static('static'))

app.ws('/', function(ws, req) {
    let counterId = req.query.id || uuid.v4()
    ws.on('message', function(msg) {
        try {
            let obj = JSON.parse(msg)
            switch (obj.type) {
                case 'get-uid':
                    ws.send(JSON.stringify({
                        type: 'get-uid',
                        uid: counterId
                    }))
                    break
                case 'set-uid':
                    counterId = obj.uid
                    ws.send(JSON.stringify({
                        type: 'set-uid',
                        uid: counterId
                    }))
                    break
                case 'get-state':
                    checkState(counterId)
                    ws.send(JSON.stringify({
                        type: 'get-state',
                        state: counters[counterId],
                        nextUpdate: !isNaN(counters[counterId].resetAt) && counters[counterId].resetAt != null ? new Date(counters[counterId].resetAt).toISOString() : null
                    }))
                    break
                case 'set-armor-level':
                    setArmorLevel(counterId, obj.armorLevel)
                    ws.send(JSON.stringify({
                        type: 'set-armor-level',
                        armorLevel: counters[counterId].armorLevel
                    }))
                    break
                case 'set-tools-level':
                    setToolsLevel(counterId, obj.toolsLevel)
                    ws.send(JSON.stringify({
                        type: 'set-tools-level',
                        toolsLevel: counters[counterId].toolsLevel
                    }))
                    break
                case 'set-timer':
                    setTimer(counterId, obj.timer)
                    ws.send(JSON.stringify({
                        type: 'set-timer',
                        timer: counters[counterId].timer
                    }))
                    break
                case 'reset-timer':
                    checkState(counterId)
                    resetTimer(counterId)
                    break
                case 'manual-set-reset-date':
                    setResetAt(counterId, obj.resetAt)
                    ws.send(JSON.stringify({
                        type: 'manual-set-reset-date',
                        resetAt: new Date(counters[counterId].resetAt).toISOString()
                    }))
                    break
            }
        } catch (e) {
            console.error(e)
        }
    })
})

function checkState(counterId) {
    if (!counters[counterId]) {
        counters[counterId] = {
            timer: 3600000,
            armorLevel: 1,
            toolsLevel: 1,
        }
        console.log(`New timer with id ${counterId}`)
        resetTimer(counterId)
    }
}

function resetTimer(counterId) {
    const counter = counters[counterId]
    
    counter.resetAt = counter.timer != 0 ? ((+new Date()) + counter.timer) : null
}

function setArmorLevel(counterId, armorLevel) {
    checkState(counterId)
    counters[counterId].armorLevel = armorLevel
}

function setToolsLevel(counterId, toolsLevel) {
    checkState(counterId)
    counters[counterId].toolsLevel = toolsLevel
}

function setTimer(counterId, timer) {
    checkState(counterId)
    counters[counterId].timer = timer
}

function setResetAt(counterId, resetAt) {
    checkState(counterId)
    counters[counterId].resetAt = +new Date(resetAt)
}

setInterval(() => {
    for (let counterId in counters) {
        const counter = counters[counterId]
        if (!counter.resetAt) {
            continue
        }
        let currentDate = new Date()
        if (currentDate >= counter.resetAt) {
            if (counter.armorLevel < 6) {
                counter.armorLevel++
            }
            if (counter.toolsLevel < 6) {
                counter.toolsLevel++
            }
            resetTimer(counterId)
        }
    }
}, 1000)

const server = app.listen(33333, () => {
    console.log('server running')
})
