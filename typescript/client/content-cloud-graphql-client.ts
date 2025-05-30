import { CONTENT_USER_DATA_ENTRY_TYPES, ContentTypes, ContentUserDataTypes, INDEPENDENT_ENTRY_TYPES } from "./graphql-schema";

/**
 * CollectionResponse is used to define the response of a collection of entries in the system.
 * This is a base type to define the metadata provided for pagination.
 *
 * @template Type The type definition for the entries in the collection.
 */
interface CollectionResponse<Type> {
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

type GraphQLParams = Record<string, any>;

/**
 * Options for configuring the GraphQL client.
 */
export interface GraphQLClientOptions {
  /**
   * The base URL of the Content Cloud GraphQL API, excluding the `/graphql` endpoint.
   */
  baseUrl: string;
  /**
   * The access token to use for authentication.
   */
  accessToken?: string;
  /**
   * The ID of the space to use for the GraphQL requests.
   */
  spaceId?: string;
  /**
   * The ID of the environment to use for the GraphQL requests.
   */
  environmentId?: string;
  /**
   * Optional fetch function to use for making requests.
   * If not provided, the native fetch will be used.
   */
  fetch?: typeof fetch;
}

export type GraphQLSelect<Type extends object> = {
  [K in keyof Type]?: NonNullable<Type[K]> extends Array<infer U>
    ? NonNullable<U> extends object
      ? GraphQLSelect<NonNullable<U>>
      : 1
    : NonNullable<Type[K]> extends object
      ? GraphQLSelect<NonNullable<Type[K]>>
      : 1;
};
export type GraphQLSelected<Type extends object, SelectedType extends GraphQLSelect<Type>> = {
  [K in keyof SelectedType]: K extends keyof Type
    ? Type[K] extends Array<infer U>
      ? U extends object
        ? SelectedType[K] extends GraphQLSelect<U>
          ? Array<GraphQLSelected<U, SelectedType[K]>>
          : never
        : Type[K]
      : Type[K] extends object
        ? SelectedType[K] extends GraphQLSelect<Type[K]>
          ? GraphQLSelected<Type[K], SelectedType[K]>
          : never
        : Type[K]
    : never;
};
function getSelectedFields(select: GraphQLSelect<Record<string, any>>): string {
  return Object.entries(select)
    .map(([key, value]) => {
      if (typeof value === "object" && value !== null) {
        return `${key} { ${getSelectedFields(value)} }`;
      }
      return key;
    })
    .join("\n");
}

/**
 * Base class for GraphQL clients that handles the core GraphQL functionality.
 * This class uses native fetch and expects a Proxy on top to handle GraphQL operations.
 * It is designed to be extended for specific content types and user data types.
 *
 * @protected
 */
class ContentCloudGraphQLClient {
  /**
   * The fetch function to use for making requests.
   *
   * @protected
   */
  protected get fetch() {
    return this.options.fetch ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
  }

  /**
   * Create a new instance of the ContentCloudGraphQLClient.
   *
   * @param {GraphQLClientOptions} options The options to configure the client.
   */
  constructor(private readonly options: GraphQLClientOptions) {}

