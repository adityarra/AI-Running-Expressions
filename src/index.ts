/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	// If you set another name in wrangler.toml as the value for 'binding',
	// replace "AI" with the variable name you defined.
	AI: Ai;
  }
  
  export default {
	async fetch(request, env): Promise<Response> {

		const requestBody = await request.json();
		const userExpression = requestBody.userExpression;
		if (!userExpression) {
			return new Response(
				JSON.stringify({ error: "User expression is required." }),
				{ status: 400 }
			);
		}

		// const userExpression = "10 minutes easy run followed by (3 minutes fast and 2 minutes easy) * 6 repetitions + 10 minutes cool down";

		const systemPrompt = "Objective:\n\
Convert a user-provided running workout description into a structured workout expression, following a defined format with segments including Run Segments (RS), Interval Sessions (IS), Hill Runs (HR), Warm-Ups (WU), Cool-Downs (CD), and Sets (SET). Return only the final expression without additional text.\n\
\n\
Workout Segment Definitions\n\
Run Segment (RS)\n\
\n\
Format: RS[distance|time@pace]\n\
Example: RS[5K@T] - Run 5 kilometers at threshold pace.\n\
Example: RS[5-10K@T] - Run between 5 and 10 kilometers at threshold pace.\n\
\n\
Interval Session (IS)\n\
\n\
Format: IS[repsx(work_segment/recovery_segment)]\n\
Example: IS[3x(1K@T/2min@E)] - Perform 3 repetitions of running 1 kilometer at threshold pace, followed by 2 minutes of easy pace recovery.\n\
Example: IS[3-5x(1-2K@T/2-3min@E)] Perform between 3 and 5 repetitions of running 1 to 2 kilometers at threshold pace, followed by 2 to 3 minutes of easy pace recovery.\n\
\n\
Hill Run (HR)\n\
\n\
Format: HR[repsx(work_segment/recovery_segment)]\n\
Example: HR[5x(100m@S/100m@R)] - Perform 5 hill repetitions of running 100m speed intervals, followed by 100m of easy pace recovery.\n\
\n\
Warm-Up (WU)\n\
\n\
Format: WU[distance|time@pace]\n\
Example: WU[2K@E] - Warm up by running 2 kilometers at an easy pace.\n\
Example: WU[2-3K@E] - Warm up by running 2 to 3 kilometers at an easy pace.\n\
\n\
Cool-Down (CD)\n\
\n\
Format: CD[distance|time@pace]\n\
Example: CD[5min@G] - Cool down by running 5 minutes at a gentle pace.\n\
Example: CD[5-10min@G] -  Cool down by running 5 to 10 minutes at a gentle pace.\n\
\n\
Set (SET)\n\
\n\
Format: SET[repsx[workout_part]]\n\
Example: SET[2x[RS[3K@I]]] - Perform 2 sets of running 3 kilometers at interval pace.\n\
Example: SET[2-4x[RS[3-5K@I]]] - Perform between 2 and 4 sets of running 3 to 5 kilometers at interval pace.\n\
\n\
Units and Indicators\n\
\n\
Distance Units\n\
K: Kilometers\n\
m: Meters\n\
\n\
Time Units\n\
min: Minutes\n\
sec: Seconds\n\
\nPace Indicators\n\
E: Easy pace\n\
T: Threshold pace\n\
I: Interval pace\n\
S: Speed interval pace\n\
R: Recovery pace\n\
MP: Marathon pace\n\
HMP: Half-marathon pace\n\
TKP: 10K race pace\n\
5KP: 5K race pace\n\
G: Goal pace\n\
\n\
\nTask:\n\
Convert the user's workout description into a structured workout expression based on the above format.\n\
Make sure to completely follow the below guidelines to the letter and return the iutput of the format \"<running expression>\"\n\
\n\Formatting Guidelines\n\
Use square brackets[] to enclose workout details.\n\
Separate different workout segments with a plus sign+.\n\
Specify ranges using a dash - for distance, time, or repetitions (e.g., 5-10K, 1-2min, 2-4x).\n\
\n\
Examples of Workout Expressions\n\
Description: Warm up with 2 kilometers at an easy pace, then perform 4 repetitions of 800 meters at interval pace followed by 400 meters at an easy pace, and finish with a 10-minute gentle pace cool-down. Goal pace Workout for a 10K\n\
Expression:WU[2K@E]+IS[4x(800m@I/400m@E)]+CD[10min@R]\n\
Description: Warm up with 3 kilometers at an easy pace, then run 4 kilometers at 10K race pace, and finish with a 10-minute gentle pace cool-down. Workout with range\n\
Expression:WU[3K@E]+RS[4K@TKP]+CD[10min@R]\n\
Description: Warm up with 2 to 3 kilometers at an easy pace. Perform 4 repetitions of 800 meters at interval pace, followed by 400 meters at an easy pace. Cool down with 10 minutes at a recovery pace.\n\
Expression: WU[2-3K@E]+IS[4x(800m@I/400m@E)]+CD[10min@R]\n\
Description: Warm up with 5 kilometers at an easy pace. Run for 15 minutes at threshold pace. Perform 2 repetitions of 2000 meters at interval pace, followed by 2 minutes at an easy pace. Perform 2 repetitions of 400 meters at interval pace, followed by 2 minutes at an easy pace. Perform 2 repetitions of 50 seconds at speed interval pace, followed by 50 seconds at an easy pace. Run 5 kilometers at threshold pace. Run 1 kilometer at an easy pace. Cool down with 2 kilometers at an easy pace. Interval session with range of reps:\n\
Expression:WU[5K@E]+RS[15min@T]+IS[2x(2000m@I/2min@E)]+IS[2x(400m@I/2min@E)]+IS[2x(50sec@S/50sec@E)]+RS[5K@T]+RS[1K@E]+CD[2K@E]\n\
Expression: WU[5K@E]+RS[15min@T]+IS[1-3x(2000m@I/2min@E)]+IS[1-3x(400m@I/2min@E)]+IS[1-3x(50sec@S/50sec@E)]+RS[5K@T]+RS[1K@E]+CD[2K@E]\n\
Description: Warm up with 5 kilometers at an easy pace. Run for 15 minutes at threshold pace. Perform 1 to 3 repetitions of 2000 meters at interval pace, followed by 2 minutes at an easy pace. Perform 1 to 3 repetitions of 400 meters at interval pace, followed by 2 minutes at an easy pace. Perform 1 to 3 repetitions of 50 seconds at speed interval pace, followed by 50 seconds at an easy pace. Run 5 kilometers at threshold pace. Run 1 kilometer at an easy pace. Cool down with 2 kilometers at an easy pace.\n\
Addtional Instrutions: Unless explicitly mentioned, use the segment type RS with Pace indicator.  Avoid using WU and CD if not explicitly specified.";


		const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
			prompt: systemPrompt+"\nUser Expression: \n"+userExpression,
		});
  
		return new Response(JSON.stringify(response));
	},
} satisfies ExportedHandler<Env>;


  
