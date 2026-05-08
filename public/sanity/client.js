import { createClient } from "next-sanity";

export const client = createClient({
  projectId: "7qe12arj",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false,
});