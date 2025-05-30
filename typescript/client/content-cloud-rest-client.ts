/* eslint-disable @typescript-eslint/no-explicit-any */
import { CollectionResponse, ContentCloudSystemRestClient } from "./content-cloud-system-rest-client";
import { AnyIndependentEntry, ContentTypes, ContentUserDataTypes, Entry } from "./rest-schema";

export type RestListResponse<ItemType extends object = AnyIndependentEntry> = CollectionResponse<ItemType>;

/**
 * All available request options typed out.
 * When making a request, these are serialized to query parameters.
 */
export interface RestRequestOptions {
  /**
   * The number of entries to skip before returning results.
   */
  skip?: number;
  /**
   * The number of entries to return (usually the page size for pagination).
   */
  limit?: number;

  /**
   * The content type to filter by.
   * Providing this will provide a response that's typed more strictly.
   */
  content_type?: keyof ContentTypes;
  /**
   * Filters for a collection request.
   */
  filter?: object;
  /**
   * The order in which to return the entries.
   */
  order?: string[];
  /**
   * The fields to include in the response.
   */
  select?: string[];

  /**
   * The number of levels to include in the response for linked entries.
   */
  include?: number;
  /**
   * The number of levels to include in the response for embedded entries.
   */
  embed?: number;

  /**
   * The user data types to include in the response.
   */
  user_data_types?: (keyof ContentUserDataTypes)[];

  /**
   * The search query to use for the request.
   */
  query?: string;

  /**
   * The filter to apply to the user data for the current user tied to the entries in the collection.
   */
  user_data_filter?: {
    [Type in keyof ContentUserDataTypes]: ContentUserDataTypes[Type]["Filter"];
  };
}

/**
 * The available options for the `select` parameter based on the entry type.
 * This is a semi-recursive type that generates a string union of all possible keys in the entry type.
 * It only goes three levels deep to avoid excessive complexity that would result in TypeScript errors.
 *
 * @template EntryType The entry type to generate the select options for.
 */
export type RestSelectOptions<EntryType extends Record<string, any>> = EntryType extends object
  ? {
      [K0 in string & keyof EntryType]: `${K0}${
        | ""
        | (NonNullable<EntryType[K0]> extends object
            ? NonNullable<EntryType[K0]> extends (infer K0ElementType | null | undefined)[]
              ? NonNullable<K0ElementType> extends object
                ? {
                    [K1 in string & keyof NonNullable<K0ElementType>]: `.${K1}${
                      | ""
                      | (NonNullable<NonNullable<K0ElementType>[K1]> extends object
                          ? NonNullable<NonNullable<K0ElementType>[K1]> extends (infer K1ElementType | null | undefined)[]
                            ? NonNullable<K1ElementType> extends object
                              ? {
                                  [K2 in string & keyof NonNullable<K1ElementType>]: `.${K2}`;
                                }[string & keyof NonNullable<K1ElementType>]
                              : never
                            : {
                                [K2 in string & keyof NonNullable<NonNullable<K0ElementType>[K1]>]: `.${K2}`;
                              }[string & keyof NonNullable<NonNullable<K0ElementType>[K1]>]
                          : never)}`;
                  }[string & keyof NonNullable<K0ElementType>]
                : {
                    [K1 in string & keyof NonNullable<K0ElementType>]: `.${K1}${
                      | ""
                      | (NonNullable<NonNullable<K0ElementType>[K1]> extends object
                          ? NonNullable<NonNullable<K0ElementType>[K1]> extends (infer K1ElementType | null | undefined)[]
                            ? NonNullable<K1ElementType> extends object
                              ? {
                                  [K2 in string & keyof NonNullable<K1ElementType>]: `.${K2}`;
                                }[string & keyof NonNullable<K1ElementType>]
                              : never
                            : {
                                [K2 in string & keyof NonNullable<NonNullable<K0ElementType>[K1]>]: `.${K2}`;
                              }[string & keyof NonNullable<NonNullable<K0ElementType>[K1]>]
                          : never)}`;
                  }[string & keyof NonNullable<K0ElementType>]
              : {
                  [K1 in string & keyof NonNullable<EntryType[K0]>]: `.${K1}${
                    | ""
                    | (NonNullable<NonNullable<EntryType[K0]>[K1]> extends object
                        ? NonNullable<NonNullable<EntryType[K0]>[K1]> extends (infer K1ElementType | null | undefined)[]
                          ? NonNullable<K1ElementType> extends object
                            ? {
                                [K2 in string & keyof NonNullable<K1ElementType>]: `.${K2}`;
                              }[string & keyof NonNullable<K1ElementType>]
                            : never
                          : {
                              [K2 in string & keyof NonNullable<NonNullable<EntryType[K0]>[K1]>]: `.${K2}`;
                            }[string & keyof NonNullable<NonNullable<EntryType[K0]>[K1]>]
                        : never)}`;
                }[string & keyof NonNullable<EntryType[K0]>]
            : never)}`;
    }[string & keyof EntryType]
  : never;
