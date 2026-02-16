// 南昌麻将计分器 - 自动化测试
const players = ['dong', 'nan', 'xi', 'bei'];

function calc(config) {
  const state = {
    zhuang: config.zhuang || 'nan',
    hu: config.hu || 'nan',
    pao: config.pao || 'none',
    huTypes: new Set(config.huTypes || []),
    players: {
      dong: { zheng: 0, fu: 0, minggang: 0, angang: 0, ...(config.dong || {}) },
      nan:  { zheng: 0, fu: 0, minggang: 0, angang: 0, ...(config.nan || {}) },
      xi:   { zheng: 0, fu: 0, minggang: 0, angang: 0, ...(config.xi || {}) },
      bei:  { zheng: 0, fu: 0, minggang: 0, angang: 0, ...(config.bei || {}) }
    }
  };

  const results = {};
  players.forEach(p => results[p] = 0);

  const winner = state.hu;
  const dealer = state.zhuang;
  const isZimo = state.pao === 'none';
  const paoPlayer = state.pao;

  // 1. 精牌分
  const jingBase = {};
  let totalJingBase = 0;
  const playersWithJing = [];
  players.forEach(p => {
    jingBase[p] = state.players[p].zheng * 2 + state.players[p].fu;
    totalJingBase += jingBase[p];
    if (jingBase[p] > 0) playersWithJing.push(p);
  });
  const isBawang = playersWithJing.length === 1;
  const chongguanMulti = totalJingBase >= 5 ? (totalJingBase - 3) : 1;
  const jingScore = {};
  players.forEach(p => {
    jingScore[p] = jingBase[p];
    if (jingScore[p] > 0) {
      jingScore[p] *= chongguanMulti;
      if (isBawang) jingScore[p] *= 2;
    }
  });
  const totalJingScore = players.reduce((s, p) => s + jingScore[p], 0);
  players.forEach(p => {
    results[p] += 4 * jingScore[p] - totalJingScore;
  });

  // 2. 杠分
  players.forEach(p => {
    const myGangPer = state.players[p].minggang * 1 + state.players[p].angang * 2;
    results[p] += myGangPer * 3;
    players.forEach(q => {
      if (q !== p) {
        results[p] -= state.players[q].minggang * 1 + state.players[q].angang * 2;
      }
    });
  });
  if (state.huTypes.has('gangjin')) {
    results[winner] += 30;
    players.forEach(p => { if (p !== winner) results[p] -= 10; });
  }

  // 3. 胡牌分
  const hasTianhu = state.huTypes.has('tianhu');
  const hasDihu = state.huTypes.has('dihu');
  const hasDeguo = state.huTypes.has('deguo');
  const hasJingdiao = state.huTypes.has('jingdiao');
  const hasQidui = state.huTypes.has('qidui');
  const hasDqidui = state.huTypes.has('dqidui');
  const hasShisanlan = state.huTypes.has('shisanlan');
  const hasQixing = state.huTypes.has('qixing');
  const hasGangshang = state.huTypes.has('gangshang');
  const hasQianggang = state.huTypes.has('qianggang');

  if (hasTianhu || hasDihu) {
    let fixedPer = 20;
    if (hasJingdiao) fixedPer = 40;
    players.forEach(p => {
      if (p !== winner) {
        results[p] -= fixedPer;
        results[winner] += fixedPer;
      }
    });
  } else {
    let typeMult = 1;
    if (isZimo) typeMult *= 2;
    if (hasQixing && (hasQidui || hasDqidui)) {
      typeMult *= 4;
    } else if (hasQixing && hasShisanlan) {
      typeMult *= 4;
    } else {
      if (hasQidui) typeMult *= 2;
      if (hasDqidui) typeMult *= 2;
      if (hasShisanlan) typeMult *= 2;
      if (hasQixing) typeMult *= 4;
    }
    if (hasJingdiao) typeMult *= 2;
    if (hasGangshang) typeMult *= 2;
    if (hasQianggang) typeMult *= 2;
    if (hasDeguo) typeMult *= 2;

    const huScore = typeMult;

    if (isZimo) {
      players.forEach(p => {
        if (p === winner) return;
        let amount = huScore;
        if (p === dealer || winner === dealer) amount *= 2;
        if (hasDeguo) amount += 5;
        results[p] -= amount;
        results[winner] += amount;
      });
    } else if (hasDeguo) {
      players.forEach(p => {
        if (p === winner) return;
        let amount = huScore;
        if (p === paoPlayer) amount *= 2;
        if (p === dealer || winner === dealer) amount *= 2;
        if (p === paoPlayer) amount += 5;
        results[p] -= amount;
        results[winner] += amount;
      });
    } else {
      if (paoPlayer && paoPlayer !== 'none') {
        let amount = huScore * 2;
        if (paoPlayer === dealer || winner === dealer) amount *= 2;
        results[paoPlayer] -= amount;
        results[winner] += amount;
      }
    }
  }

  return results;
}

