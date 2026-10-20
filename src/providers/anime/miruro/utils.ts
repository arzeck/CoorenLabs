import { gunzipSync } from "node:zlib";
import { remapManager } from "../../../core/remapManager";

export function applyRemapsToMedia(media: any): any {
  if (!media || !media.id) return media;
  const remap = remapManager.getRemap(media.id);
  if (!remap) return media;

  if (media.title) {
    if (remap.name) {
      media.title.english = remap.name;
    }
  }

  if (media.coverImage) {
    const poster = remap.poster_img || remap.poster;
    if (poster) {
      media.coverImage.extraLarge = poster;
      media.coverImage.large = poster;
    }
  }

  const banner = remap.banner || remap.banner_image;
  if (banner) {
    media.bannerImage = banner;
  }

  if (remap.description) {
    media.description = remap.description;
  }

  const logo = remap.logo || remap.clear_logo;
  if (logo) {
    media.logo = logo;
  }

  return media;
}

const CATALOG_KEY = new TextEncoder().encode("miruro/catalog");

export const MEDIA_LIST_FIELDS = `
    id
    title { romaji english native }
    coverImage { large extraLarge }
    bannerImage
    format
    season
    seasonYear
    episodes
    duration
    status
    averageScore
    meanScore
    popularity
    favourites
    genres
    source
    countryOfOrigin
    isAdult
    studios(isMain: true) { nodes { name isAnimationStudio } }
    nextAiringEpisode { episode airingAt timeUntilAiring }
    startDate { year month day }
    endDate { year month day }
`;

export const MEDIA_FULL_FIELDS = `
    id
    idMal
    title { romaji english native }
    description(asHtml: false)
    coverImage { large extraLarge color }
    bannerImage
    format
    season
    seasonYear
    episodes
    duration
    status
    averageScore
    meanScore
    popularity
    favourites
    trending
    genres
    tags { name rank isMediaSpoiler }
    source
    countryOfOrigin
    isAdult
    hashtag
    synonyms
    siteUrl
    trailer { id site thumbnail }
    studios { nodes { id name isAnimationStudio siteUrl } }
    nextAiringEpisode { episode airingAt timeUntilAiring }
    startDate { year month day }
    endDate { year month day }
    characters(sort: [ROLE, RELEVANCE], perPage: 25) {
        edges {
            role
            node { id name { full native } image { large } }
            voiceActors(language: JAPANESE) { id name { full native } image { large } languageV2 }
        }
    }
    staff(sort: RELEVANCE, perPage: 25) {
        edges {
            role
            node { id name { full native } image { large } }
        }
    }
    relations {
        edges {
            relationType(version: 2)
            node {
                id
                title { romaji english native }
                coverImage { large }
                format
                type
                status
                episodes
                meanScore
            }
        }
    }
    recommendations(sort: RATING_DESC, perPage: 10) {
        nodes {
            rating
            mediaRecommendation {
                id
                title { romaji english native }
                coverImage { large }
                format
                episodes
                status
                meanScore
                averageScore
            }
        }
    }
    externalLinks { url site type }
    streamingEpisodes { title thumbnail url site }
    stats {
        scoreDistribution { score amount }
        statusDistribution { status amount }
    }
`;

export function decodeCatalog(contentType: string | null, body: Uint8Array): any {
  if (!contentType?.startsWith("application/octet-stream")) {
    return JSON.parse(new TextDecoder().decode(body));
  }
  for (let i = 0; i < body.length; i++) body[i] ^= CATALOG_KEY[i % CATALOG_KEY.length];
  return JSON.parse(gunzipSync(body).toString("utf8"));
}
