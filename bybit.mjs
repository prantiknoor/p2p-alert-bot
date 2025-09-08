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

  start(id, { paymentMethod, maxPrice, minAmount, maxAmount }) {
    console.log("Started:", id);

    if (this.intervals[id]) clearInterval(this.intervals[id]);

    const _run = async () => {
      try {
        const ads = await this.getP2POnlineAds({ paymentMethod, maxPrice, minAmount, maxAmount });
        console.log(ads.length);

        const formattedAds = ads.map((ad, i) => {
          const url = `https://www.bybit.com/en/fiat/trade/otc/profile/${ad.userMaskId}/USDT/USD/item`
          const text = `<b>${ad.nickName}</b> | ${ad.minAmount}~${ad.maxAmount} USD | ${ad.quantity} USDT | <b>$${ad.price}</b>`
          return `<a href="${url}">${text}</a>`
        });

        if (formattedAds) this.emit("ad", { id, ads: formattedAds });
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

  async getP2POnlineAds({ paymentMethod, maxPrice, minAmount, maxAmount }) {
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
      && parseFloat(ad.maxAmount) >= minAmount
      && parseFloat(ad.minAmount) <= maxAmount
    ).sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

    return ads;
  }
}

/**
 const ads = res.result.items
  .filter(ad =>
    ad.payments.includes(paymentMethod) &&
    parseFloat(ad.price) <= maxPrice &&
    parseFloat(ad.minAmount) <= maxAmount &&   // ad allows buying up to your max
    parseFloat(ad.maxAmount) >= minAmount      // ad allows at least your min
  )
  .sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
 */