# Troubleshooting Guide

Solutions to common issues when developing and deploying DevOps RAG Agent.

---

## Development Issues

### 🔴 "VITE_API_KEY is not set" Error

**Symptoms:**
```
Error: API Key not found in environment. 
For local dev, set VITE_API_KEY in .env
```

**Root Causes:**
- `.env.local` file doesn't exist
- API key is empty or malformed
- Vite cache is stale

**Solutions:**

1. **Create `.env.local` file:**
   ```bash
   # Verify file exists
   ls -la .env.local  # macOS/Linux
   dir .env.local     # Windows
   
   # If not, create it
   echo "VITE_API_KEY=sk-..." > .env.local
   ```

2. **Verify API key format:**
   ```bash
   # Should start with 'sk-' or be a valid Google API key
   cat .env.local
   # Output: VITE_API_KEY=sk-1a2b3c4d5e6f...
   ```

3. **Get a valid API key:**
   - Visit [Google AI Studio](https://ai.google.dev/)
   - Click "Get API Key"
   - Copy the key and update `.env.local`

4. **Clear Vite cache:**
   ```bash
   rm -rf .vite dist node_modules/.vite
   npm run dev
   ```

5. **Check environment detection:**
   - Open browser DevTools (F12)
   - Console tab
   - Look for:
     ```javascript
     // If you see this, environment is correct
     typeof process !== 'undefined'     // true in Node.js
     typeof import.meta !== 'undefined' // true in browser
     ```

---

### 🔴 "Cannot find module '@google/genai'"

**Symptoms:**
```
Module not found: Error: Can't resolve '@google/genai'
```

**Root Cause:** Dependencies not installed

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Verify installation
npm list @google/genai
# Should show version like: @google/genai@1.30.0
```

---

### 🔴 TypeScript Compilation Errors

**Symptoms:**
```
src/services/gemini.ts:5:10 - error TS7016: 
Could not find a declaration file for module '@google/genai'
```

**Root Causes:**
- Missing type definitions
- tsconfig.json misconfigured
- TypeScript version mismatch

**Solutions:**

1. **Update TypeScript:**
   ```bash
   npm install -D typescript@latest
   npx tsc --version  # Should be 5.0+
   ```

2. **Check tsconfig.json:**
   ```json
   {
     "compilerOptions": {
       "esModuleInterop": true,
       "moduleResolution": "node"
     }
   }
   ```

3. **Add type checking skip (temporary):**
   ```bash
   npm run build -- --skipLibCheck
   ```

---

### 🔴 "Cannot read property 'endsWith' of undefined"

**Symptoms:**
```
[vite] Internal server error: Cannot read properties of undefined (reading 'endsWith')
  Plugin: vite:oxc
  File: src/main.tsx
```

**Root Cause:** Malformed `tsconfig.json` with invalid project references

**Solution:**
Check `tsconfig.json`:
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
    // ❌ Remove any entries without "path" property
  ]
}
```

---

### 🔴 Dev Server Won't Start (Port Already in Use)

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::5173
```

**Root Cause:** Another process is using port 5173

**Solutions:**

**Option 1: Kill the process**
```bash
# Find process using port 5173
lsof -i :5173          # macOS/Linux
netstat -ano | grep 5173  # Windows

# Kill it
kill <PID>             # macOS/Linux
taskkill /PID <PID>    # Windows
```

**Option 2: Use different port**
```bash
npm run dev -- --port 5174
```

**Option 3: Wait for port to be released**
```bash
# Restart computer or wait a few minutes
```

---

### 🔴 "Unexpected token < in JSON"

**Symptoms:**
```
SyntaxError: Unexpected token < in JSON at position 0
```

**Root Cause:** Browser is loading HTML instead of JSON (CORS or wrong endpoint)

**Solution:**
```typescript
// Check API URL is correct in .env.local
VITE_API_URL=http://localhost:5173  // ❌ Wrong (this is frontend)
VITE_API_URL=http://localhost:5000  // ✅ Correct (backend)
```

---

## Runtime Issues

### 🔴 "API Call Fails" / "Network Error"

**Symptoms:**
```
Error: Failed to fetch
Error: TypeError: fetch failed
```

**Root Causes:**
- Network disconnected
- API quota exceeded
- API key invalid
- CORS blocked

**Solutions:**

1. **Check network connection:**
   ```bash
   ping google.com  # Test internet
   curl https://ai.google.dev  # Test Google access
   ```

2. **Check API quota:**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Check "Quotas" for "Generative Language API"
   - Verify you're not rate-limited (60 requests/minute free tier)

3. **Verify API key:**
   ```bash
   # Check key format
   echo $VITE_API_KEY  # Should be non-empty
   ```

4. **Check CORS headers (if running with backend):**
   ```typescript
   // server.ts
   import cors from 'cors';
   
   app.use(cors({
     origin: 'http://localhost:5173',  // Your frontend URL
     credentials: true
   }));
   ```

5. **Add retry logic:**
   ```typescript
   async function retryWithBackoff(fn, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await fn();
       } catch (error) {
         if (i === maxRetries - 1) throw error;
         const delay = Math.pow(2, i) * 1000;
         await new Promise(r => setTimeout(r, delay));
       }
     }
   }
   ```

---

### 🔴 "Solution Takes Too Long" (>10 seconds)

**Symptoms:**
- UI freezes for 10+ seconds
- User sees spinner indefinitely
- No solution appears

**Root Causes:**
- API latency (network slow, API overloaded)
- Large document context (100+ chunks)
- Model is slow

**Solutions:**

1. **Check network speed:**
   ```bash
   # Test API latency
   time curl https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent
   ```

2. **Reduce context size:**
   ```typescript
   // In App.tsx
   const topK = 2;  // Fewer documents = faster
   ```

3. **Switch to faster model:**
   ```typescript
   // In src/services/gemini.ts
   const model = "gemini-1.5-flash-8b";  // Faster than flash
   ```

4. **Add timeout:**
   ```typescript
   const timeoutPromise = new Promise((_, reject) =>
     setTimeout(() => reject(new Error('Timeout')), 5000)
   );
   
   const result = await Promise.race([
     generateRAGSolution(query, chunks),
     timeoutPromise
   ]);
   ```

---

### 🔴 "Solution is Hallucinating" (Wrong Citations)

**Symptoms:**
- Solution cites documents that don't contain the info
- Answer is completely off-topic
- [Source ID: doc-X] doesn't match actual content

**Root Causes:**
- Search returned wrong documents
- LLM prompt is weak
- Documents are too vague

**Solutions:**

1. **Improve search quality:**
   - Replace keyword search with vector embeddings
   - Add more descriptive document titles
   - Use more specific query terms

2. **Strengthen prompt:**
   ```typescript
   // In generateRAGSolution()
   const prompt = `
     You are an expert DevOps engineer.
     Answer ONLY based on the provided context.
     If you don't know, say "I don't have this information."
     ALWAYS cite sources.
     Never invent information.
   `;
   ```

3. **Validate citations:**
   ```typescript
   // Add validation before showing to user
   const validateSolution = (solution: string, chunks: DocumentChunk[]) => {
     const citations = solution.match(/\[Source ID: (\w+)\]/g) || [];
     const validSources = chunks.map(c => c.sourceId);
     
     citations.forEach(citation => {
       const sourceId = citation.match(/\w+/)[0];
       if (!validSources.includes(sourceId)) {
         console.warn(`Invalid citation: ${citation}`);
       }
     });
   };
   ```

---

## Deployment Issues

### 🔴 Docker Build Fails

**Symptoms:**
```
docker build -t rag-app .
ERROR: failed to solve with frontend dockerfile.v0
```

**Root Cause:** Missing Dockerfile or incorrect syntax

**Solution:**

1. **Verify Dockerfile exists:**
   ```bash
   ls -la Dockerfile
   ```

2. **Check syntax:**
   ```bash
   docker build --progress=plain -t rag-app .  # See detailed errors
   ```

3. **Rebuild with cache disabled:**
   ```bash
   docker build --no-cache -t rag-app .
   ```

4. **Check Docker version:**
   ```bash
   docker --version  # Should be 20+
   docker ps        # Test Docker is running
   ```

---

### 🔴 Docker Container Won't Start

**Symptoms:**
```
docker run -p 3000:3000 rag-app
/bin/sh: npm: not found
```

**Root Causes:**
- Dependencies not installed in image
- Wrong base image
- Missing RUN commands

**Solutions:**

1. **Check Dockerfile:**
   ```dockerfile
   FROM node:20-alpine  # ✅ Correct (includes npm)
   FROM alpine:latest   # ❌ Wrong (doesn't include npm)
   
   RUN npm install      # ✅ Install dependencies
   RUN npm run build    # ✅ Build for production
   ```

2. **View Docker logs:**
   ```bash
   docker run rag-app
   # See exact error message
   ```

3. **Build with verbose output:**
   ```bash
   docker build -t rag-app . --progress=plain
   ```

---

### 🔴 Deployed App Shows Blank Page

**Symptoms:**
- URL loads, but page is blank
- No errors in browser console
- White screen

**Root Causes:**
- Wrong build output
- API key not set in production
- CORS error (silent fail)

**Solutions:**

1. **Check build output:**
   ```bash
   npm run build
   ls -la dist/
   # Should have index.html, main.js, etc.
   ```

2. **Verify HTML loads:**
   ```bash
   curl http://localhost:3000 | head -20
   # Should see HTML content
   ```

3. **Check browser console:**
   - Open DevTools (F12)
   - Console tab
   - Look for red errors

4. **Set API key in production:**
   ```bash
   # Docker
   docker run -e VITE_API_KEY=sk-... rag-app
   
   # Kubernetes
   kubectl set env deployment/rag-app VITE_API_KEY=sk-...
   
   # Vercel
   vercel env add VITE_API_KEY sk-...
   ```

---

### 🔴 "Too Many Requests" / Rate Limit

**Symptoms:**
```
Error: Rate limit exceeded
Error: 429 Too Many Requests
```

**Root Causes:**
- Free tier quota exhausted (60 requests/minute)
- Testing with multiple concurrent users
- Requests not being cancelled properly

**Solutions:**

1. **Check free tier limits:**
   - Gemini free: 60 req/min
   - Upgrade to paid for higher limits

2. **Add rate limiting client-side:**
   ```typescript
   let lastRequestTime = 0;
   const MIN_REQUEST_INTERVAL = 2000;  // 2 seconds between requests
   
   async function throttledGenerate(query: string, chunks: DocumentChunk[]) {
     const now = Date.now();
     const timeToWait = MIN_REQUEST_INTERVAL - (now - lastRequestTime);
     
     if (timeToWait > 0) {
       await new Promise(r => setTimeout(r, timeToWait));
     }
     
     lastRequestTime = Date.now();
     return await generateRAGSolution(query, chunks);
   }
   ```

3. **Upgrade to paid API:**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Enable billing
   - Request higher quotas

---

### 🔴 "Connection Refused" / Port Not Accessible

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```

