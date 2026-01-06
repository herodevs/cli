import { Command } from '@oclif/core'
import http from 'http'
import crypto from 'crypto'
import open from 'open'
import { URL } from 'url'
import JWT from 'jsonwebtoken'
import inquirer from 'inquirer'
import clipboard from 'clipboardy'
export default class AuthLogin extends Command {
  static description = 'OAuth CLI login'

  private server?: http.Server
  private readonly port = parseInt(process.env.OAUTH_CALLBACK_PORT || '4000')
  private readonly redirectUri = process.env.OAUTH_CALLBACK_REDIRECT || `http://localhost:${this.port}/oauth2/callback`
  private readonly realmUrl = process.env.OAUTH_CONNECT_URL || 'https://idp.prod.apps.herodevs.io/realms/universe/protocol/openid-connect'
  private readonly clientId = process.env.OAUTH_CLIENT_ID || 'default-public'

  async run() {
    const codeVerifier = crypto.randomBytes(32).toString('base64url')
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url')

    const authUrl = `${this.realmUrl}/auth?` +
      `client_id=${this.clientId}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent('nes-claims email profile offline_access')}` +
      `&redirect_uri=${encodeURIComponent(this.redirectUri)}` +
      `&code_challenge=${codeChallenge}` +
      `&code_challenge_method=S256`

    const code = await this.startServerAndAwaitCode(authUrl)
    const token = await this.exchangeCodeForToken(code, codeVerifier)

    this.log('\n\nAccess Token:\n')
    this.log(token.access_token)
    await clipboard.write(token.access_token);
    this.log('\n\nThe access token has been copied to your clipboard.')

    const decoded = JWT.decode(token.access_token)
    this.log(`\n\n`, decoded)
  }

  private startServerAndAwaitCode(authUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        if (!req.url) return

        const parsedUrl = new URL(req.url, `http://localhost:${this.port}`)
        if (parsedUrl.pathname === '/oauth2/callback') {
          const code = parsedUrl.searchParams.get('code')
          res.writeHead(200, { 'Content-Type': 'text/plain' })
          res.end('Login successful. You can close this window.')

          if (code) {
            this.stopServer()
            resolve(code)
          } else {
            this.stopServer()
            reject(new Error('No code returned from Keycloak'))
          }
        } else {
          res.writeHead(404)
          res.end()
        }
      })

      this.server.listen(this.port, async () => {
        // this.log(`Listening for callback on http://localhost:${this.port}`)
        await inquirer.prompt({
          name: 'confirm',
          message: 'Press Enter to navigate to: ' + authUrl,
          type: 'confirm',
        })

        
        open(authUrl)
      })

      this.server.on('error', (err) => {
        this.stopServer()
        reject(err)
      })
    })
  }

  private async stopServer() {
    if (this.server) {
      await new Promise<void>((resolve, reject) => this.server!.close(err => err ? reject(err) : resolve()))
      this.server = undefined
    }
  }

  private async exchangeCodeForToken(code: string, codeVerifier: string): Promise<any> {
    const tokenUrl = `${this.realmUrl}/token`

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      code_verifier: codeVerifier,
      code,
    })

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Token exchange failed: ${response.status} ${response.statusText}\n${text}`)
    }

    return await response.json()
  }
}
