import Typesense from "typesense";

let client: Typesense.Client | null = null;

function getClient() {
  if (!client) {
    client = new Typesense.Client({
      nodes: [
        {
          host: process.env.TYPESENSE_HOST || "localhost",
          port: parseInt(process.env.TYPESENSE_PORT || "8108"),
          protocol: process.env.TYPESENSE_PROTOCOL || "http",
        },
      ],
      apiKey: process.env.TYPESENSE_API_KEY || "xyz",
      connectionTimeoutSeconds: 2,
    });
  }
  return client;
}

// Schema definitions
const messagesSchema = {
  name: "messages",
  fields: [
    { name: "content", type: "string" },
    { name: "channelId", type: "string", facet: true },
    { name: "userId", type: "string", facet: true },
    { name: "createdAt", type: "int64", sort: true },
  ],
  default_sorting_field: "createdAt",
};

const wikiPagesSchema = {
  name: "wiki_pages",
  fields: [
    { name: "title", type: "string" },
    { name: "content", type: "string" },
    { name: "slug", type: "string" },
    { name: "workspaceId", type: "string", facet: true },
    { name: "authorId", type: "string", facet: true },
    { name: "tags", type: "string[]", facet: true, optional: true },
    { name: "createdAt", type: "int64", sort: true },
  ],
  default_sorting_field: "createdAt",
};

const filesSchema = {
  name: "files",
  fields: [
    { name: "name", type: "string" },
    { name: "content", type: "string", optional: true },
    { name: "type", type: "string", facet: true },
    { name: "workspaceId", type: "string", facet: true },
    { name: "uploadedBy", type: "string", facet: true },
    { name: "createdAt", type: "int64", sort: true },
  ],
  default_sorting_field: "createdAt",
};

const usersSchema = {
  name: "users",
  fields: [
    { name: "name", type: "string" },
    { name: "email", type: "string" },
    { name: "role", type: "string", facet: true },
    { name: "createdAt", type: "int64", sort: true },
  ],
  default_sorting_field: "createdAt",
};

export async function initSearch() {
  try {
    const collections = await getClient().collections().retrieve();
    const collectionNames = collections.map((c) => c.name);

    if (!collectionNames.includes("messages")) {
      await getClient()
        .collections()
        .create(messagesSchema as any);
      console.log("Created messages collection");
    }
    if (!collectionNames.includes("wiki_pages")) {
      await getClient()
        .collections()
        .create(wikiPagesSchema as any);
      console.log("Created wiki_pages collection");
    }
    if (!collectionNames.includes("files")) {
      await getClient()
        .collections()
        .create(filesSchema as any);
      console.log("Created files collection");
    }
    if (!collectionNames.includes("users")) {
      await getClient()
        .collections()
        .create(usersSchema as any);
      console.log("Created users collection");
    }
  } catch (error) {
    console.error("Error initializing search:", error);
  }
}

// Indexing functions
export async function indexMessage(message: any) {
  try {
    const document = {
      id: message.id,
      content: message.content,
      channelId: message.channelId,
      userId: message.userId,
      createdAt: new Date(message.createdAt).getTime(),
    };
    await getClient().collections("messages").documents().upsert(document);
  } catch (error) {
    console.error("Error indexing message:", error);
  }
}

export async function indexWikiPage(page: any) {
  try {
    const document = {
      id: page.id,
      title: page.title,
      content: page.content,
      slug: page.slug,
      workspaceId: page.workspaceId,
      authorId: page.authorId,
      tags: page.tags?.map((t: any) => t.tag?.name || t.name) || [],
      createdAt: new Date(page.createdAt).getTime(),
    };
    await getClient().collections("wiki_pages").documents().upsert(document);
  } catch (error) {
    console.error("Error indexing wiki page:", error);
  }
}

export async function indexFile(file: any) {
  try {
    const document = {
      id: file.id,
      name: file.name,
      content: file.content || "",
      type: file.type,
      workspaceId: file.workspaceId,
      uploadedBy: file.uploadedBy,
      createdAt: new Date(file.createdAt).getTime(),
    };
    await getClient().collections("files").documents().upsert(document);
  } catch (error) {
    console.error("Error indexing file:", error);
  }
}

export async function indexUser(user: any) {
  try {
    const document = {
      id: user.id,
      name: user.name || "",
      email: user.email,
      role: user.role,
      createdAt: new Date(user.createdAt).getTime(),
    };
    await getClient().collections("users").documents().upsert(document);
  } catch (error) {
    console.error("Error indexing user:", error);
  }
}

