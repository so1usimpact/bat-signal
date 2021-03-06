var webPush = require('web-push')
var fs = require('fs')
var bodyParser = require('body-parser')

// Lets users subscribe to push notifications
// Sends demo push notifications
module.exports = {init}

var subscribers = []

var keys = null
try {
  keys = JSON.parse(fs.readFileSync('keys.json'))
} catch (e) {
  console.log('warning: couldn\'t read keys.json - run ./scripts/generate-keys.js')
}

function init (app) {
  app.use(bodyParser.json())
  app.post('/', handlePost)
}

function handlePost (request, response) {
  var message = request.body
  console.log('Got a message: ' + message.type)
  var sub = message.subscription

  if (message.type === 'subscribe') {
    // TODO: save subscribers to a DB, probably SQLite
    // For now, test by notifying all clients 10 secs after a test client signs up
    console.log('Got a new subscriber. Notifying all subscribers in 10 seconds...')
    subscribers.push(sub)
    setTimeout(notifyAll, 10000)
  } else if (message.type === 'unsubscribe') {
    var index = subscribers.findIndex(function (x) { return x.keys.p256dh === sub.keys.p256dh })
    if (index < 0) return console.error('Cannot unsubscribe, cannot find ' + sub.guid)
    subscribers = subscribers.splice(index, 1)
  } else {
    console.error('dropping unknown message type ' + message.type)
  }
  response.end()
}

function notifyAll () {
  var message = {
    title: 'YIMBY Action Alert',
    body: 'The monthly meeting is tonight at 6pm. Be there!',
    link: 'https://www.facebook.com/events/1658617224431604/',
    actions: [
      {
        action: 'show-map',
        title: 'Show Map',
        link: 'https://goo.gl/maps/6nDQRB6VsKB2'
      }
    ]
  }
  console.log('Notifying %d subscribers', subscribers.length)
  subscribers.forEach(function (subscriber) {
    notify(subscriber, message)
  })
}

function notify (subscriber, message) {
  var options = {
    vapidDetails: {
      subject: 'mailto://boss@batsign.al',
      publicKey: keys.publicKey,
      privateKey: keys.privateKey
    }
  }
  webPush.sendNotification(subscriber, JSON.stringify(message), options)
}
