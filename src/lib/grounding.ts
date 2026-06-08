import type { QuizAnswers } from "./types";

// OPTIONAL grounding layer.
//
// To improve accuracy (especially for non-Western / hyper-local scenes), retrieve
// real, date- and place-tagged facts and feed them into the prompt as authoritative
// context. This is where you'd call a web-search API, a charts dataset, or fetch a
// Wikipedia "year in music" page for the listener's place and year.
//
// It returns an empty string by default so the app runs with no extra credentials.
// Wire in a provider here and the prompt builder will pass the result to Groq.
export async function gatherGrounding(_answers: QuizAnswers): Promise<string> {
  // Example shape of what to return once implemented:
  //   `Year-end chart highlights for ${place}, ${year}:\n- ...\n- ...`
  //
  // Implementation sketch (pseudo):
  //   const query = `popular songs ${answers.place} ${answers.year}`;
  //   const results = await searchProvider(query);
  //   return summarizeForPrompt(results);
  return "";
}
