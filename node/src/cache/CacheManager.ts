import fs from 'fs';
import path from 'path';

const CACHE_FILE = 'pagepilot-cache.json';

export class CacheManager {
    private cachePath: string;
    private cache: Record<string, string>;

    constructor() {
        this.cachePath = path.resolve(process.cwd(), CACHE_FILE);
        this.cache = this.loadCache();
    }

    private loadCache(): Record<string, string> {
        try {
            if (fs.existsSync(this.cachePath)) {
                const data = fs.readFileSync(this.cachePath, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.warn('Failed to load PagePilot cache:', error);
        }
        return {};
    }

    get(goal: string): string | undefined {
        return this.cache[goal];
    }

    set(goal: string, selector: string): void {
        this.cache[goal] = selector;
        this.saveCache();
    }

    private saveCache(): void {
        try {
            fs.writeFileSync(this.cachePath, JSON.stringify(this.cache, null, 2));
        } catch (error) {
            console.warn('Failed to save PagePilot cache:', error);
        }
    }
}
