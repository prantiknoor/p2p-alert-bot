import { RestClientV5 } from "bybit-api";
import "dotenv/config";
import { EventEmitter } from "events";

export class P2PAlertBybit extends EventEmitter {
  constructor() {
    super();

    this.client = new RestClientV5({
      key: process.env.BYBIT_API_KEY,
      secret: process.env.BYBIT_API_SECRET,
      parseAPIRateLimits: true,
    })

    this.intervals = {}
  }

  start(id, { paymentMethod, maxPrice, minAmount, maxOfMin }) {
    console.log("Started:", id);

    if (this.intervals[id]) clearInterval(this.intervals[id]);

    const _run = async () => {
      try {
        const ads = await this.getP2POnlineAds({ paymentMethod, maxPrice, minAmount, maxOfMin });
        console.log(ads.length);

        const msg = ads.map((ad, i) => {
          const url = `https://www.bybit.com/en/fiat/trade/otc/profile/${ad.userMaskId}/USDT/USD/item`
          // const text = `<b>${ad.nickName}</b> is selling USDT at $${ad.price} ${ad}`
          const text = `<b>${ad.nickName}</b> | ${ad.minAmount}~${ad.maxAmount} USD | ${ad.quantity} USDT | <b>$${ad.price}</b>`
          return `${i + 1}. <a href="${url}">${text}</a>`
        }).join('\n');

        if (msg) this.emit("ad", { id, msg });
      } catch (err) {
        console.error("Error in _run:", err);
        this.emit("error", err);
      }
    }

    _run();
    this.intervals[id] = setInterval(_run, 60 * 1000);
  }

  stop(id) {
    console.log("Stoped:", id);

    clearInterval(this.intervals[id]);
  }

  async getP2POnlineAds({ paymentMethod, maxPrice, minAmount, maxOfMin }) {
    const res = await this.client.getP2POnlineAds({
      tokenId: "USDT",
      currencyId: "USD",
      side: "1", // BUY
      size: "1000"
    })

    if (res['ret_code'] != 0) { throw new Error(res['ret_msg']); }

    const ads = res.result.items.filter(ad =>
      ad.payments.includes(paymentMethod)
      && parseFloat(ad.price) <= maxPrice
      && parseFloat(ad.minAmount) >= minAmount
      && parseFloat(ad.minAmount) <= maxOfMin
    ).sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

    return ads;
  }
}
