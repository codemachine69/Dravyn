// SSOBase.ts
import express from 'express'
import passport from 'passport'
import { IAssignedWorkspace, LoggedInUser } from '../Interface.Enterprise'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { UserErrorMessage, UserService } from '../services/user.service'
import { WorkspaceUserService } from '../services/workspace-user.service'
import { WorkspaceService } from '../services/workspace.service'
import { AccountService } from '../services/account.service'
import { WorkspaceUser } from '../database/entities/workspace-user.entity'
import { OrganizationService } from '../services/organization.service'
import { GeneralRole } from '../database/entities/role.entity'
import { RoleErrorMessage, RoleService } from '../services/role.service'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { StatusCodes } from 'http-status-codes'
import { Platform } from '../../Interface'
import { UserStatus } from '../database/entities/user.entity'

abstract class SSOBase {
    protected app: express.Application
    protected ssoConfig: any

    constructor(app: express.Application, ssoConfig?: any) {
        this.app = app
        this.ssoConfig = ssoConfig
    }

    setSSOConfig(ssoConfig: any) {
        this.ssoConfig = ssoConfig
    }

    getSSOConfig() {
        return this.ssoConfig
    }

    abstract getProviderName(): string
    abstract initialize(): void
    abstract refreshToken(ssoRefreshToken: string): Promise<{ [key: string]: any }>
    async verifyAndLogin(
        app: express.Application,
        email: string,
        done: (err?: Error | null, user?: Express.User, info?: any) => void,
        profile: passport.Profile,
        accessToken: string | object,
        refreshToken: string
    ) {
        console.log('🔧 SSOBase: verifyAndLogin called with email:', email)
        let queryRunner
        const ssoProviderName = this.getProviderName()
        try {
            queryRunner = getRunningExpressApp().AppDataSource.createQueryRunner()
            await queryRunner.connect()

            const userService = new UserService()
            const organizationService = new OrganizationService()
            const workspaceUserService = new WorkspaceUserService()

            let user: any = await userService.readUserByEmail(email, queryRunner)
            console.log('🔧 SSOBase: User lookup result:', { found: !!user, email })
            let wu: any = {}

            if (!user) {
                console.log('🔧 SSOBase: No user found, creating new user for platform:', getRunningExpressApp().identityManager.getPlatformType())
                // In ENTERPRISE mode, we don't want to create a new user if the user is not found
                if (getRunningExpressApp().identityManager.getPlatformType() === Platform.ENTERPRISE) {
                    console.log('🔧 SSOBase: Enterprise mode - not creating user')
                    throw new InternalFlowiseError(StatusCodes.NOT_FOUND, UserErrorMessage.USER_NOT_FOUND)
                }
                // no user found, register the user
                const data: any = {
                    user: {
                        email: email,
                        name: profile.displayName || email,
                        status: UserStatus.ACTIVE,
                        credential: undefined
                    }
                }
                console.log('🔧 SSOBase: User data prepared:', data)
                if (getRunningExpressApp().identityManager.getPlatformType() === Platform.CLOUD) {
                    console.log('🔧 SSOBase: Creating user for CLOUD platform')
                    const accountService = new AccountService()
                    const newAccount = await accountService.register(data)
                    wu = newAccount.workspaceUser
                    wu.workspace = newAccount.workspace
                    user = newAccount.user
                } else if (getRunningExpressApp().identityManager.getPlatformType() === Platform.OPEN_SOURCE) {
                    console.log('🔧 SSOBase: Creating user for OPEN_SOURCE platform')
                    try {
                        // For Open Source, create user directly without using AccountService.register
                        // which tries to create a new organization
                        const userService = new UserService()
                        const organizationService = new OrganizationService()
                        
                        // Get the existing organization (there should be only one in Open Source)
                        const organizations = await organizationService.readOrganization(queryRunner)
                        console.log('🔧 SSOBase: Found organizations:', organizations.length)
                        
                        if (organizations.length === 0) {
                            throw new Error('No organization found for Open Source mode')
                        }
                        
                        const organization = organizations[0]
                        console.log('🔧 SSOBase: Using organization:', organization.id)
                        
                        // Get the workspace for this organization
                        const workspaceService = new WorkspaceService()
                        const workspaces = await workspaceService.readWorkspaceByOrganizationId(organization.id, queryRunner)
                        console.log('🔧 SSOBase: Found workspaces:', workspaces.length)
                        
                        if (workspaces.length === 0) {
                            throw new Error('No workspace found for organization')
                        }
                        
                        const workspace = workspaces[0]
                        console.log('🔧 SSOBase: Using workspace:', workspace.id)
                        
                        // Create the user directly
                        const newUser = await userService.createUser({
                            ...data.user,
                            organizationId: organization.id
                        })
                        
                        console.log('🔧 SSOBase: User created successfully:', { userId: newUser.id, email: newUser.email })
                        
                        // Create workspace user relationship
                        const workspaceUserService = new WorkspaceUserService()
                        const roleService = new RoleService()
                        
                        // Get the admin role
                        const adminRole = await roleService.readGeneralRoleByName(GeneralRole.OWNER, queryRunner)
                        if (!adminRole) {
                            throw new Error('Admin role not found')
                        }
                        
                        const workspaceUser = await workspaceUserService.createWorkspaceUser({
                            userId: newUser.id,
                            workspaceId: workspace.id, // Use the actual workspace ID
                            roleId: adminRole.id,
                            createdBy: newUser.id
                        })
                        
                        user = newUser
                        wu = workspaceUser
                        wu.workspace = organization
                        
                        console.log('🔧 SSOBase: Workspace user created successfully')
                    } catch (error: any) {
                        console.log('🔧 SSOBase: Error during user creation:', error)
                        console.log('🔧 SSOBase: Error details:', {
                            message: error?.message,
                            stack: error?.stack,
                            name: error?.name
                        })
                        throw error
                    }
                }
            } else {
                console.log('🔧 SSOBase: User found, checking status and workspace relationship')
                console.log('🔧 SSOBase: User details:', { 
                    id: user.id, 
                    email: user.email, 
                    status: user.status,
                    organizationId: user.organizationId 
                })
                
                // Check if user has workspace relationship
                const workspaceUserService = new WorkspaceUserService()
                let userWorkspace = null
                
                // First, try to find any workspace user relationship for this user
                try {
                    const workspaceUsers = await workspaceUserService.readWorkspaceUserByUserId(user.id, queryRunner)
                    userWorkspace = workspaceUsers.length > 0 ? workspaceUsers[0] : null
                } catch (error) {
                    console.log('🔧 SSOBase: No existing workspace user relationship found')
                }
                
                console.log('🔧 SSOBase: Workspace user relationship:', { 
                    hasWorkspaceUser: !!userWorkspace,
                    workspaceId: userWorkspace?.workspaceId,
                    roleId: userWorkspace?.roleId
                })
                
                // If user doesn't have workspace relationship, create one
                if (!userWorkspace) {
                    console.log('🔧 SSOBase: User missing workspace relationship, creating one')
                    const workspaceService = new WorkspaceService()
                    const organizationService = new OrganizationService()
                    
                    // Get the default organization (there should be only one in Open Source)
                    const organizations = await organizationService.readOrganization(queryRunner)
                    if (organizations.length > 0) {
                        const organization = organizations[0]
                        const workspaces = await workspaceService.readWorkspaceByOrganizationId(organization.id, queryRunner)
                        
                        if (workspaces.length > 0) {
                            const workspace = workspaces[0]
                            const roleService = new RoleService()
                            const adminRole = await roleService.readGeneralRoleByName(GeneralRole.OWNER, queryRunner)
                            
                            if (adminRole) {
                                const newWorkspaceUser = await workspaceUserService.createWorkspaceUser({
                                    userId: user.id,
                                    workspaceId: workspace.id,
                                    roleId: adminRole.id,
                                    createdBy: user.id
                                })
                                // Get the full workspace user with relationships
                                const fullWorkspaceUser = await workspaceUserService.readWorkspaceUserByWorkspaceIdUserId(workspace.id, user.id, queryRunner)
                                userWorkspace = fullWorkspaceUser.workspaceUser || undefined
                                console.log('🔧 SSOBase: Workspace user relationship created successfully')
                            }
                        }
                    }
                }
                
                // Set the workspace user for the existing user
                if (userWorkspace) {
                    wu = userWorkspace
                    console.log('🔧 SSOBase: Workspace user set for existing user:', { 
                        workspaceId: wu.workspaceId, 
                        roleId: wu.roleId 
                    })
                }
                
                if (user.status === UserStatus.INVITED) {
                    const data: any = {
                        user: {
                            ...user,
                            email,
                            name: profile.displayName || '',
                            status: UserStatus.ACTIVE,
                            credential: undefined
                        }
                    }
                    const accountService = new AccountService()
                    const newAccount = await accountService.register(data)
                    user = newAccount.user
                }
                let wsUserOrUsers = await workspaceUserService.readWorkspaceUserByLastLogin(user?.id, queryRunner)
                wu = Array.isArray(wsUserOrUsers) && wsUserOrUsers.length > 0 ? wsUserOrUsers[0] : (wsUserOrUsers as WorkspaceUser)
            }

            const workspaceUser = wu as WorkspaceUser
            let roleService = new RoleService()
            const ownerRole = await roleService.readGeneralRoleByName(GeneralRole.OWNER, queryRunner)
            const role = await roleService.readRoleById(workspaceUser.roleId, queryRunner)
            if (!role) throw new InternalFlowiseError(StatusCodes.NOT_FOUND, RoleErrorMessage.ROLE_NOT_FOUND)

            const workspaceUsers = await workspaceUserService.readWorkspaceUserByUserId(workspaceUser.userId, queryRunner)
            const assignedWorkspaces: IAssignedWorkspace[] = workspaceUsers.map((workspaceUser) => {
                return {
                    id: workspaceUser.workspace.id,
                    name: workspaceUser.workspace.name,
                    role: workspaceUser.role?.name,
                    organizationId: workspaceUser.workspace.organizationId
                } as IAssignedWorkspace
            })

            const organization = await organizationService.readOrganizationById(workspaceUser.workspace.organizationId, queryRunner)
            if (!organization) throw new InternalFlowiseError(StatusCodes.NOT_FOUND, 'Organization not found')
            const subscriptionId = organization.subscriptionId as string
            const customerId = organization.customerId as string
            const features = await getRunningExpressApp().identityManager.getFeaturesByPlan(subscriptionId)
            const productId = await getRunningExpressApp().identityManager.getProductIdFromSubscription(subscriptionId)

            const loggedInUser: LoggedInUser = {
                id: workspaceUser.userId,
                email: user?.email || '',
                name: user?.name || '',
                roleId: workspaceUser.roleId,
                activeOrganizationId: organization.id,
                activeOrganizationSubscriptionId: subscriptionId,
                activeOrganizationCustomerId: customerId,
                activeOrganizationProductId: productId,
                isOrganizationAdmin: workspaceUser.roleId === ownerRole?.id,
                activeWorkspaceId: workspaceUser.workspaceId,
                activeWorkspace: workspaceUser.workspace.name,
                assignedWorkspaces,
                isApiKeyValidated: true,
                ssoToken: accessToken as string,
                ssoRefreshToken: refreshToken,
                ssoProvider: ssoProviderName,
                permissions: [...JSON.parse(role.permissions)],
                features
            }
            return done(null, loggedInUser as Express.User, { message: 'Logged in Successfully' })
        } catch (error) {
            return done(
                { name: 'SSO_LOGIN_FAILED', message: ssoProviderName + ' Login failed! Please contact your administrator.' },
                undefined
            )
        } finally {
            if (queryRunner && !queryRunner.isReleased) await queryRunner.release()
        }
    }
}

export default SSOBase
