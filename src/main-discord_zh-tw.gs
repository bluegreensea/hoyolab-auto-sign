const profiles = [
  {
    token: "ltoken_v2=gBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxCY; ltuid_v2=26XXXXX20;",
    genshin: true,
    honkai_star_rail: true,
    honkai_3: false,
    tears_of_themis: false,
    zenless_zone_zero: false,
    accountName: "你的名字"
  }
];

const discord_notify = true
const myDiscordID = ""
const discordWebhook = ""

/** 以上為設定檔，請參考 https://github.com/canaria3406/hoyolab-auto-sign 之說明進行設定**/
/** 以下為程式碼，請勿更動 **/

const urlDict = {
  Genshin: 'https://sg-hk4e-api.hoyolab.com/event/sol/sign?lang=zh-tw&act_id=e202102251931481',
  Star_Rail: 'https://sg-public-api.hoyolab.com/event/luna/os/sign?lang=zh-tw&act_id=e202303301540311',
  Honkai_3: 'https://sg-public-api.hoyolab.com/event/mani/sign?lang=zh-tw&act_id=e202110291205111',
  Tears_of_Themis: 'https://sg-public-api.hoyolab.com/event/luna/os/sign?lang=zh-tw&act_id=e202308141137581',
  Zenless_Zone_Zero: 'https://sg-public-api.hoyolab.com/event/luna/zzz/os/sign?lang=zh-tw&act_id=e202406031448091'
};

const gameNameDict = {
  Genshin: '原神',
  Star_Rail: '星穹鐵道',
  Honkai_3: '崩壞3rd',
  Tears_of_Themis: '未定事件簿',
  Zenless_Zone_Zero: '絕區零'
};

/** 
  以下程式碼為某些遊戲需求的額外標頭
  更多資訊在 https://github.com/canaria3406/hoyolab-auto-sign/issues/52
**/
const headerDict = {
  default: {
    'Accept': 'application/json, text/plain, */*',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'x-rpc-app_version': '2.34.1',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    'x-rpc-client_type': '4',
    'Referer': 'https://act.hoyolab.com/',
    'Origin': 'https://act.hoyolab.com',
  },
  Genshin: {

  },
  Star_Rail: {

  },
  Honkai_3: {

  },
  Tears_of_Themis: {

  },
  Zenless_Zone_Zero: {
    'x-rpc-signgame': 'zzz',
  }
}

async function main() {
  const messages = await Promise.all(profiles.map(autoSignFunction));
  const hoyolabResp = `${messages.join('\n\n')}`;

  if (discord_notify && discordWebhook) {
    postWebhook(hoyolabResp);
  }
}

function discordPing() {
  return myDiscordID ? `<@${myDiscordID}> ` : '';
}

function autoSignFunction({
  token,
  genshin = false,
  honkai_star_rail = false,
  honkai_3 = false,
  tears_of_themis = false,
  zenless_zone_zero = false,
  accountName
}) {
  const urlsnheaders = [];

  if (genshin) urlsnheaders.push({ url: urlDict.Genshin, headers: { Cookie: token, ...headerDict["default"], ...headerDict["Genshin"]} });
  if (honkai_star_rail) urlsnheaders.push({ url: urlDict.Star_Rail, headers: { Cookie: token, ...headerDict["default"], ...headerDict["Star_Rail"]} });
  if (honkai_3) urlsnheaders.push({ url: urlDict.Honkai_3, headers: { Cookie: token, ...headerDict["default"], ...headerDict["Honkai_3"]} });
  if (tears_of_themis) urlsnheaders.push({ url: urlDict.Tears_of_Themis, headers: { Cookie: token, ...headerDict["default"], ...headerDict["Tears_of_Themis"]} });
  if (zenless_zone_zero) urlsnheaders.push({ url: urlDict.Zenless_Zone_Zero, headers: { Cookie: token, ...headerDict["default"], ...headerDict["Zenless_Zone_Zero"]} });

  const options = {
    method: 'POST',
    muteHttpExceptions: true,
  };

  let response = `${accountName} 的自動簽到作業已完成`;

  var sleepTime = 0;
  const httpResponses = [];
  for (const urlnheaders of urlsnheaders) {
    Utilities.sleep(sleepTime);
    httpResponses.push(UrlFetchApp.fetch(urlnheaders.url, { ...options, headers: urlnheaders.headers }));
    sleepTime = 1000;
  }

  for (const [i, hoyolabResponse] of httpResponses.entries()) {
    const responseJson = JSON.parse(hoyolabResponse);
    const checkInResult = responseJson.message;
    const enGameName = Object.keys(urlDict).find(key => urlDict[key] === urlsnheaders[i].url);
    const gameName = gameNameDict[enGameName];
    const isError = checkInResult != "OK";
    const bannedCheck = responseJson.data?.gt_result?.is_risk;

    if (bannedCheck) {
      response += `\n${gameName}: ${discordPing()} 自動簽到失敗，受到圖形驗證阻擋。`;
    } else {
      response += `\n${gameName}: ${isError ? discordPing() : ""}${checkInResult}`;
    }
  }

  return response;
}

function postWebhook(data) {
  let payload = JSON.stringify({
    'username': '自動簽到',
    'avatar_url': 'https://i.imgur.com/LI1D4hP.png',
    'content': data
  });

  const options = {
    method: 'POST',
    contentType: 'application/json',
    payload: payload,
    muteHttpExceptions: true
  };

  UrlFetchApp.fetch(discordWebhook, options);
}
