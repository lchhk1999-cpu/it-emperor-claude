// 【虛構示範資料】All schools and nicknames below are made up for the guild demo.
// They do not refer to any real school or person. Rules are PROPOSAL only.
(function (root) {
  const ITE = (root.ITE = root.ITE || {});
  const m = (nickname, correct, answered, secondsUsed) => ({
    nickname,
    result: { total: 10, correct, answered, secondsUsed, secondsLimit: 300 },
  });
  ITE.demoGuilds = {
    label: "【虛構示範資料】PROPOSAL",
    schools: [
      { id: "demo-moon", name: "虛構月影書院", members: [m("月兔", 9, 10, 200), m("星星", 8, 10, 150), m("阿豆", 7, 10, 250), m("小雲", 6, 10, 100), m("橙橙", 8, 9, 280), m("波波", 5, 10, 120), m("麥芽", 4, 8, 90)] },
      { id: "demo-sun", name: "虛構朝陽中學", members: [m("朝日", 9, 10, 100), m("光光", 8, 10, 220), m("小葵", 7, 10, 180)] },
      { id: "demo-wave", name: "虛構海浪學園", members: [m("浪花", 10, 10, 290), m("貝殼", 6, 10, 200)] },
    ],
  };
})(globalThis);
