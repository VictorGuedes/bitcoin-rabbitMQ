import { config } from "dotenv";
import axios from "axios";
import Period from "./enums/Period";
import { createMessageChannel } from "./messages/messageChannel";
import Candle from "./models/Candle";

config();

const readMarketPrice = async (): Promise<number> => {
  const result = await axios.get(process.env.PRICES_API);
  const price = result.data.bitcoin.usd;
  return price;
};

const getPrices = async () => {
  const messageChannel = await createMessageChannel();

  if (messageChannel) {
    while (true) {
      const loopTimes = Period.ONE_MINUTE / Period.TEN_SECONDS;
      const candle = new Candle("BTC");

      console.log("----------------");
      console.log("GET BITCOIN VALUES");

      for (let i = 0; i < loopTimes; i++) {
        const price = await readMarketPrice();
        candle.addValue(price);
        console.log(`Market price #${i + 1} of ${loopTimes} is ${price}`);
        await new Promise((r) => setTimeout(r, Period.TEN_SECONDS));
      }

      candle.closeCandle();
      console.log("Candle close");
      const candleObj = candle.toSimpleObj();
      console.log(candleObj);
      const bitPrice = JSON.stringify(candleObj);
      messageChannel.sendToQueue(process.env.QUEUE_NAME, Buffer.from(bitPrice));

      console.log("Bitcoin price on RabbitMQ");
    }
  }
};

getPrices();