type SelectedKeys<Entry, Select, Prefix extends string = ""> = {
  [K in string & keyof NonNullable<Entry>]: Select extends `${Prefix}${K}` | `${Prefix}${K}.${string}` ? K : never;
}[string & keyof NonNullable<Entry>];
export type RestSelect<Entry extends Record<string, any> | null, Select extends string, Prefix extends string = ""> = {
  [K0 in SelectedKeys<Entry, Select, Prefix>]: `${Prefix}${K0}` extends Select
    ? NonNullable<Entry>[K0]
    : NonNullable<NonNullable<Entry>[K0]> extends (infer ElementType)[]
      ? NonNullable<ElementType> extends Record<string, any>
        ? (null extends ElementType
            ? RestSelect<NonNullable<ElementType>, Select, `${Prefix}${K0}.`> | null
            : RestSelect<NonNullable<ElementType>, Select, `${Prefix}${K0}.`>)[]
        : never[]
      : NonNullable<NonNullable<Entry>[K0]> extends Record<string, any>
        ? null extends NonNullable<Entry>[K0]
          ? RestSelect<NonNullable<NonNullable<Entry>[K0]>, Select, `${Prefix}${K0}.`> | null
          : RestSelect<NonNullable<NonNullable<Entry>[K0]>, Select, `${Prefix}${K0}.`>
        : never;
};
export type EntryLink = {
  sys: {
    type: "Link";
    id: string;
    linkType: string;
  };
};
/*
 * If a subtype extends Entry, we change the typing to be either this type or an EntryLink.
 */
export type EntryWithLinks<EntryType extends Record<string, any>> = {
  [K in keyof EntryType]: EntryType[K] extends object
    ? EntryType[K] extends (infer ElementType)[]
      ? ElementType extends Record<string, any>
        ? ElementType extends Entry
          ? EntryWithLinks<ElementType> | EntryLink
          : EntryWithLinks<ElementType>
        : ElementType
      : EntryType[K] extends Entry
        ? EntryWithLinks<EntryType[K]> | EntryLink
        : EntryWithLinks<EntryType[K]>
    : EntryType[K];
};

export type RestRequestOptionInclude = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type RestRequestOptionEmbed = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type RestRequestOptionIncludeDefaultValue = 1;
export type RestRequestOptionEmbedDefaultValue = 1;

/**
 * Typed request options if the content type is known in advance.
 * This just overwrites base properties.
 *
 * @template TypeName The name of the content type to request. Must be a key of ContentTypes.
 * @template Select The select options to use for the request. Must be a string based on RestSelectOptions<...>.
 */
export type TypedRestRequestOptions<
  TypeName extends keyof ContentTypes,
  Select extends RestSelectOptions<EntryWithLinks<ContentTypes[TypeName]["Entry"]>> & string,
  Include extends RestRequestOptionInclude = RestRequestOptionIncludeDefaultValue,
  Embed extends RestRequestOptionEmbed = RestRequestOptionEmbedDefaultValue,
> = RestRequestOptions & {
  content_type: TypeName;
  select?: Select[];
  order?: ContentTypes[TypeName]["Order"][];
  filter?: ContentTypes[TypeName]["Filter"];
  include?: Include;
  embed?: Embed;
};

/**
 * Available options for the REST client.
 * This is used to configure the client when creating an instance.
 */
