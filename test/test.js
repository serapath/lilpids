var lilpids = require('../')


var stream$ = lilpids()

stream$.on('error', function (error) { throw error })

stream$.on('data', function (pids) { console.log(pids) })

stream$.write([
  'node test/a.js',
  'node test/b.js'
])

setTimeout(function () {
  stream$.write([
    'node test/a.js'
  ])
}, 15000)
