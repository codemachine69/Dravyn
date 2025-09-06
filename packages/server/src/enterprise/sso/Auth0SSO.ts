// Auth0SSO.ts
import SSOBase from './SSOBase'
import passport from 'passport'
import { Profile, Strategy as Auth0Strategy } from 'passport-auth0'
import { Request } from 'express'
import auditService from '../services/audit'
import { ErrorMessage, LoggedInUser, LoginActivityCode } from '../Interface.Enterprise'
import { setTokenOrCookies } from '../middleware/passport'
import axios from 'axios'

const PROVIDER_NAME_AUTH0_SSO = 'Auth0 SSO'

class Auth0SSO extends SSOBase {
    static LOGIN_URI = '/api/v1/auth0/login'
    static CALLBACK_URI = '/api/v1/auth0/callback'
    static LOGOUT_URI = '/api/v1/auth0/logout'

    getProviderName(): string {
        return PROVIDER_NAME_AUTH0_SSO
    }

    static getCallbackURL(): string {
        const PORT = process.env.PORT || '3000'
        const BACKEND_URL = `http://localhost:${PORT}`
        return BACKEND_URL + Auth0SSO.CALLBACK_URI
    }

    setSSOConfig(ssoConfig: any) {
        console.log('🔧 Auth0SSO: setSSOConfig called with:', !!ssoConfig)
        super.setSSOConfig(ssoConfig)
        if (ssoConfig) {
            const { domain, clientID, clientSecret } = this.ssoConfig

            console.log('🔧 Auth0SSO: Registering Auth0 strategy with config:', {
                domain: domain || 'your_auth0_domain',
                clientID: clientID || 'your_auth0_client_id',
                callbackURL: Auth0SSO.getCallbackURL() || 'http://localhost:3000/auth/auth0/callback'
            })
            passport.use(
                'auth0',
                new Auth0Strategy(
                    {
                        domain: domain || 'your_auth0_domain',
                        clientID: clientID || 'your_auth0_client_id',
                        clientSecret: clientSecret || 'your_auth0_client_secret',
                        callbackURL: Auth0SSO.getCallbackURL() || 'http://localhost:3000/auth/auth0/callback',
                        passReqToCallback: true
                    },
                    async (
                        req: Request,
                        accessToken: string,
                        refreshToken: string,
                        extraParams: any,
                        profile: Profile,
                        done: (error: any, user?: any) => void
                    ) => {
                        const email = profile.emails?.[0]?.value
                        if (!email) {
                            await auditService.recordLoginActivity(
                                '<empty>',
                                LoginActivityCode.UNKNOWN_USER,
                                ErrorMessage.UNKNOWN_USER,
                                PROVIDER_NAME_AUTH0_SSO
                            )
                            return done({ name: 'SSO_LOGIN_FAILED', message: ErrorMessage.UNKNOWN_USER }, undefined)
                        }
                        return await this.verifyAndLogin(this.app, email, done, profile, accessToken, refreshToken)
                    }
                )
            )
        } else {
            passport.unuse('auth0')
        }
    }