// === 测试用例 ===
// 约定：用 hu='dong', pao='xi', zhuang='nan' 做隔离测试时
// 胡牌基础分：huScore=1, 点炮×2=2, 无庄修饰 → dong+2, xi-2
const HU_BASE = { hu: 'dong', pao: 'xi', zhuang: 'nan' }; // 最小胡牌分:dong+2,xi-2

const tests = [
  // ====== 精牌分（用最小胡牌分隔离）======
  {
    name: "精牌：单家1副精（霸王）",
    config: { ...HU_BASE, dong: { fu: 1 } },
    // 精: dong base=1, 霸王→score=2, total=2
    // dong: 4*2-2=6, nan:-2, xi:-2, bei:-2
    // 胡: dong+2, xi-2
    expected: { dong: 8, nan: -2, xi: -4, bei: -2 }
  },
  {
    name: "精牌：单家1正精（霸王）",
    config: { ...HU_BASE, dong: { zheng: 1 } },
    // 精: dong base=2, 霸王→score=4, total=4
    // dong: 4*4-4=12, nan:-4, xi:-4, bei:-4
    // 胡: dong+2, xi-2
    expected: { dong: 14, nan: -4, xi: -6, bei: -4 }
  },
  {
    name: "精牌：两家各1副精（无霸王）",
    config: { ...HU_BASE, dong: { fu: 1 }, nan: { fu: 1 } },
    // 精: dong=1, nan=1, total=2
    // dong: 4*1-2=2, nan: 4*1-2=2, xi:-2, bei:-2
    // 胡: dong+2, xi-2
    expected: { dong: 4, nan: 2, xi: -4, bei: -2 }
  },
  {
    name: "精牌：三家有精(5子冲关×2)",
    config: { ...HU_BASE, dong: { fu: 1 }, nan: { fu: 2 }, xi: { zheng: 1 } },
    // 精: dong=1, nan=2, xi=2, total=5, 冲关×2
    // scores: dong=2, nan=4, xi=4, total=10
    // dong: 4*2-10=-2, nan: 4*4-10=6, xi: 4*4-10=6, bei:-10
    // 胡: dong+2, xi-2
    expected: { dong: 0, nan: 6, xi: 4, bei: -10 }
  },
  {
    name: "精牌：霸王+冲关(3正精=6子×3×2=36)",
    config: { ...HU_BASE, dong: { zheng: 3 } },
    // 精: dong base=6, total=6, 冲关×3, 霸王×2 → score=36
    // dong: 4*36-36=108, 其他:-36
    // 胡: dong+2, xi-2
    expected: { dong: 110, nan: -36, xi: -38, bei: -36 }
  },
  {
    name: "精牌：四家均有精(无霸王,无冲关)",
    config: { ...HU_BASE, dong: { fu: 1 }, nan: { fu: 1 }, xi: { fu: 1 }, bei: { fu: 1 } },
    // 精: 各base=1, total=4, no冲关no霸王
    // 各家: 4*1-4=0 → 精牌分全0
    // 胡: dong+2, xi-2
    expected: { dong: 2, nan: 0, xi: -2, bei: 0 }
  },

  // ====== 胡牌分：自摸 ======
  {
    name: "屁胡自摸：闲东胡，庄南",
    config: { hu: 'dong', zhuang: 'nan', pao: 'none' },
    // typeMult=2(自摸), huScore=2
    // 南(庄)付4, 西付2, 北付2 → 东收8
    expected: { dong: 8, nan: -4, xi: -2, bei: -2 }
  },
  {
    name: "屁胡自摸：庄南自己胡",
    config: { hu: 'nan', zhuang: 'nan', pao: 'none' },
    // 每家付2×2(庄)=4 → 南收12
    expected: { dong: -4, nan: 12, xi: -4, bei: -4 }
  },
  {
    name: "小七对自摸：闲东胡",
    config: { hu: 'dong', zhuang: 'nan', pao: 'none', huTypes: ['qidui'] },
    // typeMult=2×2=4, 南(庄)付8, 西北各付4 → 东收16
    expected: { dong: 16, nan: -8, xi: -4, bei: -4 }
  },
  {
    name: "精钓自摸：闲东胡（=自摸×2×精钓×2=×4）",
    config: { hu: 'dong', zhuang: 'nan', pao: 'none', huTypes: ['jingdiao'] },
    expected: { dong: 16, nan: -8, xi: -4, bei: -4 }
  },
  {
    name: "杠上花自摸：闲东胡（=自摸×2×杠上花×2=×4）",
    config: { hu: 'dong', zhuang: 'nan', pao: 'none', huTypes: ['gangshang'] },
    expected: { dong: 16, nan: -8, xi: -4, bei: -4 }
  },
  {
    name: "十三烂自摸：闲东胡",
    config: { hu: 'dong', zhuang: 'nan', pao: 'none', huTypes: ['shisanlan'] },
    // typeMult=2×2=4
    expected: { dong: 16, nan: -8, xi: -4, bei: -4 }
  },
  {
    name: "七星十三烂自摸：闲东胡",
    config: { hu: 'dong', zhuang: 'nan', pao: 'none', huTypes: ['shisanlan', 'qixing'] },
    // typeMult=2(自摸)×4(七星十三烂)=8
    // 南(庄)付16, 西北各付8 → 东收32
    expected: { dong: 32, nan: -16, xi: -8, bei: -8 }
  },

  // ====== 胡牌分：点炮 ======
  {
    name: "屁胡点炮：闲胡闲炮(无庄介入)",
    config: { hu: 'dong', zhuang: 'nan', pao: 'xi' },
    // huScore=1, 点炮×2=2, 无庄
    expected: { dong: 2, nan: 0, xi: -2, bei: 0 }
  },
  {
    name: "屁胡点炮：闲胡庄炮",
    config: { hu: 'dong', zhuang: 'nan', pao: 'nan' },
    // 1×2(点炮)×2(庄)=4
    expected: { dong: 4, nan: -4, xi: 0, bei: 0 }
  },
  {
    name: "屁胡点炮：庄胡闲炮",
    config: { hu: 'nan', zhuang: 'nan', pao: 'dong' },
    // 1×2(点炮)×2(庄)=4
    expected: { dong: -4, nan: 4, xi: 0, bei: 0 }
  },
  {
    name: "七对点炮：闲胡闲炮",
    config: { hu: 'dong', zhuang: 'nan', pao: 'xi', huTypes: ['qidui'] },
    // huScore=2(七对), 点炮×2=4
    expected: { dong: 4, nan: 0, xi: -4, bei: 0 }
  },
  {
    name: "七对点炮：庄胡闲炮",
    config: { hu: 'nan', zhuang: 'nan', pao: 'dong', huTypes: ['qidui'] },
    // huScore=2, 点炮×2×庄×2=8
    expected: { dong: -8, nan: 8, xi: 0, bei: 0 }
  },

  // ====== 德国 ======
  {
    name: "德国自摸：闲东胡，庄南",
    config: { hu: 'dong', zhuang: 'nan', pao: 'none', huTypes: ['deguo'] },
    // typeMult=2(自摸)×2(德国)=4
    // 南(庄)付 4×2+5=13, 西付4+5=9, 北付4+5=9 → 东收31
    expected: { dong: 31, nan: -13, xi: -9, bei: -9 }
  },
  {
    name: "德国自摸：庄南自己胡",
    config: { hu: 'nan', zhuang: 'nan', pao: 'none', huTypes: ['deguo'] },
    // 每家付 4×2(庄)+5=13 → 南收39
    expected: { dong: -13, nan: 39, xi: -13, bei: -13 }
  },
  {
    name: "德国点炮：闲东胡，闲西炮，庄南旁观",
    config: { hu: 'dong', zhuang: 'nan', pao: 'xi', huTypes: ['deguo'] },
    // huScore=2(德国), 西(点炮): 2×2+5=9, 南(庄,旁): 2×2(庄)=4, 北(旁): 2
    expected: { dong: 15, nan: -4, xi: -9, bei: -2 }
  },
  {
    name: "德国点炮：闲东胡，庄南炮",
    config: { hu: 'dong', zhuang: 'nan', pao: 'nan', huTypes: ['deguo'] },
    // 南(炮+庄): 2×2(炮)×2(庄)+5=13, 西(旁): 2, 北(旁): 2
    expected: { dong: 17, nan: -13, xi: -2, bei: -2 }
  },
  {
    name: "德国七对自摸：闲东胡",
    config: { hu: 'dong', zhuang: 'nan', pao: 'none', huTypes: ['deguo', 'qidui'] },
    // typeMult=2(自摸)×2(德国)×2(七对)=8
    // 南(庄)付 8×2+5=21, 西付8+5=13, 北付8+5=13 → 东收47
    expected: { dong: 47, nan: -21, xi: -13, bei: -13 }
  },

  // ====== 天胡地胡 ======
  {
    name: "天胡：庄南",
    config: { hu: 'nan', zhuang: 'nan', huTypes: ['tianhu'] },
    expected: { dong: -20, nan: 60, xi: -20, bei: -20 }
  },
  {
    name: "精钓天胡",
    config: { hu: 'nan', zhuang: 'nan', huTypes: ['tianhu', 'jingdiao'] },
    expected: { dong: -40, nan: 120, xi: -40, bei: -40 }
  },
  {
    name: "地胡：闲东",
    config: { hu: 'dong', zhuang: 'nan', huTypes: ['dihu'] },
    expected: { dong: 60, nan: -20, xi: -20, bei: -20 }
  },

  // ====== 杠（用最小胡牌分隔离）======
  {
    name: "暗杠1(东)",
    config: { ...HU_BASE, dong: { angang: 1 } },
    // 杠: 东+6, 其他各-2; 胡: dong+2, xi-2
    expected: { dong: 8, nan: -2, xi: -4, bei: -2 }
  },
  {
    name: "明杠1(东)",
    config: { ...HU_BASE, dong: { minggang: 1 } },
    // 杠: 东+3, 其他各-1; 胡: dong+2, xi-2
    expected: { dong: 5, nan: -1, xi: -3, bei: -1 }
  },
  {
    name: "东暗杠+南明杠",
    config: { ...HU_BASE, dong: { angang: 1 }, nan: { minggang: 1 } },
    // 杠: 东=6-1=5, 南=3-2=1, 西=-2-1=-3, 北=-2-1=-3
    // 胡: dong+2, xi-2
    expected: { dong: 7, nan: 1, xi: -5, bei: -3 }
  },
  {
    name: "杠精(东胡)",
    config: { ...HU_BASE, hu: 'dong', huTypes: ['gangjin'] },
    // 杠精: 东+30, 其他各-10; 胡: dong+2, xi-2
    expected: { dong: 32, nan: -10, xi: -12, bei: -10 }
  },

  // ====== 综合场景 ======
  {
    name: "综合：东2正精+南庄自摸七对+西1暗杠",
    config: { zhuang: 'nan', hu: 'nan', pao: 'none', dong: { zheng: 2 }, xi: { angang: 1 }, huTypes: ['qidui'] },
    // 精: dong base=4, 霸王, total=4<5, score=8, totalJingScore=8
    //   dong: 4*8-8=24, nan:-8, xi:-8, bei:-8
    // 杠(西1暗杠): 西+6, 东-2, 南-2, 北-2
    // 胡(南庄自摸七对): typeMult=2×2=4, 每家付4×2(庄)=8
    //   东-8, 西-8, 北-8, 南+24
    // 合计:
    //   东=24-2-8=14, 南=-8-2+24=14, 西=-8+6-8=-10, 北=-8-2-8=-18
    expected: { dong: 14, nan: 14, xi: -10, bei: -18 }
  },
  {
    name: "综合：东庄德国七对自摸+北2副精",
    config: { zhuang: 'dong', hu: 'dong', pao: 'none', bei: { fu: 2 }, huTypes: ['deguo', 'qidui'] },
    // 精: 北base=2, 霸王, score=4, total=4
    //   东:-4, 南:-4, 西:-4, 北:4*4-4=12
    // 胡: typeMult=2×2×2=8, 东是庄+胡, 每家付8×2(庄)+5=21
    //   南-21, 西-21, 北-21, 东+63
    // 合计:
    //   东=-4+63=59, 南=-4-21=-25, 西=-4-21=-25, 北=12-21=-9
    expected: { dong: 59, nan: -25, xi: -25, bei: -9 }
  },
  {
    name: "综合：精钓七对自摸(闲东胡)，南庄，北3副精+1正精=5子冲关",
    config: { zhuang: 'nan', hu: 'dong', pao: 'none', bei: { fu: 3, zheng: 1 }, huTypes: ['jingdiao', 'qidui'] },
    // 精: 北base=5, 霸王, total=5, 冲关×2, 霸王×2 → score=5*2*2=20
    //   东:4*0-20=-20, 南:-20, 西:-20, 北:4*20-20=60
    // 胡: typeMult=2(自摸)×2(精钓)×2(七对)=8
    //   南(庄)付 8×2(庄)=16, 西付8, 北付8 → 东收32
    // 合计:
    //   东=-20+32=12, 南=-20-16=-36, 西=-20-8=-28, 北=60-8=52
    expected: { dong: 12, nan: -36, xi: -28, bei: 52 }
  },

  // ====== 总和=0检查（不验证具体值）======
  {
    name: "总和检查：多精多杠混合",
    config: { zhuang: 'xi', hu: 'bei', pao: 'dong',
      dong: { zheng: 1, fu: 1, minggang: 2 },
      nan: { fu: 2, angang: 1 },
      xi: { zheng: 1 },
      bei: { fu: 1 },
      huTypes: ['qidui', 'deguo'] },
    expected: null
  },
  {
    name: "总和检查：德国七星十三烂自摸+精+杠精",
    config: { zhuang: 'dong', hu: 'xi', pao: 'none',
      dong: { zheng: 2 }, xi: { angang: 2 },
      huTypes: ['shisanlan', 'qixing', 'deguo', 'gangjin'] },
    expected: null
  },
];

