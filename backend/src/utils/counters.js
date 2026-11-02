const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // e.g. "order-20250611"
    seq: { type: Number, default: 0 },
  },
  { versionKey: false }
);
const Counter = mongoose.model('Counter', counterSchema);

/**
 * Atomic sequence — findOneAndUpdate($inc) is serialized by MongoDB, so two
 * concurrent checkouts can NEVER receive the same number (G-01 fix, by design).
 * @param {string} key    counter id, e.g. `order-${YYYYMMDD}`
 * @param {import('mongoose').ClientSession} [session] — pass the checkout transaction session
 * @returns {Promise<number>} the new sequence value (starts at 1)
 */
const getNextSequence = async (key, session) => {
  const counter = await Counter.findOneAndUpdate(
    { _id: key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, session }
  ).lean();
  return counter.seq;
};

module.exports = { getNextSequence, Counter };