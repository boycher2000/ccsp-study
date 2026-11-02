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

## 對照公開筆記(Jeff 資安長的 HackMD)後的處理

參考:陳詰昌(Jeff 資安長)公開的 CCSP 筆記。他的筆記是舊大綱(權重 D4 17%、D5 16%,章節有 5.8、6.6),但與 2026 大綱高度重疊;**本專案只採納重疊且正確的知識點,用自己的話整理,放在各子項的「補充重點(對照 Jeff 的筆記)」區塊**。

### 採納(例)

雲端特性與角色補充、cloud bursting、同態加密、密碼學詞彙與金鑰管理原則、IAAA 與帳號生命週期、CSA 威脅清單、各服務類別的特有風險、備份模式、BIA 與 CBA 的雲端考量、lock-in 與 lock-out、EAL 與 FIPS 等級、資料分散與 bit-splitting、儲存威脅、雜湊特性、DLP 三元件、探索與分類方法、IRM 功能、法律保全重點、SIEM 能力、SDN 與資源分配、風險定量與定性、guest 與 host escape、BC/DR 流程與演練、SSDLC 方法、測試類型、供應鏈與開源比較、容器、IAM、補丁與備份、變更管理流程、證據五特性、法律類型與 GDPR 原則、SLA 與合約要點。

### 不採納或已修正的說法

| 他的寫法 | 問題 | 本專案作法 |
|---|---|---|
| 把五種特性標為 ISO 17788 | ISO/IEC 17788 列六項,含 multi-tenancy | 六項並註明 NIST 為五項 |
| CASB 是提供 SSO、憑證管理與金鑰託管的第三方 | 混淆了 CASB 與身分供應商 | 在 1.1 明確標注兩者不同 |
| 「RTO(recovery time objective):熱備援/暖備援/冷備援」 | 那是備援站點類型,不是 RTO 的定義 | RTO 與 MTD、WRT 分開定義 |
| 「tokenization 是另一種可接受的加密方式」 | Tokenization 不是加密 | 2.3 明確標注 |
| ASVS Level 1 = 滲透測試驗證 | 描述不精確 | 以三個驗證等級的一般定義取代 |
| 1.2 把 DevSecOps 列入相關技術 | 2026 大綱該條沒有 DevSecOps(2025 版有) | 不列入該條 |
| 只列 FIPS 140-2 | NIST 以 140-3 為現行 | 保留大綱字面並註明 140-3 |
| 隱私責任矩陣(IaaS 基礎架構「共同負責」等) | 分法與一般責任分擔不一致,未採用 | 沿用 overview 的責任分擔總表 |

### 舊大綱專有、未採納

- 重複出現的 5.x 段落(5.2 到 5.4 內容重疊)、6.6 獨立章節:2026 大綱已併入 6.5。
- 2.8「隱私保護」:2026 大綱把隱私放在 6.2。

### 待核對

- CSA 威脅清單(此處採 2016 年「Treacherous 12」)在考試中是否仍以此版為準。
- 「層級不超過 4 層」「Level 2 需要角色式驗證」等細節為一般說法,未逐項對照標準原文。
