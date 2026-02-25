import { vi } from "vitest";

const findMany = vi.fn();
const count = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    post: {
      findMany,
      count
    }
  }
}));

describe("getPosts", () => {
  beforeEach(() => {
    findMany.mockReset();
    count.mockReset();
  });

  it("returns paginated published posts", async () => {
    const { getPosts } = await import("@/features/blog/server/queries");
    findMany.mockResolvedValue([
      {
        id: "p1",
        title: "Hello",
        slug: "hello",
        summary: "summary",
        content: "content",
        status: "PUBLISHED",
        coverImage: null,
        tags: [],
        readingTime: 1,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        toc: []
      }
    ]);
    count.mockResolvedValue(1);

    const result = await getPosts({ page: 1, pageSize: 10 });

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(findMany).toHaveBeenCalled();
  });
});
