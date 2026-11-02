## 先看這裡:CCSP 讀書地圖

> 一句話:CCSP 考的是「站在管理者角度,在雲端環境做出最適當的安全決策」。不是考你會不會操作某家雲平台。

### 考試資訊(官方大綱)

| 項目 | 內容 |
|---|---|
| 形式 | CAT 自適應測驗,100–150 題 |
| 時間 | 3 小時 |
| 通過分數 | 700 / 1000(量表分數,不是答對 70%) |
| 題型 | 選擇題與進階題型(advanced item types) |
| 語言 | 英文、中文、德文、日文 |
| 報名資格 | 5 年 IT 全職經驗,其中 3 年資安、1 年在 CCSP 六個 domain 之一;學位或 CCSK 可抵 1 年;有效 CISSP 可抵全部 |
| 沒達年資 | 通過後成為 Associate of ISC2,6 年內補足年資 |

> 待核對:CAT 的計分與終止機制(例如是否固定含未計分預試題)只見於培訓機構的說明,ISC2 官方頁面未確認。

### 六個 domain 與權重

| Domain | 名稱 | 權重 | 子項 |
|---|---|---|---|
| D1 | 雲端概念、架構與設計 | 17% | 6 |
| D2 | 雲端資料安全 | 20% | 9 |
| D3 | 雲端平台與基礎設施安全 | 17% | 5 |
| D4 | 雲端應用程式安全 | 16% | 7 |
| D5 | 雲端安全營運 | 17% | 6 |
| D6 | 法律、風險與合規 | 13% | 5 |

> 重點:權重是平均值。6 個 domain 都要顧,尤其不要放棄 D6:它權重最小,但考生普遍認為最容易失分(此為培訓機構說法,非官方數據)。

### 三問法:看到題目先問這三件事

> 口訣:**Who(誰負責)→ Where(資料在哪)→ Proof(用什麼證明)**

1. **Who:這項責任屬於誰?** 客戶、CSP,還是雙方?依服務模型(IaaS / PaaS / SaaS)而定。無論哪種模型,**客戶永遠對自己的資料與身分管理負責**。
2. **Where:資料在生命週期的哪個階段、在哪個地點?** 階段(Create / Store / Use / Share / Archive / Destroy)決定控制措施;地點(區域、管轄權)決定適用法規。
3. **Proof:用什麼證據證明?** 合約條款、SLA、稽核報告(SOC 2 Type II、ISO 27001)、認證、日誌。雲端中你摸不到機房,**證據取代實地檢查**。

再加兩條決策原則:
- **管理者視角**:優先治理、風險、契約,而不是動手改設定。
- **先評估再實作**:題目問「首先該做什麼」,答案通常是評估、規劃、確認需求。

### 責任分擔總表(誰管哪一層)

| 層級 | On-premises | IaaS | PaaS | SaaS |
|---|---|---|---|---|
| 資料與分類 | 客戶 | 客戶 | 客戶 | 客戶 |
| 身分與存取管理 | 客戶 | 客戶 | 客戶 | 客戶(使用者與權限設定) |
| 應用程式 | 客戶 | 客戶 | 客戶 | CSP |
| 執行環境、中介軟體 | 客戶 | 客戶 | CSP | CSP |
| 作業系統 | 客戶 | 客戶 | CSP | CSP |
| 虛擬化、hypervisor | 客戶 | CSP | CSP | CSP |
| 實體主機、儲存、網路 | 客戶 | CSP | CSP | CSP |
| 實體機房 | 客戶 | CSP | CSP | CSP |

> 備註:這是通用分法。各家 CSP 的分界略有差異,答題以題目描述的服務模型為準。

### 看題技巧(綜合考生心得)

> Tip:以下來自公開考生心得與培訓機構說明,是經驗談,不是官方規則。

- **選項很像是常態**:先自己想答案,再看選項,避免被干擾選項帶走。
- **留意限定詞**:BEST、FIRST、MOST、PRIMARILY、LEAST。
- **不要用你工作中的經驗或偏好的雲平台作答**,要用「vendor-neutral 的最佳實務」。
- **「首先」多半是評估或規劃**,不是直接實作或買工具。
- **無法確定時**:先排除最明顯錯的兩個,在剩下兩個中選一個,往前走。CAT 不能回頭修改。
- **看時間**:平均每題約 1.2–1.8 分鐘。

### 縮寫速查

| 縮寫 | 全名 | 一句話 |
|---|---|---|
| CSP / CSC | Cloud Service Provider / Customer | 提供者 / 使用者 |
| SLA | Service Level Agreement | 服務等級協議,可量化指標與補償 |
| RTO / RPO | Recovery Time / Point Objective | 多久內恢復 / 最多損失多少時間的資料 |
| MTD | Maximum Tolerable Downtime | 業務能承受的最長中斷;RTO 必須 ≤ MTD |
| BIA | Business Impact Analysis | 辨識關鍵流程與衝擊 |
| KMS / HSM | Key Management Service / Hardware Security Module | 金鑰管理服務 / 硬體金鑰保管設備 |
| BYOK / HYOK | Bring / Hold Your Own Key | 自帶金鑰 / 金鑰只留在客戶端 |
| DLP / IRM | Data Loss Prevention / Information Rights Management | 偵測外流 / 權限隨檔案走 |
| CASB | Cloud Access Security Broker | 客戶與雲端服務之間的控制點 |
| IAM / IdP / SSO | Identity and Access Management / Identity Provider / Single Sign-On | 身分存取管理 / 身分提供者 / 單一登入 |
| SAML / OIDC / OAuth | — | 企業 SSO / 驗證層 / 委派授權 |
| WAF / DAM | Web Application Firewall / Database Activity Monitoring | 第 7 層網頁防護 / 資料庫活動監控 |
| SAST / DAST / IAST / SCA | — | 靜態 / 動態 / 互動式測試 / 軟體組成分析 |
| SIEM / SOAR / SOC | — | 日誌關聯 / 編排自動化回應 / 安全營運中心 |
| SOC 1/2/3 | System and Organization Controls | 財報控制 / 信任服務準則 / 公開摘要 |
| PII / PHI | Personally Identifiable / Protected Health Information | 個資 / 健康資訊 |
| DPIA / PIA | (Data) Privacy Impact Assessment | 隱私衝擊評估 |
| MSA / SOW | Master Service Agreement / Statement of Work | 主協議 / 工作說明書 |
| ISMS | Information Security Management System | 資訊安全管理系統(ISO/IEC 27001) |
| CCM / CAIQ | Cloud Controls Matrix / Consensus Assessments Initiative Questionnaire | CSA 的控制矩陣 / 評估問卷 |

### 建議的讀書順序

1. 先讀 **D1**(建立共同語言),再讀 **D2**(權重最高)。
2. D3、D4、D5 依自己的背景調整順序;沒有開發背景的人給 D4 多一點時間。
3. **D6 不要留到最後一週**:法規與合約需要反覆記憶與情境練習。
4. 每讀完一個子項,到[刷題入口](../quiz/)做該子項的題目;做錯的回來看「易錯陷阱」。
