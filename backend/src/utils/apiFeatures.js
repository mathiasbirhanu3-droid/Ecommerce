/**
 * Normalizes a validated list query into Mongo pieces. Everything is whitelist-driven:
 * clients can ONLY sort by keys present in sortMap (injection/abuse impossible).
 */
const parseListQuery = (query = {}, { sortMap = {}, defaultSort, maxLimit = 48 } = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number(query.limit) || 12));
  const sortKey = query.sort && sortMap[query.sort] ? query.sort : defaultSort;
  return {
    page,
    limit,
    skip: (page - 1) * limit,
    sort: sortMap[sortKey] || sortMap[defaultSort] || { createdAt: -1 },
  };
};

module.exports = { parseListQuery };