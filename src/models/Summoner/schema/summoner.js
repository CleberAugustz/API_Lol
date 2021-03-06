const mongoose = require("mongoose");

module.exports = mongoose.model("Summoner", {
  id: { type: String },
  name: {
    type: String,
  },
  accountId: { type: String },
  puuid: { type: String },
  profileIconId: { type: Number },
  revisionDate: { type: Date },
  summonerLevel: { type: Number },
  winRate: { type: Number },
  imageProfile: { type: String },
  rank: [
    {
      leagueId: { type: String },
      queueType: { type: String },
      tier: { type: String },
      rank: { type: String },
      summonerId: { type: String },
      summonerName: { type: String },
      leaguePoints: { type: Number },
      wins: { type: Number },
      losses: { type: Number },
      veteran: { type: Boolean },
      inactive: { type: Boolean },
      freshBlood: { type: Boolean },
      hotStreak: { type: Boolean },
      emblem: { type: String },
      flag: { type: String },
    },
  ],
});
