/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-expressions */

/**
 * SystemMetadata is used to define the system metadata for all entries.
 * Properties that only apply to specific entry types are defined as optional.
 *
 * @template TypeName The type of the entry. Must be one of the system types.
 */
export interface SystemMetadata<TypeName extends string = string> {
  type: TypeName;
  id?: string | null;
  customId?: string | null;
  uuid?: string | null;
  entryCreatedAt?: string | null;
  entryVersion?: number | null;
  environment?: EnvironmentEntry | EntryLink<"Environment"> | null;
  firstPublishedAt?: string | null;
  isPublished?: boolean | null;
  locale?: LocaleEntry | EntryLink<"Locale"> | null;
  localizationVersion?: number | null;
  publishedAt?: string | null;
  space?: SpaceEntry | EntryLink<"Space"> | null;
  versionCreatedAt?: string | null;
  versionId?: string | null;
  name?: string | null;
  slug?: string | null;
  description?: string | null;
}

/**
 * ExternalEntryLinkType is used to define the type of external entry link.
 * This can be used to look for the source of a content entry for example or to display where content is used.
 * You can add your own external links to the system to point to content in your own, custom applications.
 */
export enum ExternalEntryLinkType {
  Source = "Source",
  Target = "Target",
  Mapped = "Mapped",
  Display = "Display",
}

/**
 * ExternalEntryLinkEntry is used to define an external entry link entry in the system.
 * This is used to link to entries in other systems, e.g. to provide a canonical URL.
 */
export interface ExternalEntryLinkEntry {
  sys: SystemMetadata<"ExternalEntryLink">;

  linkType: ExternalEntryLinkType;

  spaceUuid?: string | null;
  environmentUuid?: string;
  siteUuid?: string | null;
  domain: string;

  externalTargetEntryId?: string | null;
  externalTargetVersionId?: string | null;

  authorName?: string | null;
  authorEmail?: string | null;
  publisherName?: string | null;
  publisherEmail?: string | null;

  publicMetadata?: Record<string, any> | null;
  privateMetadata?: Record<string, any> | null;

  canonicalUrl?: string | null;
  prettyUrl?: string | null;
  editUrl?: string | null;
  deleteUrl?: string | null;
  versionUrl?: string | null;
}

/**
 * FeatureConfig is used to define the feature configuration for an organization, space or environment.
 */
export type FeatureConfig = Record<string, any>;

/**
 * EntryLink is used to define a link to an entry in the system.
 * All references use this structure to point to other entries.
 *
 * @template LinkType The type of the link. This is used to define the type of the entry that is linked to. Must be one of the system types.
 */
export interface EntryLink<LinkType extends string = string> {
  sys: {
    id: string;
    type: "Link";
    linkType: LinkType;
  };
}

/**
 * EntrySystemMetadata is used to define the system metadata for an entry.
 * This is shared across all types of entries.
 *
 * @template TypeName The type of the entry. Must be one of the system types.
 */
export interface EntrySystemMetadata<TypeName extends string = string> extends SystemMetadata<TypeName> {
  id: string;
  entryCreatedAt: string;
  entryVersion: number;
  isPublished: boolean;
  versionCreatedAt: string;
  versionId: string;
}

/**
 * EntrySystemMetadataWithSpace is used to define the system metadata for an entry with a space property.
 * This is used by all entry types except for the space type itself.
 *
 * @template TypeName The type of the entry. Must be one of the system types.
 */
export interface EntrySystemMetadataWithSpace<TypeName extends string = string> extends EntrySystemMetadata<TypeName> {
  environment: EnvironmentEntry;
  locale: LocaleEntry;
  space: SpaceEntry;
}

/**
 * Entry is used to define a base entry in the system.
 * This is a base type to define the system metadata and external links.
 *
 * @template TypeName The type of the entry. Must be one of the system types.
 */
export interface Entry<TypeName extends string = string> {
  sys: EntrySystemMetadata<TypeName>;

  externalLinks?: ExternalEntryLinkEntry[];
}

/**
 * CollectionResponse is used to define the response of a collection of entries in the system.
 * This is a base type to define the metadata provided for pagination.
 *
 * @template Type The type definition for the entries in the collection.
 */
export interface CollectionResponse<Type> {
  /**
   * The system metadata for the collection.
   */
  sys: SystemMetadata & {
    type: "Array";
  };
  /**
   * The items in the collection.
   */
  items: Type[];
  /**
   * How many items were returned per page.
   */
  limit: number;
  /**
   * How many items were skipped.
   */
  skip: number;
  /**
   * How many items match the request in total.
   */
  total: number;
}

