# Quick Start Guide

## For Users (Non-Technical)

### Setup (First Time)
1. **Get the app running**
   ```bash
   # Ask your DevOps team to deploy, or run locally:
   docker-compose up
   ```
   Open http://localhost:3000

2. **Add your documentation**
   - Click the **Knowledge Base** panel on the left
   - Click **+** button
   - Paste your DevOps documentation (any text format: runbooks, guides, configs)
   - Click **Ingest & Index**

3. **Upload an error log**
   - Paste your error log in the **middle textarea**
   - Click **Start RAG Pipeline**
   - Wait 6-8 seconds for AI analysis
   - View the solution with citations on the right

### Tips
- ✅ Works best with structured documentation (guides, runbooks)
- ✅ Error logs don't need to be cleaned—the AI handles noise
- ✅ All solutions are cited—you can verify sources
- ❌ First upload might be slow (API warm-up)
- ❌ Docs stay in browser memory (refresh = reset)

---

## For Developers (Technical Setup)

### Prerequisites
```bash
node --version  # Should be 18+
npm --version   # Should be 9+
```

If not installed, download from [nodejs.org](https://nodejs.org/)

### Step 1: Clone Repository
```bash
git clone https://github.com/shermin23/DevOps-RAG-Agent.git
cd DevOps-RAG-Agent
```

### Step 2: Install Dependencies
```bash
npm install
```

**What gets installed:**
- React, TypeScript, Vite (dev tools)
- Google GenAI SDK (LLM access)
- Tailwind CSS (styling)
- Lucide React (icons)

### Step 3: Get Google API Key

**Free Option (Recommended for Dev):**
1. Go to [Google AI Studio](https://ai.google.dev/)
2. Click **"Get API Key"**
3. Click **"Create API key in new project"**
4. Copy the key

**Paid Option (For Production):**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project
3. Enable the **Generative Language API**
4. Create a **service account** with appropriate permissions
5. Use service account key for server-side code

### Step 4: Configure Environment
```bash
# Create .env.local file
echo "VITE_API_KEY=your_key_here" > .env.local
```

Replace `your_key_here` with the key from Step 3.

### Step 5: Run Development Server
```bash
npm run dev
```

Output:
```
  VITE v7.2.5  ready in 200 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

Open http://localhost:5173 in your browser.

### Step 6: Start Coding
- Edit files in `src/`
- Changes auto-reload (HMR)
- Check console for TypeScript errors

---

## Common Development Tasks

### Add a New Component
```tsx
// src/components/MyComponent.tsx
import React from 'react';

interface MyComponentProps {
  title: string;
}

const MyComponent: React.FC<MyComponentProps> = ({ title }) => {
  return <div className="p-4">{title}</div>;
};

export default MyComponent;
```

Then import in `App.tsx`:
```tsx
import MyComponent from './components/MyComponent';

// Use in JSX
<MyComponent title="Hello" />
```

### Modify LLM Behavior
Edit `src/services/gemini.ts`:

```typescript
// Change model
const model = "gemini-1.5-pro";  // Slower but more capable

// Change prompt
const prompt = `
  You are a Kubernetes expert.
  Fix the user's K8s issue.
  Be concise.
`;
```

### Improve Search Accuracy
Edit `src/utils/search.ts`:

```typescript
// Make search stricter (fewer, higher-quality results)
const topK = 2;  // Was 3

// Or improve scoring algorithm
const score = queryTerms.filter(term => 
  contentLower.includes(term)
).length * 2;  // Weight higher
```

---

## Build for Production

### Build Static Files
```bash
npm run build
```

Generates optimized `dist/` folder (~200KB gzipped).

### Preview Build Locally
```bash
npm run preview
```

Serves the production build on http://localhost:4173

### Type Check
```bash
npm run lint
```

Verifies TypeScript types—run before committing.

---

## Deploy (Choose One)

### Option 1: Vercel (Easiest)
```bash
npm install -g vercel
vercel --env VITE_API_KEY=your_key
```

Automatic deployments on `git push`.

### Option 2: Docker
```bash
# Build image
docker build -t rag-app .

# Run locally
docker run -e VITE_API_KEY=your_key -p 3000:3000 rag-app

# Deploy to registry
docker push your-registry/rag-app:latest
```

### Option 3: AWS EC2
```bash
# SSH into instance
ssh -i key.pem ec2-user@your-ip

# Clone & setup
git clone https://github.com/shermin23/DevOps-RAG-Agent.git
cd DevOps-RAG-Agent

# Install & build
npm install
npm run build

# Start server
npx serve -s dist -l 3000 &

# Access on http://your-ip:3000
```

### Option 4: GitHub Pages
```bash
# Add to package.json
"homepage": "https://yourusername.github.io/DevOps-RAG-Agent"

# Build & deploy
npm run build
npx gh-pages -d dist
```

---

## Troubleshooting

### "VITE_API_KEY is not set"
```bash
# Check .env.local exists
cat .env.local

# Should show: VITE_API_KEY=sk-...

# If not, create it:
echo "VITE_API_KEY=your_key" > .env.local
```

### Dev server won't start
```bash
# Kill existing process
ps aux | grep vite
kill <PID>

# Try again
npm run dev
```

### "Cannot find module" error
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Build fails with TypeScript errors
```bash
# Check errors
npm run lint

# Fix by running
npm run build -- --watch
```

---

## Learn More

- **[Full Documentation](../README.md)** - Features, architecture, deployment
- **[Architecture Guide](./ARCHITECTURE.md)** - How RAG pipeline works
- **[API Reference](./API.md)** - Service layer details
- **[Performance Tuning](./PERFORMANCE.md)** - Optimize for scale

---

## Get Help

- 💬 Check [GitHub Discussions](https://github.com/shermin23/DevOps-RAG-Agent/discussions)
- 🐛 Report bugs: [GitHub Issues](https://github.com/shermin23/DevOps-RAG-Agent/issues)
- 📧 Email: support@example.com
