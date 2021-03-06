const makeMinutes = require("../../../shared/utils/makeMinutes");
const champions = require("../../../assets/champions.json");
const modelSummoner = require("../schema/summoner");

const modelMatches = require("../schema/Matches");

const modelMasteries = require("../schema/Masteries");

const {instance} = require("../../../instance.js");

class Summoner {
  async championImages(Matches) {
    await Object.entries(Matches).map((match) => {
      let champ = champions.find(
        (champion) => parseInt(champion.key) === match[1].champion
      );
      match[1].champion = champ;
    });
  }

  async dataSummoner(summoner) {
    try {
      let data = [];
      let winRate = 0;
      let matches = await instance.get(
        `/match/v4/matchlists/by-account/${summoner.accountId}?endIndex=10`
      );
      for (let match of matches.data.matches) {
        let game = await instance.get(`/match/v4/matches/${match.gameId}`);
        let dataParticipants = await game.data.participantIdentities.find(
          (participant) => participant.player.summonerId == summoner.id
        );
        let dataParticipant = await game.data.participants.find(
          (participant) =>
            participant.participantId == dataParticipants.participantId
        );

        let dateGame = new Date(game.data.gameCreation);

        let dataParticipantOnMatch = {
          win: dataParticipant.stats.win,
          duration: makeMinutes(game.data.gameDuration),
          kda:
            dataParticipant.stats.kills +
            "/" +
            dataParticipant.stats.deaths +
            "/" +
            dataParticipant.stats.assists,
        };
        if (dataParticipantOnMatch.win) {
          winRate++;
        }
        game.data = match;
        game.data.data = dataParticipantOnMatch;
        game.data.timestamp =
          dateGame.getDate() +
          "/" +
          (dateGame.getMonth() + 1) +
          "/" +
          dateGame.getFullYear();
        data.push(game.data);
      }
      await this.championImages(data);

      const masteries = await instance.get(
        `/champion-mastery/v4/champion-masteries/by-summoner/${summoner.id}`
      );
      return {
        summoner,
        imageProfile: `/datadragon/iconProfile/${summoner.profileIconId}`,
        winRate: winRate * 10,
        matches: data,
        masteries: await masteries.data.slice(0, 5),
      };
    } catch (error) {
      console.log("an error has occurred: " + error.message);
      throw {
        response: {
          status: error.response.status,
        },
        message: error.response.statusText,
      };
    }
  }

  async takeRank(summonerId) {
    let data = await instance.get(
      `/league/v4/entries/by-summoner/${summonerId}`
    );

    data.data.forEach((q) => {
      q.emblem = `/datadragon/ranked-emblems/${q.tier}-${q.rank}`;
      q.flag = `/datadragon/ranked-flags/${q.tier}`;
    });
    return data.data;
  }

  async SearchByName(name) {
    try {
      let data = await this.findMongoDb(name);
      if (!data) {
        data = await instance.get(
          `/summoner/v4/summoners/by-name/${encodeURIComponent(name)}`
        );
        data = await this.dataSummoner(data.data);
        let rank = await this.takeRank(data.masteries[1].summonerId);
        data.summoner.rank = rank;
        data = await this.saveOnMongoDb(data);
      }
      return {
        summoner: data.summoner,
        winRate: data.summoner.winRate,
        imageProfile: data.summoner.imageProfile,
        matches: data.matches,
        masteries: data.mastery,
      };
    } catch (error) {
      console.log("an error has occurred: " + error.response.status);
      throw {
        message: error.message,
        status: error.response.status,
      };
    }
  }

  async saveOnMongoDb(data) {
    try {
      let summoner = new modelSummoner({
        id: data.summoner.id,
        accountId: data.summoner.accountId,
        puuid: data.summoner.puuid,
        name: data.summoner.name,
        profileIconId: data.summoner.profileIconId,
        revisionDate: data.summoner.revisionDate,
        summonerLevel: data.summoner.summonerLevel,
        winRate: data.winRate,
        imageProfile: data.imageProfile,
        rank: data.summoner.rank.map((rank) => {
          return {
            leagueId: rank.leagueId,
            queueType: rank.queueType,
            tier: rank.tier,
            rank: rank.rank,
            summonerId: rank.summonerId,
            summonerName: rank.summonerName,
            leaguePoints: rank.leaguePoints,
            wins: rank.wins,
            losses: rank.losses,
            veteran: rank.veteran,
            inactive: rank.inactive,
            freshBlood: rank.freshBlood,
            hotStreak: rank.hotStreak,
            emblem: rank.emblem,
            flag: rank.flag,
          };
        }),
      });

      await data.matches.forEach(async function (match) {
        let response = new modelMatches({
          summonerId: data.summoner.id,
          platformId: match.platformId,
          gameId: match.gameId,
          champion: {
            key: match.champion.key,
            image: {
              splashDesktop: match.champion.image.splashDesktop,
              splashMobile: match.champion.image.splashMobile,
              icon: match.champion.image.icon,
            },
          },
          queue: match.queue,
          season: match.season,
          timestamp: match.timestamp,
          role: match.role,
          lane: match.lane,
          data: {
            win: match.data.win,
            duration: match.data.duration,
            kda: match.data.kda,
          },
        });
        await response.save();
      });

      await data.masteries.forEach(async function (mastery) {
        let response = new modelMasteries({
          idSummoner: data.summoner.id,
          championId: mastery.championId,
          championLevel: mastery.championLevel,
          lastPlayTime: mastery.lastPlayTime,
          championPointsSinceLastLevel: mastery.championPointsSinceLastLevel,
          championPointsUntilNextLevel: mastery.championPointsUntilNextLevel,
          chestGranted: mastery.chestGranted,
          tokensEarned: mastery.tokensEarned,
          summonerId: mastery.summonerId,
        });
        await response.save();
      });

      await summoner.save();

      var matches = await modelMatches.find({
        summonerId: data.summoner.id,
      });

      var mastery = await modelMasteries.find({
        summonerId: data.summoner.id,
      });

      return { summoner, matches, mastery };
    } catch (error) {
      console.log("an error has occurred " + error.message);
      throw {
        response: {
          status: error.response.status,
        },
        message: error.response.statusText,
      };
    }
  }

  async findMongoDb(name) {
    let response = await modelSummoner.find({
      name: { $regex: name, $options: "i" },
    });
    if (response.length == 0) {
      return false;
    }
    var matches = await modelMatches.find({
      summonerId: response[0].id,
    });

    var mastery = await modelMasteries.find({
      summonerId: response[0].id,
    });
    return { summoner: response[0], matches, mastery };
  }
}

module.exports = new Summoner();