/**
 * EntryResponse is used to define the response of an entry in the system.
 * This is a base type to define the system metadata.
 *
 * @template Type The type definition for the entry.
 */
export type EntryResponse<Type> = Type & { sys: SystemMetadata };

/**
 * SpaceEntry is used to define a space entry in the system.
 */
export interface SpaceEntry extends Entry<"Space"> {
  id: string;
  uuid: string;

  isPublished: boolean;

  name: string;

  featureConfig: FeatureConfig;
}

/**
 * EnvironmentEntry is used to define an environment entry in the system.
 */
export interface EnvironmentEntry extends Entry<"Environment"> {}

/**
 * LocaleEntry is used to define a locale entry in the system.
 */
export interface LocaleEntry extends Entry<"Locale"> {
  id: string;
  code: string;
  fallbackCode?: string | null;

  isPublished: boolean;

  name: string;
}

/**
 * ContentTypePropertyEntry is used to define a content type property entry in the system.
 */
export interface ContentTypePropertyEntry extends Entry<"ContentTypeProperty"> {
  customId: string;
  id: string;
  machineName: string;

  isPublished: boolean;

  type: string;
  isArray: boolean;
  isBig: boolean;
  isItemRequired: boolean;
  isLink: boolean;
  isLocalized: boolean;
  isParentLink: boolean;
  isRequired: boolean;

  allowedTypes?: string[] | null;

  name: string;
  description?: string | null;
}

/**
 * ContentTypeEntry is used to define a content type entry in the system.
 */
export interface ContentTypeEntry extends Entry<"ContentType"> {
  customId: string;
  id: string;
  machineName: string;

  isPublished: boolean;

  isAsset: boolean;
  isIndependent: boolean;
  isInline: boolean;
  isTaxonomy: boolean;

  properties: ContentTypePropertyEntry[];

  name: string;
  description?: string | null;
}

/**
 * ContentEntry is used to define a content entry in the system.
 */
export interface ContentEntry extends Entry<"Content"> {
  sys: EntrySystemMetadata<"Content"> & {
    contentType: EntryLink<"ContentType"> | ContentTypeEntry;
  };

  fields: Record<string, any>;

  tag?: TagEntry | null;
  asset?: AssetEntry | null;
}

/**
 * MimeTypeGroup is used to define the mime type group for assets.
 * Assets of type "image" are available through the Image API for optimization.
 */
export enum MimeTypeGroup {
  Image = "image",
  Audio = "audio",
  Video = "video",
  RichText = "richtext",
  Presentation = "presentation",
  Spreadsheet = "spreadsheet",
  PdfDocument = "pdfdocument",
  Archive = "archive",
  Code = "code",
  Markup = "markup",
  Plaintext = "plaintext",
  Attachment = "attachment",
  Other = "other",
}

/**
 * AssetEntry is used to define an asset entry in the system.
 */
export interface AssetEntry extends Entry<"Asset"> {
  id: string;

  isPublished: boolean;

  fields: {
    hash: string;
    mimeType: string;
    mimeTypeGroup: MimeTypeGroup;
    size: number;
    customVersionId?: string | null;
    details?: {
      image?: {
        width: number;
        height: number;
      } | null;
    } | null;
    imageUrl?: string | null;
    downloadUrl?: string | null;
    embedUrl?: string | null;
    fileName: string;
  };

  name: string;
}

/**
 * TagEntry is used to define a tag entry in the system.
 */
export interface TagEntry extends Entry<"Tag"> {
  id: string;

  isPublished: boolean;

  name: string;
}

/**
 * QueryParameters is used to define the query parameters for the REST API. It's a basic collection of named properties.
 */
type QueryParameters = Record<string, unknown>;

/**
 * CollectionRequest is used to get a collection of entries. This is a base interface used by all other collections.
 */
export interface CollectionRequest extends QueryParameters {
  skip?: number;
  limit?: number;
}

/**
 * ContentTypeCollectionRequest is used to get a collection of content types.
 */
export type ContentTypeCollectionRequest = CollectionRequest;
/**
 * ContentTypeEntryRequest is used to get a specific content type by its ID, custom ID or machine name.
 */
export interface ContentTypeEntryRequest extends QueryParameters {
  machineName?: string;
  customId?: string;
  id?: string;
}

