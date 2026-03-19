const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const model = process.env.OLLAMA_MODEL || 'deepseek-coder:6.7b-instruct-q4_K_M';
const promptFile = path.join(__dirname, 'prompt.txt');
const outFile = path.join(__dirname, 'challenges.json');
const logsDir = path.join(__dirname, 'logs', 'ollama-generations');
const maxTokens = parseInt(process.env.OLLAMA_MAX_TOKENS || '4096');
const timeoutMs = parseInt(process.env.OLLAMA_TIMEOUT || '300000'); // 5 minutes
const useRedisCache = process.env.REDIS_CACHE === 'true';

let redisClient = null;

// Initialize Redis if enabled
async function initRedis() {
  if (!useRedisCache) return;
  try {
    const { createClient } = require('redis');
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      console.warn('REDIS_URL not set, skipping cache');
      return;
    }

    redisClient = createClient({
      url: redisUrl,
    });
    redisClient.on('error', (err) => console.warn('Redis cache error:', err.message));
    await redisClient.connect();
    console.log('✓ Redis cache connected (Upstash)');
  } catch (err) {
    console.warn('Redis not available, skipping cache:', err.message);
    redisClient = null;
  }
}

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

function hashPrompt(prompt) {
  return crypto.createHash('sha256').update(prompt).digest('hex');
}

function logGeneration(promptHash, result, duration, cached = false) {
  const timestamp = new Date().toISOString();
  const logFile = path.join(logsDir, `${timestamp.split('T')[0]}.log`);
  const logEntry = JSON.stringify({
    timestamp,
    promptHash,
    cached,
    durationMs: duration,
    outputBytes: Buffer.byteLength(result, 'utf8'),
    model,
    maxTokens,
  });
  fs.appendFileSync(logFile, logEntry + '\n');
}

async function getFromCache(promptHash) {
  if (!redisClient) return null;
  try {
    const cached = await redisClient.get(`ollama:${promptHash}`);
    return cached;
  } catch (err) {
    console.warn('Cache retrieval failed:', err.message);
    return null;
  }
}

async function saveToCache(promptHash, result) {
  if (!redisClient) return;
  try {
    // Cache for 7 days
    await redisClient.setEx(`ollama:${promptHash}`, 604800, result);
  } catch (err) {
    console.warn('Cache save failed:', err.message);
  }
}

async function runGeneration() {
  // Initialize Redis if enabled
  await initRedis();

  if (!fs.existsSync(promptFile)) {
    console.error('Missing prompt.txt in', __dirname);
    process.exit(2);
  }

  const prompt = fs.readFileSync(promptFile, 'utf8');
  const promptHash = hashPrompt(prompt);
  const startTime = Date.now();

  // Check cache
  if (useRedisCache) {
    const cached = await getFromCache(promptHash);
    if (cached) {
      console.log('✓ Cache hit! Using cached result');
      try {
        fs.writeFileSync(outFile, cached, 'utf8');
        logGeneration(promptHash, cached, Date.now() - startTime, true);
        console.log('Saved from cache:', outFile);
        process.exit(0);
      } catch (err) {
        console.error('Failed to write cached file:', err.message);
        process.exit(4);
      }
    }
  }

  console.log('Generating with Ollama (timeout: ' + (timeoutMs / 1000) + 's, max_tokens: ' + maxTokens + ')...');

  const proc = spawn('ollama', [
    'run',
    '--nowordwrap',
    model,
  ], {
    stdio: ['pipe', 'pipe', 'inherit'],
  });

  let stdout = '';
  let timedOut = false;

  // Set timeout
  const timeout = setTimeout(() => {
    timedOut = true;
    console.error('Timeout exceeded (' + (timeoutMs / 1000) + 's)');
    proc.kill();
  }, timeoutMs);

  proc.stdout.on('data', (chunk) => {
    stdout += chunk.toString();
  });

  proc.on('error', (err) => {
    clearTimeout(timeout);
    console.error('Failed to start ollama:', err.message);
    process.exit(3);
  });

  proc.on('close', (code) => {
    clearTimeout(timeout);

    if (timedOut) {
      console.error('Generation timed out');
      process.exit(5);
    }

    if (code !== 0) {
      console.error('ollama exited with code', code);
      process.exit(code);
    }

    try {
      // Save output
      fs.writeFileSync(outFile, stdout, 'utf8');
      const duration = Date.now() - startTime;
      logGeneration(promptHash, stdout, duration, false);

      // Save to cache
      if (useRedisCache) {
        saveToCache(promptHash, stdout).catch(err => {
          console.warn('Failed to cache result:', err.message);
        });
      }

      console.log('✓ Saved', outFile, '(', Buffer.byteLength(stdout, 'utf8'), 'bytes,', duration, 'ms )');
      process.exit(0);
    } catch (err) {
      console.error('Failed to write output file:', err.message);
      process.exit(4);
    }
  });

  // Send prompt with max_tokens parameter
  const wrappedPrompt = prompt + '\n\n[Max tokens: ' + maxTokens + ']';
  proc.stdin.write(wrappedPrompt);
  proc.stdin.end();
}

// Cleanup
async function cleanup() {
  if (redisClient) {
    await redisClient.disconnect();
  }
}

// Run
runGeneration()
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  })
  .finally(cleanup);
