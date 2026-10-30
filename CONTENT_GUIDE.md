# 內容撰寫規則

## 來源規則

1. **範圍以官方大綱為準**:`docs/data/outline.json` 對應 ISC2 官方大綱。新增或修改子項前,先對照官方 PDF。
2. **事實以權威來源為準**:法規用官方法規資料庫(如 EUR-Lex)、標準用標準組織頁面、OWASP 清單用 owasp.org / genai.owasp.org、NIST 用 nist.gov。第三方部落格與培訓機構頁面只當線索。
3. **查不到就標「待核對」**,不要寫成結論。筆記中用 `> 待核對:…` 區塊。
4. **不收錄考古題**。ISC2 考試受保密協議約束;也不複製出版社或第三方網站的題目與解析。
5. **內容用自己的話寫**,不要整段複製任何網站或書籍。

## 題目格式(`docs/data/questions/dN.json`)

```json
{
  "id": "D2-2.7-001",
  "domain": 2,
  "topic": "2.7",
  "difficulty": 1,
  "status": "draft",
  "stem": "題幹(英文,貼近正式考試)",
  "options": ["…", "…", "…", "…"],
  "answer": 1,
  "explain": "整體解析(繁體中文)",
  "why": ["選項 A 為何對或錯", "…", "…", "…"],
  "tags": ["legal-hold"],
  "source": ["GDPR Art. 33"]
}
```

- `id`:`D<domain>-<topic>-<三位序號>`,不重複。
- `status`:`draft`(AI 產生、未核對)、`reviewed`(已人工檢視)、`verified`(已對照權威來源,**必須填 `source`**)。
- `why` 長度必須等於 `options`,順序相同。
- 作答時網頁會隨機打亂選項順序,所以解析不要寫「A 選項」,要寫內容。

## 出題風格(依考生心得與大綱)

- 以情境題為主,題幹英文、解析繁體中文。
- 常用題型:best / first / most / least / primarily。
- **干擾選項要合理且相近**:考生最常說的難點是選項彼此很像,不是題幹難。不要做明顯錯誤的選項。
- 「首先該做什麼」類題目,正解傾向評估、規劃、確認需求,而不是直接實作。
- 刻意設計相近概念辨別題,例如:masking / tokenization / anonymization / pseudonymization;incident / problem management;SOC 1/2/3 與 Type I/II;SAST / DAST / IAST / SCA;RTO / RPO / MTD;due care / due diligence;controller / processor / custodian。
- 法律與合規(D6)的題目偏情境判斷:「適用哪個法規」「供應商有什麼義務」。
- 題數依官方權重分配:D1 17%、D2 20%、D3 17%、D4 16%、D5 17%、D6 13%。

## 出題流程

1. 選定子項與大綱要點,確認要點在筆記中有說明。
2. 產生題目,每批不超過 50 題。
3. 執行 `python scripts/validate.py`。
4. 抽查解析與事實,用權威來源核對後把 `status` 改為 `verified` 並填 `source`。
