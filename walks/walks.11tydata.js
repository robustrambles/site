const path = require('path');

module.exports = {
  eleventyComputed: {
    layout: data => path.basename(data.page.inputPath) === 'index.md' ? 'serieslist' : 'walk',
    walkSeries: data => path.basename(data.page.inputPath.replace('/' + path.basename(data.page.inputPath), '')),
  }
}
