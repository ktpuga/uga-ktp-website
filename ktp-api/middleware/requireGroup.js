function requireGroup(...allowedGroups) {
  return (req, res, next) => {
    const userGroups = req.user?.groups ?? []
    if (!userGroups.some(g => allowedGroups.includes(g))) {
      return res.status(403).json({ message: "Forbidden" })
    }
    next()
  }
}

module.exports = { requireGroup }
