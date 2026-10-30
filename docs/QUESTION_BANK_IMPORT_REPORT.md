# 題庫匯入報告（自動產生）

- 來源檔案：`IT_Emperor_DseMcQs.xlsx`
- SHA-256：`6a3da5101698ae8201a0d3290b557d68c6db61ed94247444a9fd9cfb0266733d`
- 匯入時間：2026-10-30T09:05:29Z
- 匯入工作表：`Questions`（Topic_* 分頁只供人手檢閱，不匯入）

## 摘要

| 項目 | 數量 |
|---|---|
| 題目總數 | 414 |
| 成功匯入 | 382 |
| 拒絕 | 32 |
| 重複 ID | 0 |
| Topic（有題目／Topics 表） | 16 / 17 |
| 狀態 approved | 14 |
| 狀態 review | 368 |
| **正式版可用（approved）** | **14** |

## 答案分佈（已匯入題目）

| 答案 | 數量 | 比例 |
|---|---|---|
| A | 124 | 32% |
| B | 168 | 44% |
| C | 77 | 20% |
| D | 13 | 3% |

⚠ 答案 D 少於 15%，學生可能憑「很少選 D」猜中答案。建議題庫平衡答案位置，或遊戲顯示時打亂選項次序（待決定）。

## 公式儲存格（已保留公式文字，未使用 Excel 計算結果）

| 列 | 儲存格 | 欄位 | 保留文字 | Excel 顯示 |
|---|---|---|---|---|
| 17 | G17 | option_a | `=$B3*D$1` | `#VALUE!` |
| 17 | H17 | option_b | `=$B2*C$1` | `#VALUE!` |
| 17 | I17 | option_c | `=$C3*D$2` | `#VALUE!` |
| 17 | J17 | option_d | `=$B3*C$1` | `#VALUE!` |
| 41 | G41 | option_a | `=RANK(C2,$C$2:$C$6,0)` | `#VALUE!` |
| 41 | H41 | option_b | `=RANK(C2,$C$2:$C$6,1)` | `#VALUE!` |
| 41 | I41 | option_c | `=RANK(C2,C2:C6,0)` | `#VALUE!` |
| 41 | J41 | option_d | `=RANK($C$2,$C$2:$C$6,0)` | `#VALUE!` |

建議在 Excel 中把這些儲存格改為文字（在公式前加 `'`），避免日後顯示 `#VALUE!`。

## 拒絕的題目（需要在 Excel 修正）

| 列 | question_id | 原因 |
|---|---|---|
| 314 | ICT-2018-IA-24 | topic_id 'NETWORK' is not in the Topics sheet |
| 315 | ICT-2018-IA-26 | topic_id 'NETWORK' is not in the Topics sheet |
| 316 | ICT-2018-IA-27 | topic_id 'NETWORK' is not in the Topics sheet |
| 317 | ICT-2018-IA-28 | topic_id 'NETWORK' is not in the Topics sheet |
| 319 | ICT-2018-IA-31 | topic_id 'ALGORITHM' is not in the Topics sheet |
| 320 | ICT-2018-IA-34 | topic_id 'ALGORITHM' is not in the Topics sheet |
| 328 | DSE2017-06 | topic_id 'INFO' is not in the Topics sheet |
| 332 | DSE2017-22 | topic_id 'DATA' is not in the Topics sheet |
| 333 | DSE2017-23 | topic_id 'NETDEVICE' is not in the Topics sheet |
| 334 | DSE2017-24 | topic_id 'NETWORK' is not in the Topics sheet |
| 348 | DSE2013-30 | topic_id 'ALGORITHM' is not in the Topics sheet |
| 351 | DSE2014-24 | topic_id 'NETWORK' is not in the Topics sheet |
| 352 | DSE2014-33 | topic_id 'ALGORITHM' is not in the Topics sheet |
| 356 | DSE2015-29 | topic_id 'ALGORITHM' is not in the Topics sheet |
| 359 | DSE2016-32 | topic_id 'ALGORITHM' is not in the Topics sheet |
| 363 | DSE2016-06 | topic_id 'DATA' is not in the Topics sheet |
| 369 | DSE2016-24 | topic_id 'NETWORK' is not in the Topics sheet |
| 370 | DSE2016-30 | topic_id 'ALGORITHM' is not in the Topics sheet |
| 379 | DSE2017-26 | topic_id 'NETWORK' is not in the Topics sheet |
| 381 | DSE2017-30 | topic_id 'ALGORITHM' is not in the Topics sheet |
| 382 | DSE2017-31 | topic_id 'ALGORITHM' is not in the Topics sheet |
| 383 | DSE2017-32 | topic_id 'ALGORITHM' is not in the Topics sheet |
| 384 | DSE2017-33 | topic_id 'ALGORITHM' is not in the Topics sheet |
| 387 | DSE2013-03 | topic_id 'DATA' is not in the Topics sheet |
| 388 | DSE2013-04 | topic_id 'DATA' is not in the Topics sheet |
| 393 | DSE2013-29 | topic_id 'NETWORK' is not in the Topics sheet |
| 394 | DSE2013-31 | topic_id 'ALGORITHM' is not in the Topics sheet |
| 395 | DSE2013-32 | topic_id 'ALGORITHM' is not in the Topics sheet |
| 401 | DSE2014-25 | topic_id 'NETWORK' is not in the Topics sheet |
| 402 | DSE2014-26 | topic_id 'NETWORK' is not in the Topics sheet |
| 409 | DSE2015-12 | topic_id 'DATA' is not in the Topics sheet |
| 413 | DSE2015-24 | topic_id 'NETWORK' is not in the Topics sheet |

### 不在 Topics 表的 topic_id

- `ALGORITHM`：13 題
- `NETWORK`：12 題
- `DATA`：5 題
- `INFO`：1 題
- `NETDEVICE`：1 題

請在 Topics 表新增這些 Topic，或把題目改用現有的 topic_id。匯入器不會自行猜測對應。