**Root Causes:**
- Container not running
- Port not exposed
- Firewall blocking

**Solutions:**

1. **Check container is running:**
   ```bash
   docker ps
   # Should see your rag-app container
   ```

2. **Check port is exposed:**
   ```bash
   docker run -p 3000:3000 rag-app  # Must have -p flag
   ```

3. **Check firewall:**
   ```bash
   # macOS
   sudo lsof -i :3000
   
   # Linux
   sudo netstat -tulnp | grep 3000
   
   # Windows
   netstat -ano | findstr :3000
   ```

4. **Try localhost vs 0.0.0.0:**
   ```bash
   curl http://localhost:3000    # Local
   curl http://127.0.0.1:3000    # Local
   curl http://your-ip:3000      # Remote
   ```

---

## Performance Issues

### 🔴 "App is Slow" / Takes Long to Load

**Symptoms:**
- First load takes >5 seconds
- Page freezes during interaction

**Root Causes:**
- Large bundle size
- Inefficient rendering
- Network latency
- LLM API is slow

**Solutions:**

1. **Check bundle size:**
   ```bash
   npm run build
   # Look at dist/ folder size
   # Target: <300KB gzipped
   ```

2. **Enable code splitting:**
   ```typescript
   // vite.config.ts
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'
   
   export default defineConfig({
     plugins: [react()],
     build: {
       rollupOptions: {
         output: {
           manualChunks: {
             'react-lib': ['react', 'react-dom'],
             'gemini-lib': ['@google/genai']
           }
         }
       }
     }
   })
   ```

