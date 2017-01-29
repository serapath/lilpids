#!/usr/bin/env node

process.title = 'lil-pids'

var fs = require('fs')
var readFile = require('read-file-live')
var respawn = require('respawn')
var chalk = require('chalk')
var through2 = require('through2')

var BIN_SH = process.platform === 'android' ? '/system/bin/sh' : '/bin/sh'
var CMD_EXE = process.env.comspec || 'cmd.exe'

var padding = ['', ' ', '  ', '   ', '    ']
var colors = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'gray']

var servicesFile = process.argv[2]
var pidsFile = process.argv[3]

if (require.main === module) lilpids(servicesFile, pidsFile)

module.exports = lilpids

function lilpids (servicesFile, pidsFile) {

  if (!servicesFile && !module.parent) {
    console.error('Usage: lil-pids [services-file] [pids-file?]')
    process.exit(1)
  }

  var currentColor = 0

  var services = []
  var monitors = {}

  if (module.parent) {
    pidsFile = true
    var lilpids$ = through2.obj(function (paths, encoding, next) {
      if (Array.isArray(paths)) {
        update(paths.join('\n'))
        next()
      } else next(new Error('lilpids wants cmd array'))
    })
    return lilpids$
  }

  readFile(servicesFile, update)

  function writePids (cb) {
    if (!pidsFile) return

    var cmds = Object.keys(monitors).sort(function (a, b) {
      var i = services.indexOf(a)
      var j = services.indexOf(b)
      return (i === -1 || j === -1) ? a.localeCompare(b) : i - j
    })

    var lines = cmds.map(function (cmd) {
      if (!monitors[cmd].pid) return
      return prefix(monitors[cmd].pid) + cmd + '\n'
    })

    if (module.parent) return lilpids$.push(lines.filter(function (x) {
      return x
    }).map(function (line) {
      var proc = line.split(':')
      return { pid: proc[0], service: proc[1].split('\n')[0].trim() }
    }))

    fs.writeFile(pidsFile, lines.join(''), cb)
  }

  function update (buf) {
    var latest = parse(buf)
    var prev = services

    services = latest

    prev.forEach(function (s) {
      if (latest.indexOf(s) === -1) stop(s)
    })
    latest.forEach(function (s) {
      if (prev.indexOf(s) === -1) start(s)
    })
  }

  function stop (cmd) {
    monitors[cmd].stop()
    delete monitors[cmd]
  }

  function start (cmd) {
    var m = monitors[cmd] = spawn(cmd)
    var color = chalk[nextColor()]

    m.on('spawn', onspawn)
    m.on('exit', onexit)
    m.on('stdout', onstdout)
    m.on('stderr', onstderr)
    m.on('stop', update)

    m.start()

    function onstdout (message) {
      onlog('(out)', message)
    }

    function onstderr (message) {
      onlog('(err)', message)
    }

    function onspawn () {
      console.log(color(prefix(m.pid) + '!!!!! SPAWN ' + cmd))
      writePids()
    }

    function onexit (code) {
      console.log(color(prefix(m.pid) + '!!!!! EXIT(' + code + ') ' + cmd))
      writePids()
    }

    function onlog (type, message) {
      var ln = message.toString().split('\n')
      if (ln[ln.length - 1] === '') ln.pop()
      for (var i = 0; i < ln.length; i++) ln[i] = prefix(m.pid) + type + ' ' + ln[i]
      console.log(color(ln.join('\n')))
    }

    function update () { writePids() }
  }



  function nextColor () {
    if (currentColor === colors.length) currentColor = 0
    return colors[currentColor++]
  }

}

function prefix (pid) {
  var spid = pid.toString()
  return spid + padding[5 - spid.length] + ': '
}

function spawn (cmd) {
  if (process.platform !== 'win32') return respawn([BIN_SH, '-c', cmd], {maxRestarts: Infinity})
  return respawn([CMD_EXE, '/d', '/s', '/c', '"' + cmd + '"'], {maxRestarts: Infinity, windowsVerbatimArguments: true})
}

function parse (buf) {
  if (!buf) return []
  return buf.toString().trim().split('\n')
  .map(function (line) {
    return line.trim()
  })
  .filter(function (line) {
    return line && line[0] !== '#'
  })
}
