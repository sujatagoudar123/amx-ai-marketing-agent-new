import { callAI } from "./service.js";

export async function runMarketingAgents(topic) {
  const content = await callAI(`Write PR article on ${topic}`);
  const seo = await callAI(`SEO optimize: ${content}`);
  const social = await callAI(`Create social posts: ${content}`);
  const review = await callAI(`Review PR tone: ${content}`);

  return { content, seo, social, review };
}