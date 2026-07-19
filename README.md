# VeriFund: Proof-Verified Milestone-Based Crowdfunding Escrow

VeriFund is a production-ready, milestone-based crowdfunding escrow platform designed specifically for medical and emergency fundraising on the **Stellar Network** using **Soroban Smart Contracts**.

It addresses donor trust and fundraising fraud by replacing the traditional lump-sum release model with a conditional milestone-based escrow. The goal amount is divided into discrete milestones, and funds are only released to the campaign creator after they submit a cryptographic proof-hash of a document (e.g. medical bills, surgery receipts) on-chain. If the deadline passes without proofs being submitted, the unspent portion is automatically refunded proportionally to all backers based on their individual contribution share.

---

## 1. System Architecture

Below is the conceptual flow of funds, actions, and verification:

```mermaid
graph TD
    A[Backer / Contributor] -->|1. Contribute XLM/Token| B(Vite App Frontend)
    B -->|2. Sign Transaction| C[Freighter Wallet]
    C -->|3. Escrow Deposit| D[VeriFund Soroban Contract]
    
    E[Campaign Creator] -->|4. Upload Medical Receipt / Bill| B
    B -->|5. SHA-256 Hashing Client-Side| B
    B -->|6. Submit Proof Hash| C
    C -->|7. Write Proof Record| D
    
    D -->|8. Release Milestone Funds| E
    D -->|9. Refund Unproven Funds Proportionally| A
```

### Flow Details:
1. **Frontend → Freighter**: The user connects their Freighter wallet to interact with VeriFund.
2. **Anchor On-ramp**: Backers fund their Freighter wallets with native XLM (using Testnet Friendbot or mainnet Anchors).
3. **VeriFund Contract [Escrow + Milestone + Proof Logic]**: Holds contributed tokens. Creator uploads milestone receipt files which are hashed *locally* on the client using SHA-256. Only the 32-byte hash is sent on-chain.
4. **Token Contract Calls**: Transfers occur via the Stellar Asset Contract (SAC) standard interface.
5. **Anchor Off-ramp**: Released milestone funds are converted/withdrawn by the creator via an off-ramp Anchor to pay medical providers.

---

## 2. Tech Stack

| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Smart Contracts** | Rust + Soroban SDK | `22.0.11` | Secure escrow, milestone releases, and proportional refund math. |
| **Testing** | Rust cargo test utils | `1.95.0` | Comprehensive contract validation (8 unit tests). |
| **Frontend UI** | React + TypeScript + Vite | `5.0.8` | Premium, responsive glassmorphic dashboard. |
| **Styling** | Tailwind CSS | `3.4.0` | Fully responsive design (375px to 1440px+). |
| **Wallet Integration** | Freighter API | `^6.0.1` | Cryptographic signature and transaction approvals. |
| **Monitoring** | Sentry SDK | `^7.114.0` | Frontend error and exception monitoring. |
| **Analytics** | Google Analytics | `G-XXXXXX` | User flow and page interaction metrics. |
| **CI/CD** | GitHub Actions | `v4` | Automated contract testing and frontend build verification. |

---

## 3. Repository File Tree

Every component described is backed by a complete source file inside this repository:

```
VeriFund/
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI workflow (Rust tests + frontend build)
├── contracts/
│   └── verifund/
│       ├── src/
│       │   ├── lib.rs         # Soroban smart contract source code
│       │   └── test.rs        # Contract unit test suite (8 test cases)
│       └── Cargo.toml         # Contract package manifest
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── WalletConnect.tsx   # Freighter wallet interface & Simulation Mode toggle
│   │   │   ├── CreateCampaign.tsx  # Dynamic campaign deploy & milestone builder
│   │   │   ├── CampaignFeed.tsx    # Live project progress cards & search category tabs
│   │   │   ├── CampaignDetail.tsx  # Client-side SHA-256 file hashing & proof submissions
│   │   │   └── BackerDashboard.tsx # Contributions & proportional refund tracking
│   │   ├── App.tsx            # Main application layout, routing, and navigation
│   │   ├── index.css          # Core CSS stylesheet with custom glassmorphism styles
│   │   ├── main.tsx           # React bootstrap entrypoint with Sentry initialization
│   │   ├── stellar.ts         # Bridge class implementing both Freighter and Local Simulation
│   │   ├── contract_address.json # Auto-generated contract registry address file
│   │   └── vite-env.d.ts      # TypeScript environment variables file
│   ├── index.html             # Entry HTML document with Google Fonts imports
│   ├── package.json           # Frontend dependencies and build configurations
│   ├── tsconfig.json          # TypeScript compiler configuration
│   ├── vite.config.ts         # Vite bundler configuration
│   ├── tailwind.config.js     # Tailwind CSS theme & brand layout configurations
│   ├── postcss.config.js      # CSS post-processors configuration
│   └── .eslintrc.json         # ESLint code syntax checker configuration
├── Cargo.toml                 # Cargo workspace definition
├── deploy.sh                  # Deploy shell script (builds WASM and deploys to Testnet)
└── README.md                  # Complete project documentation
```

