import qs from 'qs';
import * as cheerio from 'cheerio';
import FormData from 'form-data';
import fetch from 'node-fetch';

// sadaslk-dlcore uses eval() internally so nft cannot trace its require() calls.
// Assigning to globalThis is a side effect Rollup cannot eliminate, forcing nft
// to trace these packages and copy them into the function's node_modules.
(globalThis as any).__sadaslk_deps = { qs, cheerio, FormData, fetch };
