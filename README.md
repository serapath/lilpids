# lilpids
Dead simple process manager with few features (features cli &amp; programmatic use)

inspiration comes from the [`lil-pids`](https://www.npmjs.com/package/lil-pids) module from [@mafintosh](https://www.npmjs.com/~mafintosh)

![omg](http://forgifs.com/gallery/d/27703-5/Excited-kid-birthday-party.gif?)

# usage

`npm install -g lilpids`

It can either be used as a cli-tool (see [`lil-pids`](https://www.npmjs.com/package/lil-pids))

Otherwise, it also can be used programmatically.

```js
var lilpids = require('lilpids')

var stream$ = lilpids()

stream$.on('error', function (error) {
  throw error
})

stream$.on('data', function (pids) {
  console.log(pids) // e.g.
  /*
  [ { pid: '15679', service: 'node test/a.js' },
    { pid: '15685', service: 'node test/b.js' } ]
  */
})

stream$.write([
  'node test/a.js',
  'node test/b.js'
])

setTimeout(function () {
  stream$.write([ 'node test/a.js' ])
}, 15000)

```

It'll watch the stream so every time you pipe an update, old processes no longer referenced in the update will be shutdown and any new ones will be spawned.

lilpids will forward all stdout, stderr to its own stdout, stderr prefixed with the process id.

It will also tell you when a command has been spawned, exited and finally it will restart processes when they crash/end.

lilpids will also push an array of the pids of the current running processes to the stream every time there is a change, so you can listen for them

# license

MIT
