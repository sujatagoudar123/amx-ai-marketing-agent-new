import { runMarketingAgents } from "../lib/orchestrator.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { topic } = req.body;
  const data = await runMarketingAgents(topic);

  res.json(data);
}