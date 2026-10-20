import { formatStatus, presentMedia, queryAniList } from "../lib/helpers";
import { SEARCH_QUERY } from "../lib/queries";
import { remapManager } from "../../../../core/remapManager";

export async function scrapeSearch(query: string, page = 1, perPage = 20) {
  await remapManager.ensureLoaded();
  const { Page } = await queryAniList(SEARCH_QUERY, { search: query, page, perPage });
  return {
    pageInfo: Page?.pageInfo,
    results: (Page?.media ?? []).map((media: any) => {
      const remap = remapManager.getRemap(media.id);
      return {
        id: media.id,
        ...presentMedia(media, undefined, remap),
        format: media.format || "TV",
        status: formatStatus(media.status),
        episodes: media.episodes,
        averageScore: media.averageScore,
        season: media.season,
        seasonYear: media.seasonYear,
        color: media.coverImage?.color || "",
      };
    }),
  };
}
