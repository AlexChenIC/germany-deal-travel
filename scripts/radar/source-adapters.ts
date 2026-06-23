import type { SourceDefinition, TravelItem } from "../../src/types";

export interface SourceAdapter {
  id: string;
  label: string;
  canHandle: (source: SourceDefinition) => boolean;
  fetchItems: (source: SourceDefinition) => Promise<TravelItem[]>;
}

export interface SourceAdapterContext {
  fetchRssItems: (source: SourceDefinition) => Promise<TravelItem[]>;
  fetchVisitBerlinEvents: (source: SourceDefinition) => Promise<TravelItem[]>;
}

export function createSourceAdapters(context: SourceAdapterContext): SourceAdapter[] {
  return [
    {
      id: "rss-feed",
      label: "RSS feed adapter",
      canHandle: (source) => source.kind === "rss" && Boolean(source.url),
      fetchItems: context.fetchRssItems,
    },
    {
      id: "visitberlin-events",
      label: "visitBerlin events adapter",
      canHandle: (source) => source.id === "visitberlin-events",
      fetchItems: context.fetchVisitBerlinEvents,
    },
  ];
}

export async function fetchItemsWithAdapters(
  source: SourceDefinition,
  adapters: SourceAdapter[],
): Promise<TravelItem[]> {
  const adapter = adapters.find((candidate) => candidate.canHandle(source));
  if (!adapter) return [];
  return adapter.fetchItems(source);
}
