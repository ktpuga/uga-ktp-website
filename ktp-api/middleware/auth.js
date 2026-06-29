const { createRemoteJWKSet, jwtVerify } = require("jose")

// Fetched once and cached — jose handles key rotation automatically
const JWKS = createRemoteJWKSet(
  new URL(`${process.env.AUTHENTIK_ISSUER}jwks/`)
)

async function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing authorization header" })
  }

  const token = header.slice(7)

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: process.env.AUTHENTIK_ISSUER,
    })

    // Attach the verified user identity to the request
    req.user = {
      authentik_id: payload.sub,
      username: payload.preferred_username ?? payload.sub,
      groups: payload.groups ?? [],
    }

    next()
  } catch (err) {
    console.error("[auth]", err.message)
    return res.status(401).json({ message: "Invalid or expired token" })
  }
}

module.exports = { requireAuth }
