#!/usr/bin/env node

/* eslint-disable unicorn/no-abusive-eslint-disable */
/* eslint-disable */

const keypress = async () => {
  process.stdin.setRawMode(true)
  return new Promise(resolve => process.stdin.once('data', () => {
    process.stdin.setRawMode(false)
    resolve()
  }))
}


process.env.GRAPHQL_HOST = 'http://localhost:3000'

async function run() {

  const oclif = await import('@oclif/core')
  await oclif.execute({ development: true, dir: import.meta.dirname })

  // watch unless they SIGHUP
  console.log('\n\n\n=> OCLIF: Command complete.');
  // await new Promise(r => setTimeout(r, 1 * 1000))
  // console.log('=> OCLIF: Press enter to re-run.');
  // process.stdin.resume()
  // await keypress()

  // console.clear()
  // console.log('\n\n=> OCLIF: Re-starting\n\n\n');
  // await new Promise(r => setTimeout(r, 1 * 1000))

  // run()
}

run()