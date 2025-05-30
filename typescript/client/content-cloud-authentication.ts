import jsonwebtoken from 'jsonwebtoken'

export enum ContentCloudPermission {
  // Grants read access to tags and assets, too.
  CONTENT_READ = 'permission:content:read',
  // Only required if you want to query for Content Types in your app.
  CONTENT_TYPE_READ = 'permission:content-type:read',

  // Request file content.
  ASSET_READ_FILE = 'permission:asset:read:file',

  // Custom user data; always scoped to the current user.
  USER_DATA_READ = 'permission:user-data:read',
  USER_DATA_WRITE = 'permission:user-data:write',

  // External content links, e.g. to get the canonical URL.
  EXTERNAL_LINK_READ = 'permission:external-link:read',
  EXTERNAL_LINK_WRITE = 'permission:external-link:write',

  // Expands all _READ access to include drafts.
  PREVIEW = 'permission:preview',

  // Grants access to dev GraphQL + dev REST interfaces that have introspection enabled and a UI.
  // This permission is also required for generating code.
  DEVELOPER = 'permission:developer',

  // Grants read access to the space and all related locales + environments.
  SPACE_READ = 'permission:space:read',
}

export enum ContentCloudService {
  // Public content delivery APIs.
  LIVE = "service:live",
  CDN = "service:cdn",
  ASSETS = "service:assets",
  // Private content delivery APIs.
  DEV = "service:dev",
  PREVIEW = "service:preview",
  ASSET_PREVIEWS = "service:asset-previews",
  // Private content management APIs.
  PUBLISHER = "service:publisher",
}

/**
 *  The JWT format expected by the Content Cloud.
 */
export interface ContentCloudJwtPayload {
  clientId: string
  services: ContentCloudService[]
  permissions: ContentCloudPermission[]
  spaceId: string
  environmentIds: string[]

  // If the user is authenticated, fill this out with a custom ID.
  // We recommend prefixing IDs and not using PII.
  // E.g. "auth0:123456" instead of "test@example.com"
  userId?: string
  // By default, users cannot access any user data types. Include the ones a
  // user should have access to in here. You can also pass "*" to grant access
  // to any user data type available in the environment.
  userDataContentTypes?: string[]
}

export function generateAccessToken(
  properties: Omit<ContentCloudJwtPayload, 'clientId' | 'spaceId' | 'environmentIds'> & Partial<Pick<ContentCloudJwtPayload, 'spaceId' | 'environmentIds'>>,
  ttlInSeconds = 3_600,
  clientSecret?: string,
) {
  if (!clientSecret) {
    clientSecret = process.env.CC_CLIENT_SECRET
  }
  if (!clientSecret) {
    throw new Error(`Missing clientSecret to sign access token.`)
  }

  const [clientId, secret] = clientSecret.split('=')
  if (!clientId || !secret) {
    throw new Error(`clientSecret uses an unsupported format.`)
  }

  const payload: ContentCloudJwtPayload = {
    ...properties,
    spaceId: properties.spaceId ?? process.env.CC_SPACE_ID!,
    environmentIds: properties.environmentIds ?? [process.env.CC_ENVIRONMENT_ID!],
    clientId,
  }

  const iat = Math.floor(Date.now() / 1_000)
  const settings = {
    iat,
    exp: iat + ttlInSeconds,
  }

  return jsonwebtoken.sign({ ...payload, ...settings }, secret)
}
