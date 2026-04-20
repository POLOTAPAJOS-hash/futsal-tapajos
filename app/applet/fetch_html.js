import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';
import fs from 'fs';

// Try to parse the DOM if we can just get the HTML. Wait, we can just use the running dev server!
