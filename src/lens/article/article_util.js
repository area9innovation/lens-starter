var _ = require('underscore');

var MONTH_MAPPING = {
  "1": "January",
  "2": "February",
  "3": "March",
  "4": "April",
  "5": "May",
  "6": "June",
  "7": "July",
  "8": "August",
  "9": "September",
  "10": "October",
  "11": "November",
  "12": "December"
};

var util = {};

function getMonthOrSeason(str) {
  // if month contains non-proper-numeric, we consider it season and show as is.
  var key = str.replace(/^0/, "");
  if (MONTH_MAPPING.hasOwnProperty(key)) {
    return MONTH_MAPPING[key];
  } else {
    return str;
  }
}

util.formatDate = function (pubDate) {
  if (!pubDate) {
    return "";
  }
  var parts = pubDate.split("/");
  var partCount = parts.length;
  var year  = partCount > 0 ? parts[0] : "";
  var month = partCount > 1 ? getMonthOrSeason(parts[1]) : "";
  var day   = partCount > 2 ? parts[2] : "";
  var date = "";
  if (partCount >= 3) {
    date = month + " " + day + ", " + year;
  } else if (parts.length === 2) {
    date = month + " " + year;
  } else if (parts.length === 1) {
    date = year;
  }
  return date.replace(/\b0+/g, '');
};

util.monthSymToNum = function (sym){
  var num = null;
  _.find(MONTH_MAPPING, function(ms, idx){
    if(ms == sym){
      num = idx;
      return true;
    }
    return false;
  });

  return num;
};

util.extractOrcidId = function(orcid_url) {
    // http://orcid.org/0000-0002-8808-1137
    var orcid_id = orcid_url;
    var matches = orcid_url.match(/[\d]{4}-[\d]{4}-[\d]{4}-[\d]{3}[\dX]{1}/);
    if (matches && matches.length) {
      orcid_id = matches[0];
    }
    return orcid_id;
}

module.exports = util;
