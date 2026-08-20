import { credentialsFromRequest, errorResponse, generateStructured, parseBody } from '@/lib/ai/client'
import { MATCH_SYSTEM, matchPrompt } from '@/lib/ai/prompts'
import { matchReportSchema, matchRequestSchema } from '@/lib/ai/schemas'

export async function POST(request: Request) {
  try {
    const credentials = credentialsFromRequest(request)
    const { resume, jobDescription } = await parseBody(request, matchRequestSchema)

    const report = await generateStructured({
      credentials,
      schema: matchReportSchema,
      system: MATCH_SYSTEM,
      prompt: matchPrompt(resume, jobDescription),
    })

    // Models drift outside a stated range often enough that the UI shouldn't have to cope
    // with a score of 120 or -5.
    return Response.json({
      ...report,
      score: Math.max(0, Math.min(100, Math.round(report.score))),
    })
  } catch (error) {
    return errorResponse(error)
  }
}
