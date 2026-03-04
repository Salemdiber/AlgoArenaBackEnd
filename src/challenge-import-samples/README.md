# Challenge Import Samples

> **Development/Testing use only.** These files exist to test the Challenge Import feature in the AlgoArena backoffice.
> They are **NOT** exposed via any public API and are **NOT** auto-loaded in production.

## 📁 Files

| File | Difficulty | Topic | Format |
|---|---|---|---|
| `two-sum-easy.json` | Easy | Arrays | JSON |
| `longest-substring-medium.json` | Medium | Strings | JSON |
| `binary-search-easy.xlsx` | Easy | Arrays | Excel |
| `merge-intervals-hard.xlsx` | Hard | Arrays | Excel |

## 📋 Schema Reference

All files follow the unified AlgoArena challenge schema:

```json
{
  "title": "string",
  "description": "string",
  "difficulty": "Easy | Medium | Hard | Expert",
  "topic": "Arrays | Strings | Hash Table | Dynamic Programming | Graphs | Trees",
  "xpReward": "number",
  "estimatedTime": "number (minutes)",
  "constraints": ["string array"],
  "examples": [{ "input": "string", "output": "string", "explanation": "string" }],
  "testCases": [{ "input": "string", "output": "string" }],
  "hints": ["string array"],
  "starterCode": { "javascript": "string" }
}
```

### Excel-specific format
For Excel files, JSON fields (`constraints`, `examples`, `testCases`, `hints`) must be stored as **JSON strings** in their cells. The `starterCode` is stored under the column name `starterCode_javascript`.

## 🚀 Generating Excel Files

Excel files are generated using `exceljs`. Run the generator:

```bash
# From project root (backend):
node src/challenge-import-samples/generate-excel-samples.js
```

> Requires `exceljs` to be installed: `npm install exceljs`

## ⚠️ Important Notes

- Max **10 test cases** per challenge (platform limit)
- `difficulty` must be exactly: `Easy`, `Medium`, `Hard`, or `Expert`
- `topic` must match one of the allowed values above
- Never commit real user data or actual challenge solutions here
