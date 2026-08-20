import { credentialsFromRequest, errorResponse, generateStructured, parseBody } from '@/lib/ai/client'
import { REWRITE_BULLET_SYSTEM, rewriteBulletPrompt } from '@/lib/ai/prompts'
import { bulletVariantsSchema, rewriteBulletRequestSchema } from '@/lib/ai/schemas'

export async function POST(request: Request) {
  try {
    const credentials = credentialsFromRequest(request)
    const { bullet, context } = await parseBody(request, rewriteBulletRequestSchema)

    const result = await generateStructured({
      credentials,
      schema: bulletVariantsSchema,
      system: REWRITE_BULLET_SYSTEM,
      prompt: rewriteBulletPrompt(bullet, context),
    })

    // Drop empties and anything identical to what the user already has — an unchanged
    // "variant" is a dead row in the picker.
    const variants = result.variants
      .map((v) => ({ text: v.text.trim(), angle: v.angle.trim() }))
      .filter((v) => v.text && v.text !== bullet.trim())

    return Response.json({ variants })
  } catch (error) {
    return errorResponse(error)
  }
}