  /**
   * Execute a GraphQL query or mutation.
   *
   * @param {string} query The GraphQL query string
   * @param {Record<string, any>} variables The variables for the query
   * @returns {Promise<any>} The response data
   */
  async query<ResponseData extends Record<string, any>>(
    query: string,
    variables: Record<string, any> = {},
    queryName?: string,
  ): Promise<ResponseData> {
    let url = `${this.options.baseUrl}/graphql`;
    if (variables.userDataTypes) {
      // If userDataTypes are provided, append them to the URL as a query parameter
      url += `?user_data_types=${variables.userDataTypes.join(",")}`;

      // Remove from variables to avoid sending it in the body
      variables = { ...variables };
      delete variables.userDataTypes;
    }
    const response = await this.fetch(url, {
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
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const result = await response.json();

    if (result.errors) {
      console.error("GraphQL Errors:", result.errors);

      if (!result.data) {
        throw new Error(result.errors[0].message);
      }
    }

    if (!result.data) {
      console.error("GraphQL Response without data:", result);

      throw new Error("GraphQL response does not contain data.");
    }

    if (queryName) {
      if (!result.data[queryName]) {
        console.error(`GraphQL Response does not contain data for query "${queryName}":`, result.data);

        throw new Error(`GraphQL response does not contain data for query "${queryName}".`);
      }

      return result.data[queryName];
    }

    return result.data;
  }

  /**
   * Fetch a collection of entries for a specific content type.
   *
   * @template ResponseData The type of the response data.
   * @template Select The type of the fields to select from the collection.
   *
   * @param {keyof ContentTypes} contentType The content type to fetch the collection for.
   * @param {GraphQLSelect<ResponseData>} select The fields to select from the collection.
   * @param {GraphQLParams} [params] Optional parameters for the query, such as locale, skip, limit, where, search, and order.
   * @return {Promise<ResponseData>} A promise that resolves to the collection response data.
   */
  collection<ResponseData extends CollectionResponse<Record<string, any>>, Select extends GraphQLSelect<ResponseData>>(
    contentType: keyof ContentTypes,
    select: Select,
    params?: GraphQLParams,
  ): Promise<GraphQLSelected<ResponseData, Select>> {
    const queryName = contentType.charAt(0).toLowerCase() + contentType.slice(1) + "Collection";
    return this.query<GraphQLSelected<ResponseData, Select>>(
      `
query ${queryName}($locale: String, $skip: Int, $limit: Int, $where: ${contentType}Filter, $search: String, $order: [${contentType}Order!]) {
  ${queryName}(locale: $locale, skip: $skip, limit: $limit, where: $where, search: $search, order: $order) {
${getSelectedFields(select)}
  }
}
`,
      params,
      queryName,
    );
  }

  /**
   * Fetch a single entry for a specific content type.
   *
   * @template ResponseData The type of the response data.
   * @template Select The type of the fields to select from the entry.
   *
   * @param {keyof ContentTypes} contentType The content type to fetch the entry for.
   * @param {GraphQLSelect<ResponseData>} select The fields to select from the entry.
   * @param {GraphQLParams} [params] Optional parameters for the query, such as locale, id, revisionId, uuid, customId, and slug.
   *   Must include at least one filter parameter to identify the entry.
   * @return {Promise<ResponseData>} A promise that resolves to the entry response data.
   */
  entry<ResponseData extends Record<string, any>, Select extends GraphQLSelect<ResponseData>>(
    contentType: keyof ContentTypes,
    select: Select,
    params?: GraphQLParams,
  ): Promise<GraphQLSelected<ResponseData, Select>> {
    const queryName = contentType.charAt(0).toLowerCase() + contentType.slice(1);
    return this.query<GraphQLSelected<ResponseData, Select>>(
      `
query ${queryName}($locale: String, $id: String, $revisionId: String, $uuid: String, $customId: String, $slug: String) {
  ${queryName}(locale: $locale, id: $id, revisionId: $revisionId, uuid: $uuid, customId: $customId, slug: $slug) {
${getSelectedFields(select)}
  }
}
`,
      params,
      queryName,
    );
  }

  /**
   * Set user data for a specific content entry and user data type.
   *
   * @template ContentType The type of the content user data to set.
   * @template Select The type of the fields to select from the user data entry.
   *
   * @param {ContentType} contentType The content type to set the user data for.
   * @param {GraphQLSelect<ContentUserDataTypes[ContentType]["Entry"]>} select The fields to select from the user data entry.
   * @param {Object} variables The variables for the mutation, including contentId and input for the mutation.
   * @return {Promise<CollectionResponse<ContentUserDataTypes[ContentType]["Entry"]>>} A promise that resolves to the updated user data entry.
   */
  setContentUserData<
    ContentType extends keyof ContentUserDataTypes,
    Select extends GraphQLSelect<ContentUserDataTypes[ContentType]["Entry"]>,
  >(
    contentType: ContentType,
    select: Select,
    variables: {
      contentId: string;
      input: ContentUserDataTypes[ContentType]["Update"];
    },
  ): Promise<GraphQLSelected<ContentUserDataTypes[ContentType]["Entry"], Select>> {
    return this.query<GraphQLSelected<ContentUserDataTypes[ContentType]["Entry"], Select>>(
      `
mutation Set${contentType}($contentId: String!, $input: Set${contentType}Input!) {
  set${contentType}(contentId: $contentId, input: $input) {
${getSelectedFields(select)}
  }
}
`,
      { ...variables, userDataTypes: [contentType] },
      `set${contentType}`,
    );
  }
}

type EntryParams<K extends keyof ContentTypes> = {
  userDataTypes?: (keyof ContentUserDataTypes)[];
  locale?: string;
  id?: string;
  revisionId?: string;
  uuid?: string;
  customId?: string;
  slug?: string;
};

type CollectionParams<K extends keyof ContentTypes> = {
  userDataTypes?: (keyof ContentUserDataTypes)[];
  locale?: string;
  skip?: number;
  limit?: number;
  where?: ContentTypes[K]["Filter"];
  search?: string;
  order?: ContentTypes[K]["Order"][];
};

type QueryMethods<ContentType extends keyof ContentTypes> = {
  [K in Uncapitalize<ContentType>]: <Select extends GraphQLSelect<ContentTypes[ContentType]["Entry"]>>(
    select: Select,
    params: EntryParams<ContentType>,
  ) => Promise<GraphQLSelected<ContentTypes[ContentType]["Entry"], Select>>;
} & {
  [K in `${Uncapitalize<ContentType>}Collection`]: <Select extends GraphQLSelect<CollectionResponse<ContentTypes[ContentType]["Entry"]>>>(
    select: Select,
    params?: CollectionParams<ContentType>,
  ) => Promise<GraphQLSelected<CollectionResponse<ContentTypes[ContentType]["Entry"]>, Select>>;
};

type MutationMethods<ContentType extends keyof ContentUserDataTypes> = {
  [K in `set${ContentType}`]: <Select extends GraphQLSelect<ContentUserDataTypes[ContentType]["Entry"]>>(
    contentId: string,
    input: ContentUserDataTypes[ContentType]["Update"],
    select: Select,
  ) => Promise<GraphQLSelected<ContentUserDataTypes[ContentType]["Entry"], Select>>;
};

type TypedClient = QueryMethods<keyof ContentTypes> & MutationMethods<keyof ContentUserDataTypes>;

/**
 * Creates a GraphQL client for the Content Cloud that can be used to fetch entries and collections.
 * This client uses a Proxy to dynamically create methods for each content type defined by your GraphQL schema.
 *
 * @param {GraphQLClientOptions} options The options to configure the client.
 */
export function createContentCloudGraphQLClient(options: GraphQLClientOptions): ContentCloudGraphQLClient & TypedClient {
  const client = new ContentCloudGraphQLClient(options);

  return new Proxy(client, {
    get: (target, prop, receiver) => {
      let type = prop.toString();
      type = type.charAt(0).toUpperCase() + type.slice(1);

      if (INDEPENDENT_ENTRY_TYPES.includes(type as any)) {
        return (select: any, params: GraphQLParams) => {
          return target.entry(type as keyof ContentTypes, select, params);
        };
      } else if (type.endsWith("Collection")) {
        type = type.slice(0, -"Collection".length);
        if (INDEPENDENT_ENTRY_TYPES.includes(type as any)) {
          return (select: any, params?: GraphQLParams) => {
            return target.collection(type as keyof ContentTypes, select, params);
          };
        }
      } else if (type.startsWith("Set")) {
        type = type.slice("Set".length);
        if (CONTENT_USER_DATA_ENTRY_TYPES.includes(type as any)) {
          return (contentId: string, input: Record<string, any>, select: any) => {
            return target.setContentUserData(type as keyof ContentUserDataTypes, select, {
              contentId,
              input,
            });
          };
        }
      }

      return Reflect.get(target, prop, receiver);
    },
  }) as ContentCloudGraphQLClient & TypedClient;
}