// Search function types
export interface SearchFilters {
  workspaceId?: string;
  channelId?: string;
  userId?: string;
  authorId?: string;
  startDate?: Date;
  endDate?: Date;
  tags?: string[];
}

export interface SearchOptions {
  limit?: number;
  highlight?: boolean;
}

// Search functions
export async function searchMessages(
  query: string,
  filters?: SearchFilters,
  options: SearchOptions = {}
) {
  try {
    const { limit = 10, highlight = true } = options;
    const filterParts: string[] = [];

    if (filters?.channelId) filterParts.push(`channelId:=${filters.channelId}`);
    if (filters?.userId) filterParts.push(`userId:=${filters.userId}`);
    if (filters?.startDate) {
      filterParts.push(`createdAt:>=${filters.startDate.getTime()}`);
    }
    if (filters?.endDate) {
      filterParts.push(`createdAt:<=${filters.endDate.getTime()}`);
    }

    const searchParameters: any = {
      q: query,
      query_by: "content",
      per_page: limit,
    };

    if (filterParts.length > 0) {
      searchParameters.filter_by = filterParts.join(" && ");
    }

    if (highlight) {
      searchParameters.highlight_full_fields = "content";
      searchParameters.highlight_affix_num_tokens = 8;
    }

    return await getClient().collections("messages").documents().search(searchParameters);
  } catch (error) {
    console.error("Error searching messages:", error);
    return { hits: [], found: 0 };
  }
}

export async function searchWikiPages(
  query: string,
  filters?: SearchFilters,
  options: SearchOptions = {}
) {
  try {
    const { limit = 10, highlight = true } = options;
    const filterParts: string[] = [];

    if (filters?.workspaceId) filterParts.push(`workspaceId:=${filters.workspaceId}`);
    if (filters?.authorId) filterParts.push(`authorId:=${filters.authorId}`);
    if (filters?.tags && filters.tags.length > 0) {
      filterParts.push(`tags:=[${filters.tags.join(",")}]`);
    }
    if (filters?.startDate) {
      filterParts.push(`createdAt:>=${filters.startDate.getTime()}`);
    }
    if (filters?.endDate) {
      filterParts.push(`createdAt:<=${filters.endDate.getTime()}`);
    }

    const searchParameters: any = {
      q: query,
      query_by: "title,content",
      per_page: limit,
    };

    if (filterParts.length > 0) {
      searchParameters.filter_by = filterParts.join(" && ");
    }

    if (highlight) {
      searchParameters.highlight_full_fields = "title,content";
      searchParameters.highlight_affix_num_tokens = 8;
    }

    return await getClient().collections("wiki_pages").documents().search(searchParameters);
  } catch (error) {
    console.error("Error searching wiki pages:", error);
    return { hits: [], found: 0 };
  }
}

export async function searchFiles(
  query: string,
  filters?: SearchFilters,
  options: SearchOptions = {}
) {
  try {
    const { limit = 10, highlight = true } = options;
    const filterParts: string[] = [];

    if (filters?.workspaceId) filterParts.push(`workspaceId:=${filters.workspaceId}`);
    if (filters?.authorId) filterParts.push(`uploadedBy:=${filters.authorId}`);
    if (filters?.startDate) {
      filterParts.push(`createdAt:>=${filters.startDate.getTime()}`);
    }
    if (filters?.endDate) {
      filterParts.push(`createdAt:<=${filters.endDate.getTime()}`);
    }

    const searchParameters: any = {
      q: query,
      query_by: "name,content",
      per_page: limit,
    };

    if (filterParts.length > 0) {
      searchParameters.filter_by = filterParts.join(" && ");
    }

    if (highlight) {
      searchParameters.highlight_full_fields = "name,content";
      searchParameters.highlight_affix_num_tokens = 8;
    }

    return await getClient().collections("files").documents().search(searchParameters);
  } catch (error) {
    console.error("Error searching files:", error);
    return { hits: [], found: 0 };
  }
}

export async function searchUsers(query: string, options: SearchOptions = {}) {
  try {
    const { limit = 10, highlight = true } = options;

    const searchParameters: any = {
      q: query,
      query_by: "name,email",
      per_page: limit,
    };

    if (highlight) {
      searchParameters.highlight_full_fields = "name,email";
      searchParameters.highlight_affix_num_tokens = 8;
    }

    return await getClient().collections("users").documents().search(searchParameters);
  } catch (error) {
    console.error("Error searching users:", error);
    return { hits: [], found: 0 };
  }
}

export default getClient;
