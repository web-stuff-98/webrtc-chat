"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function authMiddleware(req, res, next) {
    console.log(`Token : ${JSON.stringify(req.headers.authorization)}`);
    next();
}
exports.default = authMiddleware;
//# sourceMappingURL=authMiddleware.js.map