// 运行
let passed = 0, failed = 0;
tests.forEach((t, i) => {
  const result = calc(t.config);
  const total = players.reduce((s, p) => s + result[p], 0);

  if (total !== 0) {
    failed++;
    console.log(`\x1b[31m✗ [${i+1}] ${t.name} - SUM=${total} ≠ 0\x1b[0m`);
    console.log(`  东=${result.dong} 南=${result.nan} 西=${result.xi} 北=${result.bei}`);
    return;
  }

  if (t.expected === null) {
    passed++;
    console.log(`\x1b[32m✓ [${i+1}] ${t.name}\x1b[0m (sum=0) 东=${result.dong} 南=${result.nan} 西=${result.xi} 北=${result.bei}`);
    return;
  }

  const mismatch = [];
  players.forEach(p => {
    if (result[p] !== t.expected[p]) mismatch.push(`${p}: got ${result[p]}, want ${t.expected[p]}`);
  });

  if (mismatch.length === 0) {
    passed++;
    console.log(`\x1b[32m✓ [${i+1}] ${t.name}\x1b[0m`);
  } else {
    failed++;
    console.log(`\x1b[31m✗ [${i+1}] ${t.name}\x1b[0m`);
    console.log(`  Got:  东=${result.dong} 南=${result.nan} 西=${result.xi} 北=${result.bei}`);
    console.log(`  Want: 东=${t.expected.dong} 南=${t.expected.nan} 西=${t.expected.xi} 北=${t.expected.bei}`);
    console.log(`  Diff: ${mismatch.join(', ')}`);
  }
});

console.log(`\n=== ${passed} passed, ${failed} failed, ${tests.length} total ===`);
process.exit(failed > 0 ? 1 : 0);
