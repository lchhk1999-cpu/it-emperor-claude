// 【虛構示範資料】All guilds and nicknames below are made up for the guild demo.
// They do not refer to any real school or person.
(function (root) {
  const ITE = (root.ITE = root.ITE || {});
  ITE.demoGuilds = {
    label: "【虛構示範資料】",
    guilds: [
      { id: "demo-moon", name: "虛構月影書院 IT 學會", founder: "月兔", members: ["月兔", "星星", "阿豆", "小雲", "橙橙", "波波", "麥芽"] },
      { id: "demo-sun", name: "虛構朝陽中學電腦隊", founder: "朝日", members: ["朝日", "光光", "小葵"] },
      { id: "demo-wave", name: "虛構海浪學園", founder: "浪花", members: ["浪花", "貝殼"] },
    ],
    // Sample finished attacks for this week: [guildId, nickname, daysAfterMonday, damage, correct, answered]
    sampleAttacks: [
      ["demo-moon", "月兔", 0, 620, 9, 11], ["demo-moon", "星星", 0, 480, 7, 9], ["demo-moon", "阿豆", 1, 350, 6, 10],
      ["demo-moon", "月兔", 1, 700, 10, 12], ["demo-moon", "小雲", 2, 260, 5, 8],
      ["demo-sun", "朝日", 0, 800, 11, 12], ["demo-sun", "光光", 0, 540, 8, 10], ["demo-sun", "小葵", 1, 410, 7, 9],
      ["demo-wave", "浪花", 0, 900, 12, 12],
    ],
  };
})(globalThis);
