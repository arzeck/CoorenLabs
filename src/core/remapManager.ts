import { neon } from "@neondatabase/serverless";
import { DATABASE_URL, REMAP_REFRESH_INTERVAL } from "./config";
import { Logger } from "./logger";

export type RemapRow = {
  anilist_id: number | string;
  name?: string | null;
  logo?: string | null;
  banner?: string | null;
  description?: string | null;
  poster?: string | null;
  poster_img?: string | null;
  banner_image?: string | null;
  clear_logo?: string | null;
  animelok_id?: string | number | null;
  [key: string]: any;
};

class RemapManager {
  private remaps = new Map<number, RemapRow>();
  private readonly sql = DATABASE_URL ? neon(DATABASE_URL) : null;
  private initPromise: Promise<void> | null = null;
  private interval: any = null;

  async init(): Promise<void> {
    if (!this.sql) {
      Logger.warn("[RemapManager] DATABASE_URL is not set; remapping is disabled");
      return;
    }
    if (!this.initPromise) {
      this.initPromise = this.load();
      if (!this.interval && REMAP_REFRESH_INTERVAL > 0) {
        this.interval = setInterval(() => void this.load(), REMAP_REFRESH_INTERVAL);
        this.interval?.unref?.();
      }
    }
    await this.initPromise;
  }

  async ensureLoaded(): Promise<void> {
    if (!this.sql) return;
    if (!this.initPromise) {
      await this.init();
    } else {
      await this.initPromise;
    }
  }

  private async load(): Promise<void> {
    if (!this.sql) return;
    try {
      const rows = (await this.sql`SELECT * FROM remaps`) as RemapRow[];
      this.remaps = new Map(rows.map((row) => [Number(row.anilist_id), row]));
      Logger.info(`[RemapManager] Loaded ${this.remaps.size} remaps from database`);
    } catch (err) {
      Logger.error(`[RemapManager] Failed to load remaps: ${String(err)}`);
    }
  }

  getRemap(anilistId: number | string | undefined | null): RemapRow | undefined {
    if (anilistId == null) return undefined;
    return this.remaps.get(Number(anilistId));
  }
}

export const remapManager = new RemapManager();
