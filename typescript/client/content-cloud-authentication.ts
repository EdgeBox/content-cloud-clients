import jsonwebtoken, { JwtPayload } from "jsonwebtoken";

export enum ContentCloudPermission {
  // Grants read access to tags and assets, too.
  CONTENT_READ = "permission:content:read",
  // Only required if you want to query for Content Types in your app.
  CONTENT_TYPE_READ = "permission:content-type:read",

  // Request file content.
  ASSET_READ_FILE = "permission:asset:read:file",

  // Custom user data; always scoped to the current user.
  USER_DATA_READ = "permission:user-data:read",
  USER_DATA_WRITE = "permission:user-data:write",

  // External content links, e.g. to get the canonical URL.
  EXTERNAL_LINK_READ = "permission:external-link:read",
  EXTERNAL_LINK_WRITE = "permission:external-link:write",

  // Expands all _READ access to include drafts.
  PREVIEW = "permission:preview",

  // Grants access to dev GraphQL + dev REST interfaces that have introspection enabled and a UI.
  // This permission is also required for generating code.
  DEVELOPER = "permission:developer",

  // Grants read access to the space and all related locales + environments.
  SPACE_READ = "permission:space:read",
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
  // This will be used for the audience property. You can make it specific to
  // include the space + environment or keep it broader if you want to reuse
  // a token across different domains.
  baseUrl: string;

  services: ContentCloudService[];
  permissions: ContentCloudPermission[];

  spaceId?: string;
  environmentIds?: string[];

  // If the user is authenticated, fill this out with a custom ID.
  // We recommend prefixing IDs and not using PII.
  // E.g. "auth0:123456" instead of "test@example.com"
  userId?: string;
  // By default, users cannot access any user data types. Include the ones a
  // user should have access to in here. You can also pass "*" to grant access
  // to any user data type available in the environment.
  userDataContentTypes?: string[];
}

export function generateAccessToken(payload: ContentCloudJwtPayload, ttlInSeconds = 3_600, clientSecret?: string) {
  if (!clientSecret) {
    clientSecret = process.env.CC_CLIENT_SECRET;
  }
  if (!clientSecret) {
    throw new Error(`Missing clientSecret to sign access token.`);
  }

  const [clientId, issuerBase64, secretBase64] = clientSecret.split(":");
  if (!clientId || !issuerBase64 || !secretBase64) {
    throw new Error(`client secret uses an unsupported format.`);
  }

  const baseUrl = payload.baseUrl ?? process.env.CC_SATELLITE_BASE_URL ?? process.env.CC_BASE_URL;

  const externalPayload: JwtPayload & { scope: string[] } = {
    aud: `https://${new URL(baseUrl).hostname}`,
    iss: Buffer.from(issuerBase64, "base64").toString("utf8"),
    scope: [],
  };

  // Extend scope
  if (payload.permissions) {
    // Already prefixed with "permission:"
    externalPayload.scope.push(...payload.permissions);
  }
  if (payload.services) {
    // Already prefixed with "service:"
    externalPayload.scope.push(...payload.services);
  }

  externalPayload.scope.push(`space:${payload.spaceId ?? process.env.CC_SPACE_ID}`);
  if (payload.environmentIds) {
    externalPayload.scope.push(...payload.environmentIds.map((envId) => `environment:${envId}`));
  } else if (process.env.CC_ENVIRONMENT_ID) {
    externalPayload.scope.push(`environment:${process.env.CC_ENVIRONMENT_ID}`);
  } else {
    externalPayload.scope.push("environment:*");
  }

  if (payload.userDataContentTypes) {
    externalPayload.scope.push(...payload.userDataContentTypes.map((ct) => `content-user-data:${ct}`));
  }

  if (payload.userId) {
    externalPayload.sub = payload.userId;
  }

  const secretBinary = Buffer.from(secretBase64, "base64");
  // Starts with -----
  const asymmetric =
    secretBinary.at(0) === 0x2d &&
    secretBinary.at(1) === 0x2d &&
    secretBinary.at(2) === 0x2d &&
    secretBinary.at(3) === 0x2d &&
    secretBinary.at(4) === 0x2d;

  return jsonwebtoken.sign(externalPayload, asymmetric ? secretBinary.toString("utf8") : secretBinary, {
    algorithm: asymmetric ? "RS256" : "HS256",
    keyid: `client:${clientId}:0`,
    expiresIn: ttlInSeconds,
  });
}