    initialize() {
        console.log('🔧 Auth0SSO: initialize() method called')
        console.log('🔧 Auth0SSO: Initializing Auth0 SSO with config:', !!this.ssoConfig)
        console.log('🔧 Auth0SSO: ssoConfig details:', this.ssoConfig)
        console.log('🔧 Auth0SSO: About to call setSSOConfig')
        this.setSSOConfig(this.ssoConfig)
        console.log('🔧 Auth0SSO: setSSOConfig completed')

        console.log('🔧 Auth0SSO: Registering login route:', Auth0SSO.LOGIN_URI)
        this.app.get(Auth0SSO.LOGIN_URI, (req, res, next?) => {
            if (!this.getSSOConfig()) {
                return res.status(400).json({ error: 'Auth0 SSO is not configured.' })
            }
            passport.authenticate('auth0', {
                scope: 'openid profile email' // Request scopes for profile and email information
            })(req, res, next)
        })

        console.log('🔧 Auth0SSO: Registering logout route:', Auth0SSO.LOGOUT_URI)
        this.app.get(Auth0SSO.LOGOUT_URI, (req, res, next?) => {
            console.log('🔧 Auth0SSO: Logout route accessed')
            if (!this.getSSOConfig()) {
                return res.status(400).json({ error: 'Auth0 SSO is not configured.' })
            }
            
            // Clear the Flowise session
            req.logout((err) => {
                if (err) {
                    console.log('🔧 Auth0SSO: Error during logout:', err)
                    return res.status(500).json({ message: 'Logout failed' })
                }
                
                // Destroy the session
                req.session.destroy((err) => {
                    if (err) {
                        console.log('🔧 Auth0SSO: Error destroying session:', err)
                        return res.status(500).json({ message: 'Failed to destroy session' })
                    }
                    
                    // Clear cookies
                    res.clearCookie('connect.sid')
                    res.clearCookie('token')
                    res.clearCookie('refreshToken')
                    
                    // Redirect to Auth0 logout URL to clear Auth0 session completely
                    const { domain, clientID } = this.ssoConfig
                    const returnTo = `${process.env.APP_URL || 'http://localhost:8080'}/signin`
                    const auth0LogoutUrl = `https://${domain}/v2/logout?returnTo=${encodeURIComponent(returnTo)}&client_id=${clientID}`
                    
                    console.log('🔧 Auth0SSO: Redirecting to Auth0 logout:', auth0LogoutUrl)
                    console.log('🔧 Auth0SSO: This will clear both Flowise and Auth0 sessions')
                    res.redirect(auth0LogoutUrl)
                })
            })
        })

        console.log('🔧 Auth0SSO: Registering callback route:', Auth0SSO.CALLBACK_URI)
        this.app.get(Auth0SSO.CALLBACK_URI, (req, res, next?) => {
            console.log('🔧 Auth0SSO: Callback route accessed with query:', req.query)
            if (!this.getSSOConfig()) {
                return res.status(400).json({ error: 'Auth0 SSO is not configured.' })
            }
            console.log('🔧 Auth0SSO: About to call passport.authenticate')
            try {
                passport.authenticate('auth0', async (err: any, user: LoggedInUser) => {
                console.log('🔧 Auth0SSO: Passport authenticate callback called with:', { err: !!err, user: !!user })
                try {
                    if (err || !user) {
                        console.log('🔧 Auth0SSO: Authentication failed:', { err: err?.message, hasUser: !!user })
                        if (err?.name == 'SSO_LOGIN_FAILED') {
                            const error = { message: err.message }
                            const signinUrl = `/signin?error=${encodeURIComponent(JSON.stringify(error))}`
                            console.log('🔧 Auth0SSO: Redirecting to signin with error:', signinUrl)
                            return res.redirect(signinUrl)
                        }
                        return next ? next(err) : res.status(401).json(err)
                    }

                    console.log('🔧 Auth0SSO: Authentication successful, regenerating session')
                    req.session.regenerate((regenerateErr) => {
                        if (regenerateErr) {
                            console.log('🔧 Auth0SSO: Session regeneration failed:', regenerateErr)
                            return next ? next(regenerateErr) : res.status(500).json({ message: 'Session regeneration failed' })
                        }

                        console.log('🔧 Auth0SSO: Session regenerated, logging in user')
                        req.login(user, { session: true }, async (error) => {
                            if (error) {
                                console.log('🔧 Auth0SSO: User login failed:', error)
                                return next ? next(error) : res.status(401).json(error)
                            }
                            console.log('🔧 Auth0SSO: User logged in successfully, setting tokens/cookies')
                            return setTokenOrCookies(res, user, true, req, true, true)
                        })
                    })
                } catch (error) {
                    return next ? next(error) : res.status(401).json(error)
                }
            })(req, res, next)
            } catch (error) {
                console.log('🔧 Auth0SSO: Error in passport.authenticate:', error)
                return next ? next(error) : res.status(500).json({ error: 'Passport authentication error' })
            }
        })
    }

    static async testSetup(ssoConfig: any) {
        const { domain, clientID, clientSecret } = ssoConfig

        try {
            const tokenResponse = await axios.post(
                `https://${domain}/oauth/token`,
                {
                    client_id: clientID,
                    client_secret: clientSecret,
                    audience: `https://${domain}/api/v2/`,
                    grant_type: 'client_credentials'
                },
                {
                    headers: { 'Content-Type': 'application/json' }
                }
            )
            return { message: tokenResponse.status }
        } catch (error) {
            const errorMessage = 'Auth0 Configuration test failed. Please check your credentials and domain.'
            return { error: errorMessage }
        }
    }

    async refreshToken(ssoRefreshToken: string) {
        const { domain, clientID, clientSecret } = this.ssoConfig

        try {
            const response = await axios.post(
                `https://${domain}/oauth/token`,
                {
                    client_id: clientID,
                    client_secret: clientSecret,
                    grant_type: 'refresh_token',
                    refresh_token: ssoRefreshToken
                },
                {
                    headers: { 'Content-Type': 'application/json' }
                }
            )
            return { ...response.data }
        } catch (error) {
            const errorMessage = 'Failed to get refreshToken from Auth0.'
            return { error: errorMessage }
        }
    }
}

export default Auth0SSO
