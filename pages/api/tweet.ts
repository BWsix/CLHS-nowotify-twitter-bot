import { NextApiRequest, NextApiResponse } from "next";
import { TwitterApi } from "twitter-api-v2";
import { Deta } from "deta";

const twitterClient = new TwitterApi({
  clientId: process.env.CLIENT_ID as string,
  clientSecret: process.env.CLIENT_SECRET as string,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = req.body.token as string;
  if (token !== process.env.TOKEN) return res.status(401).end();

  const content = req.body.content as string;
  const link = req.body.link as string;
  const message = `${content}\n\n${link}`;

  const deta = Deta(process.env.PROJECT_KEY as string);
  const detaDB = deta.Base("this");

  const item = await detaDB.get("key");

  const { client: refreshedClient, refreshToken } =
    await twitterClient.refreshOAuth2Token(item!.refreshToken as string);

  await detaDB.update({ refreshToken }, "key");

  await refreshedClient.v2.tweet(message);

  return res.status(200).end();
}