interface RestClientOptions {
  baseUrl?: string;
  accessToken?: string;
  spaceId?: string;
  environmentId?: string;
  apiVersion?: string;
  fetch?: typeof fetch;
}

/**
 * Parses a JWT token to return the payload.
 * !!! THIS DOES NOT VALIDATE THE TOKEN !!!
 *
 * @param {string} token The JWT token to parse.
 * @returns {Record<string, any>} The parsed payload of the token.
 */
function parseJwt(token: string) {
  const base64Url = token.split(".")[1]!;
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join(""),
  );

  return JSON.parse(jsonPayload);
}

const FILTER_NAMES = ["in", "nin", "match", "all", "some", "none", "exists", "ne", "lt", "gt", "lte", "gte"];

/**
 * Flattens a filter object into a query string.
 *
 * @param {Record<string, any>} filter The filter object to flatten.
 * @param {string} prefix The prefix to use for the keys in the flattened object for nested filters.
 * @param {boolean} root Whether this is the root of the filter object. Used to determine the appropriate prefix.
 *
 * @returns {Record<string, string>} The flattened filter object.
 */
function flattenFilter(filter: Record<string, any>, prefix: string = "", root: boolean = true): Record<string, string> {
  const result: Record<string, string> = {};

  // eslint-disable-next-line prefer-const
  for (let [key, value] of Object.entries(filter)) {
    if (value && typeof value === "object") {
      if (Array.isArray(value)) {
        value = value.join(",");
      } else {
        Object.assign(result, flattenFilter(value, `${prefix}${key}.`, false));
        continue;
      }
    }

    if (!root && FILTER_NAMES.includes(key) && prefix !== "fields.") {
      result[`${prefix.substring(0, prefix.length - 1)}[${key}]`] = value + "";
    } else {
      result[`${prefix}${key}`] = value + "";
    }
  }

  return result;
}

/**
 * The main class for the Content Cloud REST client.
 * This class will use your custom content model from the accompanying schema.ts file.
 * If you need a standalone client to work with unknown content models, please use the ContentCloudSystemRestClient.
 */
export class ContentCloudRestClient {
  /**
   * The system client is used to access the system API.
   * Can be used to make non-content requests e.g. to fetch the space entry, locales, assets, tags etc.
   */
  public readonly system: ContentCloudSystemRestClient;

  /**
   * The options used to configure the client.
   * @protected
   */
  protected readonly options: RestClientOptions;
  /**
   * The data from the token to authenticate the client.
   * @protected
   */
  protected readonly token: Record<string, any>;

  /**
   * The space ID of the given JWT.
   */
  public get spaceId(): string | undefined {
    return this.options.spaceId;
  }
  /**
   * The environment ID of the given JWT.
   */
  public get environmentId(): string | undefined {
    return this.options.environmentId;
  }
  /**
   * The base URL of the connected Content Cloud.
   */
  public get baseUrl(): string {
    return this.options.baseUrl!;
  }

  /**
   * The constructor for the ContentCloudRestClient.
   *
   * @param {RestClientOptions} [options] The options to configure the client.
   */
  constructor(options?: RestClientOptions) {
    this.options = { ...(options ?? {}) };

    // if the baseUrl is not provided, we try to set it from the environment variable
    if (!this.options.baseUrl) {
      if (typeof process === "object") {
        this.options.baseUrl = process.env.CC_SATELLITE_BASE_URL ?? process.env.CC_BASE_URL;
      }
      if (!this.options.baseUrl) {
        throw Error("baseUrl is required.");
      }
    }

    if (this.options.baseUrl.endsWith("/")) {
      throw new Error("baseUrl must not end with a slash.");
    }

    // if the access token is not provided, we try to set it from the environment variable
    if (!this.options.accessToken) {
      if (typeof process === "object") {
        this.options.accessToken = process.env.CC_ACCESS_TOKEN;
      }
    }

    // parse the token if it is provided to access the spaceId and environmentId
    this.token = this.options.accessToken && parseJwt(this.options.accessToken);

    // if the token is not provided, we need to set the spaceId and environmentId from the token
    if (!this.options.spaceId) {
      if (this.token.spaceId) {
        this.options.spaceId = this.token.spaceId;
      }
    }
    if (!this.options.environmentId) {
      if (this.token.environmentIds?.length) {
        this.options.environmentId = this.token.environmentIds[0];
      }
    }

    this.system = new ContentCloudSystemRestClient({
      baseUrl: this.options.baseUrl,
      accessToken: this.options.accessToken,
      spaceId: this.options.spaceId,
      environmentId: this.options.environmentId,
      fetch: this.options.fetch,
    });
  }