/**
 * ContentCollectionRequest is used to get a collection of content entries.
 */
export interface ContentCollectionRequest extends CollectionRequest {
  locale?: string;
  include?: number;
  embed?: number;

  content_type?: string;
  order?: string[] | string;
}

/**
 * ContentEntryRequest is used to get a specific content entry by its ID, custom ID or UUID.
 */
export interface ContentEntryRequest extends QueryParameters {
  locale?: string;
  include?: number;

  customId?: string;
  id?: string;
  uuid?: string;
}

/**
 * LocaleCollectionRequest is used to get a collection of locales.
 */
export interface LocaleCollectionRequest extends CollectionRequest {
  locale?: string;

  "sys.name"?: string;
}

/**
 * AssetCollectionRequest is used to get a collection of assets.
 */
export interface AssetCollectionRequest extends CollectionRequest {
  locale?: string;

  "sys.name"?: string;
}

/**
 * AssetEntryRequest is used to get a specific asset by its ID.
 */
export interface AssetEntryRequest extends QueryParameters {
  locale?: string;

  id?: string;
}

/**
 * TagCollectionRequest is used to get a collection of tags.
 */
export interface TagCollectionRequest extends CollectionRequest {
  locale?: string;

  "sys.name"?: string;
}

/**
 * TagEntryRequest is used to get a specific tag by its ID.
 */
export interface TagEntryRequest extends QueryParameters {
  locale?: string;

  id?: string;
}

/**
 * Allowed paths for the REST API.
 */
export type RestInterfaceDataTypes = "space" | "content_types" | "locales" | "entries" | "assets" | "tags";

/**
 * Allowed query parameters for the image optimization API.
 */
export interface ImageSettings extends QueryParameters {
  /**
   * E.g. 300 for 300 pixels.
   */
  width?: number;
  /**
   * E.g. 300 for 300 pixels.
   */
  height?: number;
  /**
   * E.g. #ffffff for white.
   */
  background?: string;
  /**
   * E.g. "auto" or "100,200" in pixels.
   *
   * "auto": use the Drupal focal point setting if available. Otherwise, check the image itself.
   */
  gravity?: "auto" | string;
  /**
   * E.g. "webp" for optimized images.
   */
  format?: "jpeg" | "png" | "gif" | "webp" | "avif" | "svg";
  /**
   * E.g. "scale-down" to prevent upscaling.
   */
  fit?: "scale-down" | "contain" | "cover" | "crop" | "pad";
  /**
   * E.g. 100 for highest quality or 1 for lowest.
   *
   * Only relevant for JPEG output.
   */
  quality?: number;
}

/**
 * Serialize the provided object to query parameters.
 *
 * @param {object} queryParameters
 * @returns {string} The serialized query parameters.
 */
function serializeQuery(queryParameters: QueryParameters): string {
  return Object.entries(queryParameters)
    .map(
      ([name, value]) =>
        `${encodeURIComponent(name)}=${encodeURIComponent(typeof value === "string" ? value : value !== null && value !== undefined ? (Array.isArray(value) ? value.join(",") : value.toString()) : "")}`,
    )
    .join("&");
}

/**
 * Provide an image URL using the image optimization API.
 *
 * @param {string} originalUrl The URL from the assetEntry.imageUrl property.
 * @param {ImageSettings} settings The transformations to apply to the image.
 * @returns {string} The URL to the image optimization API.
 */
export function buildImageUrl(originalUrl: string, settings: ImageSettings): string {
  const query = serializeQuery(settings);
  return originalUrl.includes("?") ? `${originalUrl}&${query}` : `${originalUrl}?${query}`;
}

/**
 * Used to convert a base 62 string to a base 36 string.
 * Required for translating between domain keys and entry IDs.
 *
 * @param {string} value The value to convert.
 * @param {number} fromBase The input base, e.g. 62.
 * @param {number} toBase The output base, e.g. 36.
 * @returns {string} The converted value.
 */
function convertBase(value: string, fromBase: number, toBase: number): string {
  const dictionary = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/".split("");
  const fromDictionary = dictionary.slice(0, fromBase);
  const toDictionary = dictionary.slice(0, toBase);

  let num = value
    .split("")
    .reverse()
    .reduce(function (sum, digit, index) {
      if (fromDictionary.indexOf(digit) === -1) throw new Error("Invalid digit `" + digit + "` for base " + fromBase + ".");
      return sum + fromDictionary.indexOf(digit) * Math.pow(fromBase, index);
    }, 0);

  let result = "";
  while (num > 0) {
    result = toDictionary[num % toBase] + result;
    num = (num - (num % toBase)) / toBase;
  }

  return result || "0";
}

