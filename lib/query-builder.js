class QueryBuilder {
  constructor() {
    this.filters = {
      keywords: '',
      minFaves: null,
      maxFaves: null,
      minRetweets: null,
      maxRetweets: null,
      minReplies: null,
      maxReplies: null,
      sinceDate: null,
      untilDate: null,
      fromUser: null,
      toUser: null,
      mentionsUser: null,
      verified: false,
      blueVerified: false,
      follows: false,
      hasMedia: false,
      hasImages: false,
      hasVideos: false,
      hasLinks: false,
      includeReplies: null,
      includeRetweets: null,
      quoteOnly: false,
      near: null,
      within: null,
      geocode: null,
      lang: null
    };
  }

  setKeywords(keywords) {
    this.filters.keywords = keywords;
    return this;
  }

  setMinFaves(count) {
    this.filters.minFaves = count;
    return this;
  }

  setMaxFaves(count) {
    this.filters.maxFaves = count;
    return this;
  }

  setMinRetweets(count) {
    this.filters.minRetweets = count;
    return this;
  }

  setMaxRetweets(count) {
    this.filters.maxRetweets = count;
    return this;
  }

  setMinReplies(count) {
    this.filters.minReplies = count;
    return this;
  }

  setMaxReplies(count) {
    this.filters.maxReplies = count;
    return this;
  }

  setSinceDate(date) {
    this.filters.sinceDate = date;
    return this;
  }

  setUntilDate(date) {
    this.filters.untilDate = date;
    return this;
  }

  setFromUser(username) {
    this.filters.fromUser = username;
    return this;
  }

  setToUser(username) {
    this.filters.toUser = username;
    return this;
  }

  setMentionsUser(username) {
    this.filters.mentionsUser = username;
    return this;
  }

  setVerified(enabled) {
    this.filters.verified = enabled;
    return this;
  }

  setBlueVerified(enabled) {
    this.filters.blueVerified = enabled;
    return this;
  }

  setFollows(enabled) {
    this.filters.follows = enabled;
    return this;
  }

  setHasMedia(enabled) {
    this.filters.hasMedia = enabled;
    return this;
  }

  setHasImages(enabled) {
    this.filters.hasImages = enabled;
    return this;
  }

  setHasVideos(enabled) {
    this.filters.hasVideos = enabled;
    return this;
  }

  setHasLinks(enabled) {
    this.filters.hasLinks = enabled;
    return this;
  }

  setIncludeReplies(include) {
    this.filters.includeReplies = include;
    return this;
  }

  setIncludeRetweets(include) {
    this.filters.includeRetweets = include;
    return this;
  }

  setQuoteOnly(enabled) {
    this.filters.quoteOnly = enabled;
    return this;
  }

  setNear(location) {
    this.filters.near = location;
    return this;
  }

  setWithin(distance) {
    this.filters.within = distance;
    return this;
  }

  setGeocode(geocode) {
    this.filters.geocode = geocode;
    return this;
  }

  setLang(langCode) {
    this.filters.lang = langCode;
    return this;
  }

  fromFilters(filters) {
    this.filters = { ...this.filters, ...filters };
    return this;
  }

  build() {
    const parts = [];

    if (this.filters.keywords) {
      const needsQuotes = this.filters.keywords.includes(' ') &&
                          !this.filters.keywords.startsWith('"');
      parts.push(needsQuotes ? `"${this.filters.keywords}"` : this.filters.keywords);
    }

    if (this.filters.minFaves !== null) {
      parts.push(`min_faves:${this.filters.minFaves}`);
    }

    if (this.filters.maxFaves !== null) {
      parts.push(`-min_faves:${this.filters.maxFaves}`);
    }

    if (this.filters.minRetweets !== null) {
      parts.push(`min_retweets:${this.filters.minRetweets}`);
    }

    if (this.filters.maxRetweets !== null) {
      parts.push(`-min_retweets:${this.filters.maxRetweets}`);
    }

    if (this.filters.minReplies !== null) {
      parts.push(`min_replies:${this.filters.minReplies}`);
    }

    if (this.filters.maxReplies !== null) {
      parts.push(`-min_replies:${this.filters.maxReplies}`);
    }

    if (this.filters.sinceDate) {
      parts.push(`since:${this.filters.sinceDate}`);
    }

    if (this.filters.untilDate) {
      parts.push(`until:${this.filters.untilDate}`);
    }

    if (this.filters.fromUser) {
      parts.push(`from:${this.filters.fromUser}`);
    }

    if (this.filters.toUser) {
      parts.push(`to:${this.filters.toUser}`);
    }

    if (this.filters.mentionsUser) {
      parts.push(`@${this.filters.mentionsUser}`);
    }

    if (this.filters.verified) {
      parts.push('filter:verified');
    }

    if (this.filters.blueVerified) {
      parts.push('filter:blue_verified');
    }

    if (this.filters.follows) {
      parts.push('filter:follows');
    }

    if (this.filters.hasMedia) {
      parts.push('filter:media');
    }

    if (this.filters.hasImages) {
      parts.push('filter:images');
    }

    if (this.filters.hasVideos) {
      parts.push('filter:videos');
    }

    if (this.filters.hasLinks) {
      parts.push('filter:links');
    }

    if (this.filters.includeReplies === false) {
      parts.push('-filter:replies');
    } else if (this.filters.includeReplies === true) {
      parts.push('filter:replies');
    }

    if (this.filters.includeRetweets === false) {
      parts.push('-filter:retweets');
    } else if (this.filters.includeRetweets === true) {
      parts.push('filter:retweets');
    }

    if (this.filters.quoteOnly) {
      parts.push('filter:quote');
    }

    if (this.filters.near && this.filters.within) {
      parts.push(`near:${this.filters.near} within:${this.filters.within}`);
    }

    if (this.filters.geocode) {
      parts.push(`geocode:${this.filters.geocode}`);
    }

    if (this.filters.lang) {
      parts.push(`lang:${this.filters.lang}`);
    }

    return parts.join(' ');
  }

  reset() {
    this.filters = {
      keywords: '',
      minFaves: null,
      maxFaves: null,
      minRetweets: null,
      maxRetweets: null,
      minReplies: null,
      maxReplies: null,
      sinceDate: null,
      untilDate: null,
      fromUser: null,
      toUser: null,
      mentionsUser: null,
      verified: false,
      blueVerified: false,
      follows: false,
      hasMedia: false,
      hasImages: false,
      hasVideos: false,
      hasLinks: false,
      includeReplies: null,
      includeRetweets: null,
      quoteOnly: false,
      near: null,
      within: null,
      geocode: null,
      lang: null
    };
    return this;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = QueryBuilder;
}