  /**
   * Update the user data for a given content entry.
   *
   * @template TypeName The type of user data to update. Must be a key of ContentUserDataTypes.
   *
   * @param {string} contentId The ID of the content entry to update.
   * @param {keyof ContentUserDataTypes} type The type of user data to update.
   * @param {ContentUserDataTypes[TypeName]["Update"]} data The data to update.
   */
  async setContentUserData<TypeName extends keyof ContentUserDataTypes & string>(
    contentId: string,
    type: TypeName,
    data: ContentUserDataTypes[TypeName]["Update"],
  ): Promise<ContentUserDataTypes[TypeName]["Entry"]> {
    return await this.system.post(`/entries/${contentId}/user_data/${type}`, data);
  }

  /**
   * Get a collection of content entries.
   * This is a generic method that can be used to get any content type.
   * You can use the `content_type` parameter to filter by content type. This will provide a typed response.
   * All options will be passed to the system client where they are serialized into a query string.
   *
   * @template TypeName The type of content to request. Must be a key of ContentTypes.
   *
   * @param {TypedRestRequestOptions} options The options to use for the request.
   * @return {Promise<RestListResponse>} The response from the request.
   */
  async contentCollection<
    TypeName extends keyof ContentTypes & string,
    Include extends RestRequestOptionInclude,
    Embed extends RestRequestOptionEmbed,
    Select extends RestSelectOptions<EntryWithLinks<ContentTypes[TypeName]["Entry"]>> & string,
  >(
    options: TypedRestRequestOptions<TypeName, Select, Include, Embed>,
  ): Promise<RestListResponse<RestSelect<EntryWithLinks<ContentTypes[TypeName]["Entry"]>, Select>>>;
  async contentCollection<
    TypeName extends keyof ContentTypes & string,
    Select extends RestSelectOptions<EntryWithLinks<ContentTypes[TypeName]["Entry"]>> & string,
  >(
    options: TypedRestRequestOptions<TypeName, Select>,
  ): Promise<RestListResponse<RestSelect<EntryWithLinks<ContentTypes[TypeName]["Entry"]>, Select>>>;
  async contentCollection(options?: Omit<RestRequestOptions, "content_type">): Promise<RestListResponse>;
  async contentCollection(
    options?: RestRequestOptions & {
      content_type?: string;
      select?: string[];
      order?: string[];
      filter?: object;
    },
  ): Promise<RestListResponse> {
    const params: Record<string, any> = {};

    if (options?.content_type) {
      params.content_type = options.content_type;
    }

    if (typeof options?.skip === "number") {
      params.skip = options.skip.toString();
    }

    if (typeof options?.limit === "number") {
      params.limit = options.limit.toString();
    }

    if (typeof options?.include === "number") {
      params.include = options.include.toString();
    }

    if (typeof options?.embed === "number") {
      params.embed = options.embed.toString();
    }

    if (options?.select?.length) {
      params.select = options.select.join(",");
    }

    if (options?.order?.length) {
      params.order = options.order.join(",");
    }

    if (options?.query) {
      params.query = options.query;
    }

    if (options?.filter) {
      Object.assign(params, flattenFilter(options.filter));
    }

    if (options?.user_data_filter) {
      if (!options.user_data_types) {
        options.user_data_types = [];
      }

      for (const [name, filter] of Object.entries(options.user_data_filter) as [keyof ContentUserDataTypes, object][]) {
        Object.assign(params, flattenFilter(filter, `user_data.${name}.`));
        if (!options.user_data_types.includes(name)) {
          options.user_data_types.push(name);
        }
      }
    }

    if (options?.user_data_types?.length) {
      params.user_data_types = options.user_data_types.join(",");
    }

    return await this.system.contentCollection<any>(params);
  }
}