/**
 * ContentCloudRestClient is a client for the Content Cloud REST API.
 * This is the base system client that's only aware of the native types and properties of the Content Cloud system and
 * it should be extended or used by your own Rest Client that's aware of your specific content structure.
 */
export class ContentCloudSystemRestClient {
  /**
   * Convert a base 62 string to a base 36 string.
   * As domains are case-insensitive and entry IDs are case-sensitive, we need to convert the entry ID to a base 36
   * string before it can be used as a subdomain for requests to a space or environment.
   *
   * @param {string} id
   */
  static getDomainKey(id: string) {
    return convertBase(id, 62, 36);
  }

  /**
   * Create a new instance of the ContentCloudRestClient.
   *
   * @param {object} options
   * @param {string} options.baseUrl The base URL of the Content Cloud API. This is different per region of hosting.
   * @param {string} [options.accessToken] The access token to use for authentication. This is optional and will use the public environment permissions if not provided.
   * @param {string} [options.spaceId] The space ID to use for the requests. This is optional and only required when using the cacheId helper.
   * @param {string} [options.environmentId] The environment ID to use for the requests. This is optional and only required when using the cacheId helper.
   * @param {typeof fetch} [options.fetch] The fetch function to use for the requests. This is optional and will use the global fetch function if not provided.
   */
  constructor(
    private readonly options: {
      baseUrl: string;
      accessToken?: string;
      spaceId?: string;
      environmentId?: string;
      fetch?: typeof fetch;
    },
  ) {}

  /**
   * The fetch function to use for making requests.
   *
   * @protected
   */
  protected get fetch() {
    return this.options.fetch ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
  }

  /**
   * The cache ID is used to identify the cache for the space and environment.
   */
  get cacheId(): string {
    if (this.options.spaceId) {
      if (this.options.environmentId) {
        return `${this.options.spaceId}-${this.options.environmentId}`;
      }
      return this.options.spaceId;
    }
    if (this.options.environmentId) {
      return this.options.environmentId;
    }
    return "default";
  }

