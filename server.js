/**
 * CSV parser
 * 
 * @author ChatGPT 5, 
 *         prompted by Arturo Mora-Rioja 
 *         based on the Python version (https://github.com/arturomorarioja/py_csv_parser_api)
 */
const fs = require('fs').promises;
const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { parse } = require('csv-parse/sync');

dotenv.config();

const app = express();
app.set('json spaces', 2);
app.use(cors());

const PORT = process.env.PORT || 8080;
const BASE_DIR = process.env.BASE_DIR || process.cwd();

/* 
    Normalizes an incoming file path.
    - If a Windows-style drive letter is present inside a non-Windows container, reject it.
    - If path is absolute, keep it.
    - Otherwise, resolve relative to BASE_DIR.
    - Prevent directory traversal outside BASE_DIR when using relative paths.
*/
function normalizePath(inputPath) {
    if (!inputPath || typeof inputPath !== 'string') {
        const err = new Error('Missing file path.');
        err.status = 400;
        throw err;
    }

    // Reject Windows drive letters on non-Windows systems
    if (path.sep === '/' && /^[A-Za-z]:[\\/]/.test(inputPath)) {
        const err = new Error('Windows-style paths are not valid here.');
        err.status = 400;
        throw err;
    }

    let candidate = inputPath;

    // Express path param route may drop the leading slash; allow both
    if (!path.isAbsolute(candidate)) {
        candidate = path.join(BASE_DIR, candidate);
        const resolved = path.resolve(candidate);
        const baseResolved = path.resolve(BASE_DIR);
        if (!resolved.startsWith(baseResolved + path.sep) && resolved !== baseResolved) {
            const err = new Error('Path outside allowed base directory.');
            err.status = 400;
            throw err;
        }
        return resolved;
    }

    // Absolute path given; return as is
    return path.resolve(candidate);
}

/*
    Parses a CSV file into JSON using header row as keys.
    Uses csv-parse for correct handling of quotes, separators, and newlines.
*/
async function parseCsvToJson(absPath) {
    const content = await fs.readFile(absPath, { encoding: 'utf-8' });
    const records = parse(content, {
        columns: true,              // use header row as keys
        skip_empty_lines: true,
        trim: true
    });
    return records;
}

/*
    GET /parse?file=/app/data/danish_companies.csv
*/
app.get('/parse', async (req, res, next) => {
    try {
        const file = req.query.file;
        if (!file) {
            const err = new Error('Missing ?file= query parameter.');
            err.status = 400;
            throw err;
        }
        const abs = normalizePath(file);
        const data = await parseCsvToJson(abs);
        res.json(data);
    } catch (err) {
        next(err);
    }
});

/*
    GET /parse/:file(*)   e.g., /parse/data/danish_companies.csv
    Leading slash is not required. Relative paths are resolved under BASE_DIR.
*/
app.get('/parse/:file(*)', async (req, res, next) => {
    try {
        const p = req.params.file;
        const abs = normalizePath(p);
        const data = await parseCsvToJson(abs);
        res.json(data);
    } catch (err) {
        next(err);
    }
});

/*
    Centralized error handler.
*/
app.use((err, req, res, next) => {
    const status = err.status || 500;
    res.status(status).json({
        error: {
            status,
            message: err.message || 'Internal Server Error'
        }
    });
});

app.listen(PORT, () => {
    console.log('### CSV PARSER API (Node) ###');
    console.log(`Listening on http://0.0.0.0:${PORT}`);
    console.log(`BASE_DIR: ${BASE_DIR}`);
});