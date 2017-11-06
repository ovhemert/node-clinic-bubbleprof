'use strict'

const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')
const getLoggingPaths = require('./collect/get-logging-paths.js')

class ClinicBubbleprof {
  collect (args, callback) {
    const samplerPath = path.resolve(__dirname, 'logger.js')

    // run program, but inject the sampler
    const proc = spawn(args[0], [
      '-r', samplerPath,
      '--trace-events-enabled', '--trace-event-categories', 'node.async_hooks'
    ].concat(args.slice(1)), {
      stdio: 'inherit'
    })

    // relay SIGINT to process
    process.once('SIGINT', () => proc.kill('SIGINT'))

    proc.once('exit', function (code, signal) {
      // the process did not exit normally
      if (code !== 0 && signal !== 'SIGINT') {
        if (code !== null) {
          return callback(new Error(`process exited with exit code ${code}`))
        } else {
          return callback(new Error(`process exited by signal ${signal}`))
        }
      }

      // get filenames of logfiles
      const paths = getLoggingPaths(proc.pid)

      // create directory and move files to that directory
      fs.rename(
        'node_trace.1.log', paths['/traceevents'],
        function (err) {
          if (err) return callback(err)
          callback(null, paths['/'])
        }
      )
    })
  }

  visualize (dataDirname, outputFilename, callback) {
    process.nextTick(callback, new Error('bubbleprof is not implemented'))
  }
}

module.exports = ClinicBubbleprof