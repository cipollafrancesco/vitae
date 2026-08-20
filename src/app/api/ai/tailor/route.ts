import { credentialsFromRequest, errorResponse, generateStructured, parseBody } from '@/lib/ai/client'
import { reconcileSkillsOrder, usableBulletPatches } from '@/lib/ai/applyTailorPatch'
import { TAILOR_SYSTEM, tailorPrompt } from '@/lib/ai/prompts'
import { tailorPatchSchema, tailorRequestSchema } from '@/lib/ai/schemas'

// POST is never cached by Next, so no segment config is needed here.
export async function POST(request: Request) {
  try {
    const credentials = credentialsFromRequest(request)
    const { resume, jobDescription } = await parseBody(request, tailorRequestSchema)

    const patch = await generateStructured({
      credentials,
      schema: tailorPatchSchema,
      system: TAILOR_SYSTEM,
      prompt: tailorPrompt(resume, jobDescription),
    })

    // Reconcile against the resume here as well as in the browser. The client needs the same
    // functions anyway to render the review, but filtering server-side means a bad generation
    // never reaches the UI as a row the user could click.
    return Response.json({
      ...patch,
      bullets: usableBulletPatches(resume, patch.bullets),
      skillsOrder: reconcileSkillsOrder(resume, patch.skillsOrder),
    })
  } catch (error) {
    return errorResponse(error)
  }
}
