/**
 * Calculate transparent rule-based match score between a lost item and a found item
 * Score ranges from 0 to 100
 */
const calculateMatchScore = (lostItem, foundItem) => {
  let score = 0;
  const matchDetails = [];

  // 1. Category Match (Weight: 30)
  if (lostItem.category && foundItem.category && lostItem.category.toLowerCase() === foundItem.category.toLowerCase()) {
    score += 30;
    matchDetails.push('Exact category match (+30)');
  }

  // 2. Brand Match (Weight: 20)
  if (lostItem.brand && foundItem.brand) {
    const b1 = lostItem.brand.toLowerCase().trim();
    const b2 = foundItem.brand.toLowerCase().trim();
    if (b1 === b2 || b1.includes(b2) || b2.includes(b1)) {
      score += 20;
      matchDetails.push('Brand match (+20)');
    }
  }

  // 3. Color Match (Weight: 15)
  if (lostItem.color && foundItem.color) {
    const c1 = lostItem.color.toLowerCase().trim();
    const c2 = foundItem.color.toLowerCase().trim();
    if (c1 === c2 || c1.includes(c2) || c2.includes(c1)) {
      score += 15;
      matchDetails.push('Color match (+15)');
    }
  }

  // 4. Location Proximity (Weight: 15)
  if (lostItem.location && foundItem.location) {
    const l1 = lostItem.location.toLowerCase().trim();
    const l2 = foundItem.location.toLowerCase().trim();
    const words1 = l1.split(/\s+/).filter(w => w.length > 2);
    const words2 = l2.split(/\s+/).filter(w => w.length > 2);
    const hasCommon = words1.some(w => words2.includes(w)) || l1.includes(l2) || l2.includes(l1);
    if (hasCommon) {
      score += 15;
      matchDetails.push('Location proximity match (+15)');
    }
  }

  // 5. Title & Description Keyword Overlap (Weight: 10)
  const extractKeywords = (text) => {
    if (!text) return [];
    return text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !['with', 'that', 'this', 'have', 'from', 'near', 'some', 'item'].includes(w));
  };

  const kw1 = [...extractKeywords(lostItem.title), ...extractKeywords(lostItem.description)];
  const kw2 = [...extractKeywords(foundItem.title), ...extractKeywords(foundItem.description)];
  const commonKeywords = kw1.filter(k => kw2.includes(k));
  if (commonKeywords.length > 0) {
    const kwScore = Math.min(10, commonKeywords.length * 4);
    score += kwScore;
    matchDetails.push(`Keyword overlap [${[...new Set(commonKeywords)].slice(0, 3).join(', ')}] (+${kwScore})`);
  }

  // 6. Date Proximity (Weight: 10)
  if (lostItem.date && foundItem.date) {
    const d1 = new Date(lostItem.date).getTime();
    const d2 = new Date(foundItem.date).getTime();
    const diffDays = Math.abs(d1 - d2) / (1000 * 60 * 60 * 24);

    if (diffDays <= 1) {
      score += 10;
      matchDetails.push('Same day/1 day date match (+10)');
    } else if (diffDays <= 3) {
      score += 7;
      matchDetails.push('Within 3 days date proximity (+7)');
    } else if (diffDays <= 7) {
      score += 4;
      matchDetails.push('Within 7 days date proximity (+4)');
    }
  }

  let matchLevel = 'Low';
  if (score >= 65) matchLevel = 'High';
  else if (score >= 40) matchLevel = 'Medium';

  return {
    score: Math.min(100, score),
    matchLevel,
    matchDetails,
  };
};

module.exports = {
  calculateMatchScore,
};