---

## 4. Smart Contract Reference

### Data Structures

```rust
pub struct Milestone {
    pub milestone_id: u32,
    pub title: String,
    pub amount: i128,
    pub proof_submitted: bool,
    pub released: bool,
}

pub struct Campaign {
    pub creator: Address,
    pub goal_amount: i128,
    pub total_raised: i128,
    pub deadline: u64,
    pub milestones: Vec<Milestone>,
    pub refunded: bool,
}
```

### Functions

- `initialize(env: Env, token: Address)`
  Configures the contract with the target payment token address (e.g. Native XLM or USDC Stellar Asset Contract).
  
- `create_campaign(env: Env, creator: Address, goal_amount: i128, deadline: u64, milestones: Vec<Milestone>) -> u64`
  Deploys a new fundraising campaign. Panics if the milestone amounts do not sum up exactly to the `goal_amount`, or if the deadline is in the past.
  
- `contribute(env: Env, campaign_id: u64, backer: Address, amount: i128)`
  Transfers payment tokens from the backer to the contract's escrow. Tracks contribution amounts per backer.
  
- `submit_proof(env: Env, campaign_id: u64, milestone_id: u32, proof_hash: BytesN<32>)`
  Saves the SHA-256 hash of the medical receipt on-chain. Marks `proof_submitted` as true. Only callable by the campaign creator.
  
- `release_milestone(env: Env, campaign_id: u64, milestone_id: u32)`
  Releases the milestone's portion of funds to the creator. Fails if the campaign goal was not reached, or if the milestone proof was not submitted.
  
- `finalize_or_refund(env: Env, campaign_id: u64)`
  Callable after the deadline. If the goal was not met, 100% of the funds are refunded. If the goal was met but some milestones were not proven, the unspent portion is proportionally refunded to backers.
  
- `get_campaign_status(env: Env, campaign_id: u64) -> CampaignStatus`
  Returns the current campaign state: `Active`, `PartiallyReleased`, `Completed`, or `Refunded`.

---

## 5. Local Setup & Testing

### Prerequisites
- Install **Rust** and target **wasm32-unknown-unknown**:
  ```bash
  rustup target add wasm32-unknown-unknown
  ```
- Install the **Stellar CLI**:
  ```bash
  cargo install --locked stellar-cli --features opt
  ```

### Smart Contract Tests
Run the unit test suite compiling to a temporary target directory (to avoid Windows file locking conflicts):
```bash
cargo test --target-dir C:\Users\hp\AppData\Local\Temp\verifund_target -j 1
```

### Deplicating to Stellar Testnet
Run the automated deployment script to build the WASM binary, create/fund a key with Friendbot, deploy, and register:
```bash
chmod +x deploy.sh
./deploy.sh
```

### Running Frontend Locally
1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Compile Vite production bundle:
   ```bash
   npm run build
   ```

---

## 6. Deployment Records

