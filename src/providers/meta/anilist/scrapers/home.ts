import {
  descriptionOf,
  fetchAniZip,
  formatAiringInfo,
  formatSeason,
  formatStatus,
  getSeason,
  presentMedia,
  queryAniList,
} from "../lib/helpers";
import { HOME_QUERY } from "../lib/queries";
import { remapManager } from "../../../../core/remapManager";

const SPOTLIGHT_SIZE = 10;

export async function scrapeHome() {
  await remapManager.ensureLoaded();
  const data = await queryAniList(HOME_QUERY, {
    season: getSeason(),
    seasonYear: new Date().getFullYear(),
  });

  const candidates: any[] = data.spotlight?.media ?? [];
  const featured = [
    ...candidates.filter((media) => media.bannerImage),
    ...candidates.filter((media) => !media.bannerImage),
  ].slice(0, SPOTLIGHT_SIZE);
  const aniZip = await Promise.all(featured.map((media) => fetchAniZip(media.id)));

  const spotlight = featured.map((media, index) => {
    const remap = remapManager.getRemap(media.id);
    const { timeLeft, episodeCount } = formatAiringInfo(media);
    return {
      id: media.id,
      ...presentMedia(media, aniZip[index], remap),
      description: descriptionOf(media, remap),
      season: formatSeason(media),
      episode: episodeCount,
      timeLeft,
      status: formatStatus(media.status),
      type: media.format || "TV",
    };
  });

  const listItems = (page: any) =>
    (page?.media ?? []).map((media: any) => {
      const remap = remapManager.getRemap(media.id);
      return {
        id: media.id,
        ...presentMedia(media, undefined, remap),
        type: media.format || "TV",
        episodes: media.episodes,
        status: formatStatus(media.status),
      };
    });

  return {
    spotlight,
    "recently-added": listItems(data.trending),
    "popular-anime": listItems(data.popular),
    "popular-movies": listItems(data.movies),
    "seasonal-anime": listItems(data.seasonal),
    "anime-of-all-time": listItems(data.allTime),
    "coming-soon": listItems(data.comingSoon),
  };
}
