const { DateTime } = require("luxon");
const fs = require("fs");
const path = require("path");
const pluginRss = require("@11ty/eleventy-plugin-rss");
const pluginSyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const pluginNavigation = require("@11ty/eleventy-navigation");
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");

module.exports = function(eleventyConfig) {
  // Copy the `img` and `css` folders to the output
  eleventyConfig.addPassthroughCopy("img");
  eleventyConfig.addPassthroughCopy("css");

  // Add plugins
  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(pluginSyntaxHighlight);
  eleventyConfig.addPlugin(pluginNavigation);

  // Alias `layout: walk` to `layout: layouts/walk.njk`
  eleventyConfig.addLayoutAlias("walk", "layouts/walk.njk");

  // Alias `layout: walk` to `layout: layouts/walk.njk`
  eleventyConfig.addLayoutAlias("serieslist", "layouts/serieslist.njk");

  eleventyConfig.addFilter("readableDate", dateObj => {
    return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat("dd LLL yyyy");
  });

  // https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
  eleventyConfig.addFilter('htmlDateString', (dateObj) => {
    return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat('yyyy-LL-dd');
  });

  // Get the first `n` elements of a collection.
  eleventyConfig.addFilter("head", (array, n) => {
    if(!Array.isArray(array) || array.length === 0) {
      return [];
    }
    if( n < 0 ) {
      return array.slice(n);
    }

    return array.slice(0, n);
  });

  // Return the smallest number argument
  eleventyConfig.addFilter("min", (...numbers) => {
    return Math.min.apply(null, numbers);
  });

  eleventyConfig.addFilter("entries", (data) => data ? Object.entries(data) : []);

  eleventyConfig.addFilter("getSeriesMetadata", (metadata, series) => metadata.find(item => item.data.walkSeries === series));

  // Create an array of all tags
  eleventyConfig.addCollection("seriesList", function(collection) {
    const seriesList = collection.getFilteredByGlob("walks/*/index.md");
    return seriesList;
  });

  fs.readdirSync(path.resolve(__dirname, './walks'), { withFileTypes: true }).filter(dirent => dirent.isDirectory()).forEach(series => {
    eleventyConfig.addCollection(series.name, function(collection) {
      return collection.getAll().filter(item => path.basename(item.data.page.inputPath) !== 'index.md' && item.data.walkSeries === series.name).sort((a, b) => {
        if (a.data.title === b.data.title) return 0;
        const titleRegex = /Section (\d{1,2})/;
        const directionRegex = /([^a-z]{0,1}|^)(Out|Return)([^a-z]|$)/;
        const aMatch = a.data.title.match(titleRegex);
        const bMatch = b.data.title.match(titleRegex);
        if (aMatch === null || bMatch === null) return a.data.title.localeCompare(b.data.title);
        const [_A, sectionNumberStrA] = aMatch;
        const [_B, sectionNumberStrB] = bMatch;
        const sectionNumberA = parseInt(sectionNumberStrA);
        const sectionNumberB = parseInt(sectionNumberStrB);
        if (sectionNumberA !== sectionNumberB) return ((sectionNumberA > sectionNumberB) * 2) - 1;
        const aDirectionMatch = a.data.title.match(directionRegex);
        const bDirectionMatch = b.data.title.match(directionRegex);
        if (aDirectionMatch === null || bDirectionMatch === null) return 1;
        const [_AD, aPrefix, directionA] = aDirectionMatch;
        const [_BD, bPrefix, directionB] = bDirectionMatch;
        if (directionA === directionB) return 0;
        if (directionA === 'Out' && directionB === 'Return') return -1;
        return 1;
      });
    });
  });

  // Customize Markdown library and settings:
  let markdownLibrary = markdownIt({
    html: true,
    breaks: true,
    linkify: true
  }).use(markdownItAnchor, {
    slugify: eleventyConfig.getFilter("slug")
  });
  eleventyConfig.setLibrary("md", markdownLibrary);

  // Override Browsersync defaults (used only with --serve)
  eleventyConfig.setBrowserSyncConfig({
    callbacks: {
      ready: function(err, browserSync) {
        const content_404 = fs.readFileSync('_site/404.html');

        browserSync.addMiddleware("*", (req, res) => {
          // Provides the 404 content without redirect.
          res.writeHead(404, {"Content-Type": "text/html; charset=UTF-8"});
          res.write(content_404);
          res.end();
        });
      },
    },
    ui: false,
    ghostMode: false
  });

  return {
    // Control which files Eleventy will process
    // e.g.: *.md, *.njk, *.html, *.liquid
    templateFormats: [
      "md",
      "njk",
      "html",
      "liquid"
    ],

    // Pre-process *.md files with: (default: `liquid`)
    markdownTemplateEngine: "njk",

    // Pre-process *.html files with: (default: `liquid`)
    htmlTemplateEngine: "njk",

    // -----------------------------------------------------------------
    // If your site deploys to a subdirectory, change `pathPrefix`.
    // Don’t worry about leading and trailing slashes, we normalize these.

    // If you don’t have a subdirectory, use "" or "/" (they do the same thing)
    // This is only used for link URLs (it does not affect your file structure)
    // Best paired with the `url` filter: https://www.11ty.dev/docs/filters/url/

    // You can also pass this in on the command line using `--pathprefix`

    // Optional (default is shown)
    pathPrefix: "/",
    // -----------------------------------------------------------------

    // These are all optional (defaults are shown):
    dir: {
      input: ".",
      includes: "_includes",
      data: "_data",
      output: "_site"
    }
  };
};