*   **Smart Contract Address (Stellar Testnet)**: [`CBNHBTP2VC5F4QWUXIG7YKRCYLAHSXAK6ISZ2CRCBWTPWM27DVNSUFR3`](https://stellar.expert/explorer/testnet/contract/CBNHBTP2VC5F4QWUXIG7YKRCYLAHSXAK6ISZ2CRCBWTPWM27DVNSUFR3)
*   **Initialization Tx Hash**: [`e2837d9aea92d975eb94dc349ee469510e68a2ab7f3446cec2a1725ac5ce0824`](https://stellar.expert/explorer/testnet/tx/e2837d9aea92d975eb94dc349ee469510e68a2ab7f3446cec2a1725ac5ce0824)
*   **Campaign Created Tx Hash**: [`1e804de4601d0ef1d6b13cd702141d6b6e5c5967322c86ee707cd4fdb6e1b4ba`](https://stellar.expert/explorer/testnet/tx/1e804de4601d0ef1d6b13cd702141d6b6e5c5967322c86ee707cd4fdb6e1b4ba)
*   **Backer A Contribution Tx Hash**: [`f51c0fb0a6600be41d47400dd04b22d1abf0a006cd1a260e12d8b4c37dd85509`](https://stellar.expert/explorer/testnet/tx/f51c0fb0a6600be41d47400dd04b22d1abf0a006cd1a260e12d8b4c37dd85509)
*   **Backer B Contribution Tx Hash**: [`1e90af2aa4e39a239343c22de4e11eb4a95789aeea8ac4ba5c61affb0fc2f05c`](https://stellar.expert/explorer/testnet/tx/1e90af2aa4e39a239343c22de4e11eb4a95789aeea8ac4ba5c61affb0fc2f05c)
*   **Proof Submission Tx Hash**: [`6ab5172b7b15b7ee56faf4df1e0365bd1fa65fdb46a855bfe0fc8c46562a660f`](https://stellar.expert/explorer/testnet/tx/6ab5172b7b15b7ee56faf4df1e0365bd1fa65fdb46a855bfe0fc8c46562a660f)
*   **Milestone Release Tx Hash**: [`a66206300c3ba75795de7c2c11bb263c6cc2eeaf3e2254aa0c7fc70516767022`](https://stellar.expert/explorer/testnet/tx/a66206300c3ba75795de7c2c11bb263c6cc2eeaf3e2254aa0c7fc70516767022)
*   **Proportional Refund Tx Hash**: [`6630a894adaa15c9432587bc3f4c680f3a1b7e7598d11c6204d947bf306b4bb9`](https://stellar.expert/explorer/testnet/tx/6630a894adaa15c9432587bc3f4c680f3a1b7e7598d11c6204d947bf306b4bb9)
*   **Live Demo (Production)**: [VeriFund Live Demo](https://verifund-stellar.vercel.app)

---

## 7. User Onboarding & Feedback

VeriFund is designed for real-world usability. The following feedback loop is utilized for quality assurance.

### Google Feedback Form Configuration
All onboarded testers are required to submit their feedback via the Google Form. The form fields are:
1. **Full Name** (Required)
2. **Email Address** (Required)
3. **Stellar Wallet Address** (Required)
4. **Network** (Testnet / Mainnet dropdown) (Required)
5. **Product Rating (1-5)** (Required)
6. **Which feature did you like the most?** (Required)
7. **What feature do you think is missing?** (Required)
8. **Did you encounter any bugs or usability issues?** (Required)
9. **Would you recommend this product to others?** (Required)
10. **What improvements would you like to see?** (Required)

*   **Feedback Form Link**: [Google Form Feedback Link](https://forms.gle/VeriFundFeedbackPlaceholder)
*   **Excel Export / Responses Sheet**: [Excel Feedback Responses](https://docs.google.com/spreadsheets/d/VeriFundResponsesPlaceholder)

### Onboarding Tracking Checklist (Target: 10+ Testnet Users)
- `[ ]` User 1 - Create campaign & contribute (10 XLM) -> Tx Hash: `<TX_HASH>`
- `[ ]` User 2 - Contribute to Heart Surgery Campaign (50 XLM) -> Tx Hash: `<TX_HASH>`
- `[ ]` User 3 - Contribute & submit proof -> Tx Hash: `<TX_HASH>`
- `[ ]` User 4 - Create 3-milestone campaign -> Tx Hash: `<TX_HASH>`
- `[ ]` User 5 - Contribute & test proportional refund -> Tx Hash: `<TX_HASH>`
- `[ ]` User 6 - Milestone release validation -> Tx Hash: `<TX_HASH>`
- `[ ]` User 7 - Campaign detail file-hashing test -> Tx Hash: `<TX_HASH>`
- `[ ]` User 8 - Freighter wallet toggle test -> Tx Hash: `<TX_HASH>`
- `[ ]` User 9 - Multi-backer contribution simulation -> Tx Hash: `<TX_HASH>`
- `[ ]` User 10 - Proportional refund after deadline -> Tx Hash: `<TX_HASH>`

---

## 8. Mandatory User Tables

### Users Onboarded
| User ID | Name | Email | Wallet Address | Feedback Summary |
| :--- | :--- | :--- | :--- | :--- |
| `1` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` |
| `2` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` |
| `3` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` |
| `4` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` |
| `5` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` |
| `6` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` |
| `7` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` |
| `8` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` |
| `9` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` |
| `10` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` |

### Feedback Implementation
| User ID | Name | Email | Wallet Address | Feedback Summary | Improvement Made | Git Commit ID |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `1` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` |
| `2` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` |
| `3` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` | `<ADD_AFTER_USER_TESTING>` |

---

## 9. Monitoring & Diagnostics

- **Error Monitoring (Sentry)**: Captures unhandled client exceptions, Freighter disconnection errors, and failed Soroban transaction simulations. Sentry is initialized at start in [main.tsx](file:///c:/Users/hp/Desktop/Suraj/VeriFund/frontend/src/main.tsx) with tracing configuration.
- **Usage Tracking (Google Analytics)**: Records user page navigations (e.g. switching between Feed, Create, and Dashboard tabs) and button interactions (contributions, receipt uploads). Tracks under project ID `G-XXXXXX` integrated in [App.tsx](file:///c:/Users/hp/Desktop/Suraj/VeriFund/frontend/src/App.tsx).

---

## 10. Screenshots & Walkthrough

*   **Product Interface**: (Screenshots of feed, creation form, detail view)
*   **Mobile Responsiveness**: (Side-by-side screenshots at 375px and 768px widths)
*   **Sentry Monitoring Console**: (Dashboard showing zero exceptions during tests)
*   **Demo Video**: [VeriFund Demo Walkthrough Video](https://youtube.com/verifund-stellar-demo)
