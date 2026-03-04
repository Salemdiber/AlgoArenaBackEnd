import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly logsDir = path.join(process.cwd(), 'logs', 'ai-generations');
  private readonly timeoutMs = parseInt(process.env.AI_TIMEOUT || '300000'); // 5 minutes
  private readonly maxTokens = parseInt(process.env.AI_MAX_TOKENS || '4096');

  constructor(private cacheService: CacheService) {
    // Ensure logs directory exists
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  private hashPrompt(prompt: string): string {
    return crypto.createHash('sha256').update(prompt).digest('hex');
  }

  private logGeneration(
    promptHash: string,
    result: string,
    duration: number,
    cached: boolean,
    source: string,
  ): void {
    const timestamp = new Date().toISOString();
    const logFile = path.join(this.logsDir, `${timestamp.split('T')[0]}.log`);
    const logEntry = JSON.stringify({
      timestamp,
      promptHash,
      cached,
      durationMs: duration,
      outputBytes: Buffer.byteLength(result, 'utf8'),
      source,
      maxTokens: this.maxTokens,
    });
    try {
      fs.appendFileSync(logFile, logEntry + '\n');
    } catch (err) {
      this.logger.warn(`Failed to log generation: ${err.message}`);
    }
  }

  /**
   * Generate content using Ollama (with caching and logging)
   * @param prompt The prompt to send to Ollama
   * @param cacheKey Optional custom cache key (uses prompt hash by default)
   * @param cacheTTLSeconds Cache TTL in seconds (default: 7 days)
   * @returns Generated content
   */
  async generateWithOllama(
    prompt: string,
    cacheKey?: string,
    cacheTTLSeconds: number = 604800,
  ): Promise<string> {
    const promptHash = cacheKey || this.hashPrompt(prompt);
    const startTime = Date.now();

    // Check cache
    const cached = await this.cacheService.get(`ai:ollama:${promptHash}`);
    if (cached) {
      this.logger.log(`Cache hit for prompt: ${promptHash}`);
      this.logGeneration(promptHash, cached, Date.now() - startTime, true, 'ollama');
      return cached;
    }

    this.logger.log(`Generating with Ollama (timeout: ${this.timeoutMs / 1000}s)...`);

    try {
      // Call run_ollama.js script
      const { stdout, stderr } = await execAsync(
        `node run_ollama.js`,
        {
          cwd: process.cwd(),
          timeout: this.timeoutMs,
          env: {
            ...process.env,
            OLLAMA_MAX_TOKENS: this.maxTokens.toString(),
            OLLAMA_TIMEOUT: this.timeoutMs.toString(),
          },
        },
      );

      if (stderr) {
        this.logger.warn(`Ollama stderr: ${stderr}`);
      }

      // Read the generated file
      const outFile = path.join(process.cwd(), 'challenges.json');
      const result = fs.readFileSync(outFile, 'utf8');

      const duration = Date.now() - startTime;
      this.logGeneration(promptHash, result, duration, false, 'ollama');

      // Save to cache
      await this.cacheService.set(`ai:ollama:${promptHash}`, result, cacheTTLSeconds).catch(
        (err) => {
          this.logger.warn(`Failed to cache result: ${err.message}`);
        },
      );

      this.logger.log(
        `Ollama generation completed (${Buffer.byteLength(result, 'utf8')} bytes, ${duration}ms)`,
      );
      return result;
    } catch (err) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Ollama generation failed after ${duration}ms: ${err.message}`,
      );
      this.logGeneration(promptHash, `ERROR: ${err.message}`, duration, false, 'ollama');
      throw new Error(`AI generation failed: ${err.message}`);
    }
  }

  /**
   * Clear cache for a specific prompt
   */
  async clearPromptCache(cacheKey: string): Promise<void> {
    await this.cacheService.delete(`ai:ollama:${cacheKey}`);
    this.logger.log(`Cleared cache for: ${cacheKey}`);
  }

  /**
   * Clear all AI cache
   */
  async clearAllCache(): Promise<void> {
    this.logger.log('Clear all cache not yet implemented for Redis');
    // TODO: Implement batch delete for all ai:* keys
  }
}