3. **Lazy load components:**
   ```typescript
   import { lazy, Suspense } from 'react';
   
   const AnalysisDisplay = lazy(() => 
     import('./components/AnalysisDisplay')
   );
   
   // Use with Suspense
   <Suspense fallback={<div>Loading...</div>}>
     <AnalysisDisplay />
   </Suspense>
   ```

4. **Add CDN:**
   ```bash
   # Vercel auto-adds CDN
   vercel deploy
   
   # Or use CloudFlare
   # Point domain to CloudFlare nameservers
   ```

---

## Monitoring & Logging

### Enable Debug Logging

```bash
# Development
DEBUG=rag-agent:* npm run dev

# Production
export DEBUG=rag-agent:*
npm start
```

### Add Structured Logging

```typescript
// utils/logger.ts
const log = (level: 'info' | 'warn' | 'error', message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(JSON.stringify({
    timestamp,
    level,
    message,
    data
  }));
};

export { log };

// Usage
log('info', 'Pipeline started', { docCount: 5 });
log('error', 'API call failed', { error: err.message });
```

### Monitor Performance

```typescript
// Measure LLM latency
const startTime = Date.now();
const result = await cleanLogToQuery(rawLog);
const latency = Date.now() - startTime;

console.log(`LLM latency: ${latency}ms`);

// Track in analytics
if (typeof window !== 'undefined' && window.gtag) {
  window.gtag('event', 'llm_call', {
    latency,
    model: 'gemini-2.5-flash',
    success: true
  });
}
```

---

## Getting Help

Can't find your issue here?

1. **Search [GitHub Issues](https://github.com/shermin23/DevOps-RAG-Agent/issues)**
2. **Check [GitHub Discussions](https://github.com/shermin23/DevOps-RAG-Agent/discussions)**
3. **Read [Official Docs](../README.md)**
4. **Email:** support@example.com

---

## Report a Bug

When reporting issues, include:

1. **Error message** (exact text)
2. **Steps to reproduce**
3. **Environment:**
   ```bash
   node --version
   npm --version
   # Paste output
   ```
4. **Stack trace** (if available)
5. **Screenshots** (if UI-related)

Example:
```markdown
### Title: API key not found error on startup

**Steps to reproduce:**
1. Clone repo
2. Run `npm install`
3. Run `npm run dev`

**Expected:** Dev server starts on port 5173
**Actual:** Error: API Key not found

**Environment:**
- Node: v20.9.0
- npm: 10.1.0
- OS: macOS 14.1

**Error message:**
```
Error: API Key not found in environment
```

**Config:**
- Created `.env.local` with `VITE_API_KEY=sk-...`
```

This helps maintainers fix issues faster!
