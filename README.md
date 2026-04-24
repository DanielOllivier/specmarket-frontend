# 🎯 SpecMarket

**On-chain collectibles futures trading platform built on Solana**

Trade your favorite collectibles with leverage - from Pokémon cards to luxury watches, sneakers, and Magic: The Gathering cards.

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://specmarkfe2-puce.vercel.app)
[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF)](https://explorer.solana.com/address/9JsjBXM4HetB33ojaGMEwqJMqJY2DkFG6oHctCfASU3X?cluster=devnet)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

---

## ✨ Features

### 🔥 Core Trading
- **Long/Short Positions** - Bet on price movements in both directions
- **1-10x Leverage** - Amplify your exposure with customizable leverage
- **Take Profit & Stop Loss** - Set automatic exit orders for risk management
- **Real-time PnL** - Track your profit and loss as prices change
- **Multi-market Support** - Trade across 10+ different collectible markets

### 📊 Analytics & Insights
- **Live Analytics Dashboard** - Total TVL, Open Interest, market stats
- **Interactive Price Charts** - Multiple timeframes (1m, 5m, 15m, 1h, 1d)
- **Market Metrics** - Volume, OI distribution, long/short ratios
- **Portfolio Tracking** - Monitor all your positions in one place

### 🎨 User Experience
- **Wallet Integration** - Seamless Phantom wallet connection
- **Mobile Responsive** - Trade on any device
- **Real-time Updates** - Live price feeds and position updates
- **Category Filtering** - Browse by Pokemon, Luxury, Sneakers, MTG

---

## 🏗️ Architecture

### Smart Contract (Rust/Anchor)
Program ID: 9JsjBXM4HetB33ojaGMEwqJMqJY2DkFG6oHctCfASU3X
Network: Solana Devnet
Framework: Anchor 0.30.1
**Key Features:**
- Variable market seeds for unlimited market creation
- Collateralized positions with leverage
- Automatic PnL calculation
- Take profit/Stop loss orders on-chain
- Vault-based collateral management

### Frontend (Next.js/TypeScript)
Framework: Next.js 14.2.0
Wallet: Solana Wallet Adapter
Charts: Chart.js
Styling: Tailwind CSS
Deployment: Vercel
---

## 🚀 Live Demo

**🌐 Production:** [https://specmarkfe2-puce.vercel.app](https://specmarkfe2-puce.vercel.app)

**📍 Smart Contract:** [View on Solana Explorer](https://explorer.solana.com/address/9JsjBXM4HetB33ojaGMEwqJMqJY2DkFG6oHctCfASU3X?cluster=devnet)

---

## 🎮 How to Use

### 1. Connect Wallet
- Click "Select Wallet" button
- Choose Phantom (or your preferred Solana wallet)
- Approve connection

### 2. Get Devnet SOL
```bash
solana airdrop 2 YOUR_WALLET_ADDRESS --url devnet
```

### 3. Start Trading
- Browse markets on homepage
- Click "Trade Now" on any market
- Choose Long or Short
- Set size and leverage
- Confirm transaction

### 4. Manage Positions
- View all positions in "My Positions"
- Set Take Profit / Stop Loss
- Close positions anytime
- Track real-time PnL

---

## 💻 Local Development

### Prerequisites
```bash
Node.js 18+
npm or yarn
Solana CLI (optional)
```

### Installation

```bash
# Clone the repository
git clone https://github.com/DanielOllivier/specmarket-frontend.git
cd specmarket-frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_HOST=https://api.devnet.solana.com
```

---

## 📊 Available Markets

| Market | Category | Current Price |
|--------|----------|--------------|
| POK-BB-MODERN | Pokemon | $269.22 |
| ROLEX-SUB | Luxury | $12,500 |
| NIKE-J1 | Sneakers | $450 |
| ROLEX-DAYTONA | Luxury | $35,000 |
| NIKE-DUNK | Sneakers | $180 |
| YEEZY-350 | Sneakers | $320 |
| PATEK-NAU | Luxury | $85,000 |
| AP-ROYAL | Luxury | $45,000 |
| POK-BB-TWILIGHT | Pokemon | $145 |
| MTG-COMMANDER | MTG | $89 |

---

## 🔧 Tech Stack

### Blockchain
- **Solana** - High-performance blockchain
- **Anchor** - Solana development framework
- **Rust** - Smart contract language
- **SPL Token** - Token program for USDC collateral

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Chart.js** - Data visualization
- **@solana/web3.js** - Solana JavaScript API
- **@solana/wallet-adapter** - Wallet integration

### Infrastructure
- **Vercel** - Frontend hosting
- **GitHub** - Version control
- **Solana Devnet** - Smart contract deployment

---

## 📈 Roadmap

### ✅ Completed
- [x] Multi-market smart contract
- [x] Open/Close positions with leverage
- [x] Take Profit / Stop Loss orders
- [x] Analytics dashboard
- [x] Price charts
- [x] Mobile responsive UI
- [x] Production deployment

### 🔄 In Progress
- [ ] Keeper bot for automatic TP/SL execution
- [ ] Real-time price oracle integration
- [ ] Mainnet deployment

### 🔮 Future
- [ ] Leaderboard system
- [ ] Social features (copy trading)
- [ ] More markets (NFTs, domain names, etc.)
- [ ] Advanced order types
- [ ] Mobile app (PWA)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [Anchor](https://www.anchor-lang.com/)
- Powered by [Solana](https://solana.com/)
- UI inspired by modern DeFi protocols
- Thanks to the Solana developer community

---

## 📞 Contact

**Developer:** Daniel Ollivier

**Project Link:** [https://github.com/DanielOllivier/specmarket-frontend](https://github.com/DanielOllivier/specmarket-frontend)

**Live Demo:** [https://specmarkfe2-puce.vercel.app](https://specmarkfe2-puce.vercel.app)

---

## ⚠️ Disclaimer

This is a demonstration project deployed on Solana Devnet. Do not use real funds. Not financial advice.

---

<div align="center">
  <strong>Built with ❤️ on Solana</strong>
</div>
