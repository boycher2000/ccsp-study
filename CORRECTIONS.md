# 修正紀錄與待核對清單

這份清單來自對公開學習網站(OpenExamPrep)的核對。本專案的筆記是原創重寫,並針對下列問題做了處理。

## 已處理(用官方來源核對過)

| 子項 | 問題 | 處理 | 依據 |
|---|---|---|---|
| 4.1 | OWASP Top 10 版本 | 筆記列出 2025 版十項;註明 2021 版 SSRF 不再單獨列出 | [top10.owasp.org/2025](https://top10.owasp.org/2025) |
| 4.1 | LLM Top 10 命名過時(2023 命名) | 改列 2025 版十項 | [genai.owasp.org/llm-top-10](https://genai.owasp.org/llm-top-10/) |
| 1.5 | FIPS 140-2 / 140-3 | 大綱寫 140-2;筆記註明 140-3 為現行受理、140-2 於 2026-09-21 後移到 Historical | [NIST CMVP](https://csrc.nist.gov/projects/cryptographic-module-validation-program) |
| 6.2 | GAPP 已被更新 | 筆記註明 AICPA/CIMA Privacy Management Framework 為 2009 GAPP 的更新版;大綱仍列 GAPP,兩者都保留 | [AICPA & CIMA](https://www.aicpa-cima.com/resources/download/privacy-management-framework)(搜尋結果摘要,頁面全文未開啟) |

## 已處理(以通用知識修正,非逐項查證官方來源)

| 子項 | 問題 | 處理 |
|---|---|---|
| 1.3 | NSG 稱 allow/deny | 改為說明各平台不同(AWS security group 僅 allow,NACL 可 deny,Azure NSG 兩者皆有) |
| 2.1 | 糾刪碼「任一子集可重建」 | 改為「需達門檻數量的片段」 |
| 2.3 | masking「可被還原」 | 區分靜態遮罩(不可還原)與動態遮罩(顯示層) |
| 2.3 | Certificate Transparency 用法 | 不使用該說法;改以可信時間戳與簽章說明 |
| 2.7 | degauss 對 SSD | 註明消磁對 SSD 與快閃媒體不可靠 |
| 2.8 | NTP 同步等同可信時間戳 | 註明兩者不同 |
| 3.5 | RTO 與 MTD 混用 | 分開定義,RTO ≤ MTD |
| 4.2 | 把 safety 與 CIA 並列 | 移除 |
| 4.6 | entity expansion 與 XXE 混為一類 | 註明為不同攻擊 |
| 4.7 | OAuth 與 OIDC 未區分 | 明確區分委派授權與驗證 |
| 5.5 | 通報時限未寫 | 寫入 GDPR 第 33 條(控制者 72 小時;處理者通知控制者) |
| 6.3 | SSAE 未標版本 | 標註 SSAE 18 為現行、ISAE 3402 為國際對應 |
| 6.4 | 未提 GDPR 72 小時 | 於 5.5 補上 |

## 待核對(尚未用官方來源確認)

- **OWASP Top 10 的考試版本**:大綱只寫「OWASP Top-10」,沒指定年份。
- **SSRF 在 2025 版的歸屬**:OWASP 官方首頁沒有說明,二手來源稱併入 A01。
- **EU AI Act**:適用時程與風險分級細節,對照 EUR-Lex 官方文本。
- **NIST SP 800-61**:近年改版並對映 CSF 2.0,階段名稱需確認。
- **NIST SP 800-88**:現行版本需確認。
- **HIPAA Security Rule**:加密為 addressable 為既有規定;近年有修訂提案,現況需確認。
- **印度 DPDP Act**:跨境傳輸規則,對照官方文本。
- **GAPP 是否被正式撤銷**:搜尋結果只描述 PMF 為「更新版」,AICPA 頁面全文未讀。
- **CSA Security Guidance、ISO/IEC 27050/27037/27036 等標準內容**:僅憑通用知識撰寫,需對照標準目錄或官方頁面。
- **所有題目**:均為 `draft`,尚未逐題核對。

## 原網站已知但本專案尚未涵蓋的深度

偏薄項目(原站只有一段或一列)在本專案的筆記中也偏簡略,需要進一步補強:LLM Top 10 與 CWE Top 25 的細項、SAFECode、CSA Enterprise Architecture、FERPA / PIPEDA / DPDP 的具體內容、ISO/IEC 27050 的各部分、訴訟條款、AI 監控、內部資安控制系統。
