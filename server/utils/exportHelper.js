const { Parser } = require('json2csv');

const convertToCSV = (data, fields) => {
  try {
    const opts = fields ? { fields } : {};
    const parser = new Parser(opts);
    return parser.parse(data);
  } catch (err) {
    console.error('CSV Export Error:', err);
    throw err;
  }
};

module.exports = {
  convertToCSV,
};
