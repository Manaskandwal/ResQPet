/**
 * Role-based access control middleware factory.
 *
 * Usage:
 *   router.get('/admin-only', protect, allowRoles('admin'), handler)
 *   router.get('/ngo-or-admin', protect, allowRoles('ngo', 'admin'), handler)
 *
 * Also enforces isApproved for roles that require admin approval.
 */
const allowRoles = (...roles) => {
    return (req, res, next) => {
        try {
            console.log(
                `[RoleGuard] Checking role: ${req.user?.role} against allowed: [${roles.join(', ')}]`
            );

            if (!req.user) {
                return res.status(401).json({ success: false, message: 'Not authenticated.' });
            }

            if (!roles.includes(req.user.role)) {
                console.warn(
                    `[RoleGuard] Access denied for role '${req.user.role}' on route requiring [${roles.join(', ')}]`
                );
                return res.status(403).json({
                    success: false,
                    message: `Access denied. Requires role: ${roles.join(' or ')}.`,
                });
            }

            // Check approval status for roles that require it
            const approvalRequiredRoles = ['ngo', 'hospital', 'ambulance'];
            if (approvalRequiredRoles.includes(req.user.role) && !req.user.isApproved) {
                console.warn(`[RoleGuard] Unapproved ${req.user.role} attempted access: ${req.user.email}`);
                return res.status(403).json({
                    success: false,
                    message: 'Your account is pending admin approval. Please wait.',
                });
            }

            next();
        } catch (error) {
            console.error('[RoleGuard] Unexpected error:', error.message);
            res.status(500).json({ success: false, message: 'Server error in role check.' });
        }
    };
};

module.exports = { allowRoles };
