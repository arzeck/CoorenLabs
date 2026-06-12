import { ANILIST_URL, SEARCH_QUERY } from "../lib/queries";
import { fetchWithRetry, formatStatus } from "../lib/helpers";
import { remapManager } from "../../../../core/remapManager";

/**
 * Search anime titles via AniList.
 * Ported from anime-stream-link/server.js → GET /search/:query
 */
export async function scrapeSearch(
  query: string,
  page: number = 1,
  perPage: number = 20,
) {
  const response = await fetchWithRetry(ANILIST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      query: SEARCH_QUERY,
      variables: { search: query, page, perPage },
    }),
  });

  const data = await response.json();

  if (data.errors) {
    throw new Error(data.errors[0]?.message || "AniList search error");
  }

  const pageData = data.data?.Page;

  const results = (pageData?.media || []).map((media: any) => {
    const remap = remapManager.getRemap(media.id);
    return {
      id: media.id,
      title: remap?.name || media.title.english || media.title.romaji || "",
      poster: remap?.poster_img || media.coverImage?.extraLarge || "",
      banner: remap?.banner || remap?.banner_image || media.bannerImage || media.coverImage?.extraLarge || "",
      logo: remap?.logo || remap?.clear_logo || "",
      format: media.format || "TV",
      status: formatStatus(media.status),
      episodes: media.episodes,
      averageScore: media.averageScore,
      season: media.season,
      seasonYear: media.seasonYear,
      color: media.coverImage?.color || "",
    };
  });

  return {
    pageInfo: pageData?.pageInfo,
    results,
  };
}
