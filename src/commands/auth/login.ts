import { Command } from '@oclif/core'
import http from 'http'
import crypto from 'crypto'
import open from 'open'
import axios from 'axios'
import { URL } from 'url'
import JWT from 'jsonwebtoken'

export default class AuthLogin extends Command {
  static description = 'OAuth CLI login'

  private server?: http.Server
  private readonly port = parseInt(process.env.OAUTH_CALLBACK_PORT || '4000')
  private readonly redirectUri = process.env.OAUTH_CALLBACK_REDIRECT || `http://localhost:${this.port}/oauth2/callback`
  private readonly realmUrl = process.env.OAUTH_CONNECT_URL || 'http://localhost:6040/realms/herodevs_local/protocol/openid-connect'
  private readonly clientId = process.env.OAUTH_CONNECT_URL || 'default-public'

  async run() {
    const codeVerifier = crypto.randomBytes(32).toString('base64url')
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url')

    const authUrl = `${this.realmUrl}/auth?` +
      `client_id=${this.clientId}` +
      `&response_type=code` +
      // `&scope=openid%20profile%20email%20nes-claims` +
      `&redirect_uri=${encodeURIComponent(this.redirectUri)}` +
      `&code_challenge=${codeChallenge}` +
      `&code_challenge_method=S256`

    const code = await this.startServerAndAwaitCode(authUrl)

    const token = await this.exchangeCodeForToken(code, codeVerifier)
    this.log('Access Token:')
    this.log(token.access_token)

    const decoded = JWT.decode(token.access_token)
    this.log(decoded as string)
  }

  /**
   * Starts a minimal HTTP server and waits for the OAuth redirect.
   */
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

      this.server.listen(this.port, () => {
        this.log(`Listening for callback on http://localhost:${this.port}`)
        console.log('Please navigate to', authUrl)
        open(authUrl)
      })

      this.server.on('error', (err) => {
        this.stopServer()
        reject(err)
      })
    })
  }

  /**
   * Cleanly stops the HTTP server.
   */
  private stopServer() {
    if (this.server) {
      this.server.close(() => this.log('Callback server stopped.'))
      this.server = undefined
    }
  }

  /**
   * Exchanges the authorization code for an access token.
   */
  private async exchangeCodeForToken(code: string, codeVerifier: string): Promise<any> {
    const tokenUrl = `${this.realmUrl}/token`

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      code_verifier: codeVerifier,
      code,
    })

    const response = await axios.post(tokenUrl, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })

    return response.data
  }
}
