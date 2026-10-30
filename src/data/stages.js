// Stage definitions (shipped in every build; contain no questions).
(function (root) {
  const ITE = (root.ITE = root.ITE || {});

  // PROTOTYPE stage. Name, boss and numbers are placeholders.
  ITE.stages = [
    {
      id: "stage-1",
      chapter: "第一章",
      name: "Bug 王的機房",
      description: "混合 Topic 測試關：Excel、SQL、硬件、網絡、保安、Python",
      questionCount: 10,
      topicIds: null,
      boss: { name: "Bug 王", maxHp: 300, attack: 20 },
    },
  ];
})(globalThis);