  /**
   * Make a GET request to the Content Cloud API.
   *
   * @param {string} path The path to the API endpoint. Will be appended to the base URL.
   * @param {string} [query] The query parameters to use for the request.
   * @returns {Promise<ResponseBodyType>} The response body.
   *
   * @template ResponseBodyType The type of the response body, if available.
   */
  async get<ResponseBodyType extends object>(path: string, query?: string): Promise<ResponseBodyType> {
    //console.debug(path, query)

    const response = await this.fetch(`${this.options.baseUrl}${path}${query ? `?${query}` : ""}`, {
      headers: {
        Accept: "application/json",
        ...(this.options.accessToken
          ? {
              Authorization: `Bearer ${this.options.accessToken}`,
            }
          : {}),
      },
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const responseBody = await response.json();

    responseBody.errors && console.log(responseBody.errors);

    //console.debug(responseBody)

    return responseBody;
  }

  /**
   * Make a POST request to the Content Cloud API.
   *
   * @param {string} path The path to the API endpoint. Will be appended to the base URL.
   * @param {object} body The body of the request. This will be serialized to JSON.
   * @returns {Promise<ResponseBodyType>} The response body.
   *
   * @template ResponseBodyType The type of the response body, if available.
   */
  async post<ResponseBodyType extends object, RequestBodyType extends object>(
    path: string,
    body: RequestBodyType,
  ): Promise<ResponseBodyType> {
    const response = await this.fetch(`${this.options.baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(this.options.accessToken
          ? {
              Authorization: `Bearer ${this.options.accessToken}`,
            }
          : {}),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const responseBody = await response.json();

    responseBody.errors && console.log(responseBody.errors);

    return responseBody;
  }

  /**
   * Make a GET request to the Content Cloud API, following the namespaced URL structure.
   *
   * @param {RestInterfaceDataTypes} type The type of the request like "space" or "asset".
   * @param {string} [id] The ID of the entry to get. If not provided, will return a list of items instead.
   * @param {Record<string, unknown>} [queryParameters] The query parameters to use for the request. Will be serialized to a query string.
   * @returns {Promise<ResponseBodyType>} The response body.
   *
   * @template ResponseBodyType The type of the response body, if available.
   */
  async query<ResponseBodyType extends object>(
    type: RestInterfaceDataTypes,
    id?: string,
    queryParameters?: Record<string, unknown>,
  ): Promise<ResponseBodyType> {
    return this.get<ResponseBodyType>(`/${type}${id ? `/${id}` : ""}`, queryParameters && serializeQuery(queryParameters));
  }

  /**
   * Get a collection of content types.
   *
   * @param {ContentTypeCollectionRequest} [request] The request parameters to use for the request.
   * @returns {Promise<CollectionResponse<ContentTypeEntry>>} The response body.
   */
  async contentTypeCollection(request?: ContentTypeCollectionRequest): Promise<CollectionResponse<ContentTypeEntry>> {
    return this.query("content_types", undefined, request);
  }

  /**
   * Get a specific content type by its ID, custom ID or machine name.
   *
   * @param {ContentTypeEntryRequest} [request] The request parameters to use for the request.
   * @returns {Promise<ContentTypeEntry | null>} The response body.
   */
  async contentTypeEntry(request?: ContentTypeEntryRequest): Promise<ContentTypeEntry | null> {
    if (request?.id) {
      return this.query<ContentTypeEntry>("content_types", request.id);
    }
    const response = await this.query<CollectionResponse<ContentTypeEntry>>("content_types", undefined, request);

    return response?.items?.[0] ?? null;
  }

  /**
   * Get a collection of content entries.
   *
   * @param {ContentCollectionRequest} [request] The request parameters to use for the request.
   * @returns {Promise<ContentEntryCollection>} The response body.
   *
   * @template ContentEntryCollection The type of the content entry, if available.
   */
  async contentCollection<ContentEntryCollection extends CollectionResponse<ContentEntry>>(
    request?: ContentCollectionRequest,
  ): Promise<ContentEntryCollection> {
    return this.query("entries", undefined, request);
  }

  /**
   * Get a specific content entry by its ID, custom ID or UUID.
   *
   * @param {ContentEntryRequest} [request] The request parameters to use for the request.
   * @returns {Promise<ContentEntryType | null>} The response body.
   *
   * @template ContentEntryType The type of the content entry, if available.
   */
  async contentEntry<ContentEntryType extends ContentEntry = ContentEntry>(
    request?: ContentEntryRequest,
  ): Promise<ContentEntryType | null> {
    if (request?.id) {
      return this.query<ContentEntryType>("entries", request.id, request);
    }
    const response = await this.query<CollectionResponse<ContentEntryType>>("entries", undefined, request);

    return response?.items?.[0] ?? null;
  }

  /**
   * Get the space entry for the current connection.
   */
  async spaceEntry(): Promise<SpaceEntry> {
    return this.query("space");
  }

  /**
   * Get a list of locales for the current space.
   *
   * @param {LocaleCollectionRequest} [request] The request parameters to use for the request.
   */
  async localeCollection(request?: LocaleCollectionRequest): Promise<CollectionResponse<LocaleEntry>> {
    return this.query("locales", undefined, request);
  }

  /**
   * Get a collection of assets.
   *
   * @param {AssetCollectionRequest} [request] The request parameters to use for the request.
   */
  async assetCollection(request?: AssetCollectionRequest): Promise<CollectionResponse<AssetEntry>> {
    return this.query("assets", undefined, request);
  }

  /**
   * Get a specific asset by its ID.
   *
   * @param {AssetEntryRequest} [request] The request parameters to use for the request.
   */
  async assetEntry(request?: AssetEntryRequest): Promise<AssetEntry | null> {
    if (request?.id) {
      return this.query<AssetEntry>("assets", request.id, request);
    }
    const response = await this.query<CollectionResponse<AssetEntry>>("assets", undefined, request);

    return response?.items?.[0] ?? null;
  }

  /**
   * Get a collection of tags.
   *
   * @param {TagCollectionRequest} [request] The request parameters to use for the request.
   */
  async tagCollection(request?: TagCollectionRequest): Promise<CollectionResponse<TagEntry>> {
    return this.query("tags", undefined, request);
  }

  /**
   * Get a specific tag by its ID.
   *
   * @param {TagEntryRequest} [request] The request parameters to use for the request.
   */
  async tagEntry(request?: TagEntryRequest): Promise<TagEntry | null> {
    if (request?.id) {
      return this.query<TagEntry>("tags", request.id, request);
    }
    const response = await this.query<CollectionResponse<TagEntry>>("tags", undefined, request);

    return response?.items?.[0] ?? null;
  }
}
